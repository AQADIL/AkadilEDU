import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Clock,
  Users,
  BarChart3,
  Folder,
  ChevronDown,
} from 'lucide-react';
import { createTest, updateTest, deleteTest } from '../../firebase/testModule';
import { fetchAvailableTests, getTestStatistics } from '../../firebase/rtdbApi';
import TestBuilder from './TestBuilder';

import AppLoader from '../AppLoader';

export default function TestManager() {
  const { t } = useTranslation();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTest, setEditingTest] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);

  const [testStats, setTestStats] = useState({});
  const [openFolders, setOpenFolders] = useState({});

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      const testsList = await fetchAvailableTests();
      setTests(testsList);

      const stats = {};
      for (const test of testsList) {
        try {
          stats[test.id] = await getTestStatistics(test.id);
        } catch (error) {
          stats[test.id] = { totalAttempts: 0, averageScore: 0 };
        }
      }
      setTestStats(stats);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = () => {
    setEditingTest({
      title: '',
      subjects: [],
      timeLimit: 60,
      language: 'kk',
    });
    setShowBuilder(true);
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setShowBuilder(true);
  };

  const handleSaveTest = async (testData) => {
    try {
      if (editingTest.id) {
        await updateTest(editingTest.id, testData);
      } else {
        await createTest(testData);
      }

      await loadTests();
      setShowBuilder(false);
      setEditingTest(null);
    } catch (error) {
      alert(t('common.error') + ': ' + error.message);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm(t('admin.confirmDeleteTest'))) {
      try {
        await deleteTest(testId);
        await loadTests();
      } catch (error) {
        alert(t('common.error'));
      }
    }
  };

  if (loading) {
    return <AppLoader text={t('common.loading')} />;
  }

  if (showBuilder) {
    return (
      <TestBuilder
        test={editingTest}
        onSave={handleSaveTest}
        onCancel={() => {
          setShowBuilder(false);
          setEditingTest(null);
        }}
      />
    );
  }

  const groups = tests.reduce((acc, test) => {
    const subjects = Array.isArray(test.subjects) ? test.subjects : [];
    const key = subjects[0] || '__NO_SUBJECT__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(test);
    return acc;
  }, {});

  const folderKeys = Object.keys(groups).sort((a, b) => {
    if (a === '__NO_SUBJECT__') return 1;
    if (b === '__NO_SUBJECT__') return -1;
    return a.localeCompare(b, 'kk-KZ');
  });

  const renderTestCard = (test) => (
    <div
      key={test.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <h3 className="font-semibold text-lg truncate">
          {test.title}
          {test.variant && test.variant > 1 && (
            <span className="text-blue-100 text-sm ml-2">
              - {t('admin.variant')} {test.variant}
            </span>
          )}
        </h3>
        {test.subjects && test.subjects.length > 0 && (
          <p className="text-blue-100 text-sm">
            {test.subjects.map((s) => t(`test.subjects.${s}`)).join(' / ')}
          </p>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {test.totalQuestions || 0} {t('test.questions')}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600 dark:text-gray-400">
              {test.timeLimit || 60} {t('test.minutes')}
            </span>
          </div>
        </div>

        {testStats[test.id] && (
          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {testStats[test.id].totalAttempts} {t('admin.attempts')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {testStats[test.id].averageScore}% {t('admin.avgScore')}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {test.subjects?.map((subject) => (
            <span
              key={subject}
              className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
            >
              {t(`test.subjects.${subject}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
        <button
          onClick={() => handleEditTest(test)}
          className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-colors"
        >
          <Edit className="h-4 w-4" />
        </button>

        <button
          onClick={() => handleDeleteTest(test.id)}
          className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg transition-colors"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('admin.testManagement')}
        </h2>
        <div className="flex space-x-3">
          <button
            onClick={handleCreateTest}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('admin.createTest')}</span>
          </button>
        </div>
      </div>

      {tests.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('admin.noTestsYet')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('admin.createFirstTest')}</p>
          <button
            onClick={handleCreateTest}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t('admin.createTest')}</span>
          </button>
        </div>
      )}

      {folderKeys.map((folderKey) => {
        const label =
          folderKey === '__NO_SUBJECT__' ? t('admin.noFolder') : t(`test.subjects.${folderKey}`);
        const groupTests = groups[folderKey];
        const isOpen = openFolders[folderKey] ?? false;
        return (
          <div
            key={folderKey}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700"
          >
            <button
              type="button"
              onClick={() => setOpenFolders((prev) => ({ ...prev, [folderKey]: !isOpen }))}
              className="w-full flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                  <Folder className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                    {label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {groupTests.length} {t('admin.tests') || 'tests'}
                  </div>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div className="px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {groupTests.map((test) => renderTestCard(test))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
