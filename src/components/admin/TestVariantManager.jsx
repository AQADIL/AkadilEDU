import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  Clock,
  Users
} from 'lucide-react';
import { createTest, updateTest, deleteTest, fetchTestsBySubject } from '../../firebase/testModule';
import { getTestStatistics } from '../../firebase/rtdbApi';
import TestBuilder from './TestBuilder';

export default function TestVariantManager({ subject, onBack }) {
  const { t } = useTranslation();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTest, setEditingTest] = useState(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testStats, setTestStats] = useState({});

  useEffect(() => {
    loadTestVariants();
  }, [subject]);

  const loadTestVariants = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading test variants for subject:', subject);
      
      // Получаем все тесты для данного предмета
      const subjectTests = await fetchTestsBySubject(subject);
      console.log('📚 Found tests:', subjectTests);
      
      setTests(subjectTests);
      
      // Загружаем статистику для каждого теста
      const stats = {};
      for (const test of subjectTests) {
        try {
          const testStat = await getTestStatistics(test.id);
          stats[test.id] = testStat;
        } catch (error) {
          console.warn('Failed to load stats for test', test.id);
        }
      }
      setTestStats(stats);
      
    } catch (error) {
      console.error('Error loading test variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariant = () => {
    setEditingTest({ 
      subjects: [subject],
      timeLimit: 60,
      language: 'kk'
    });
    setShowBuilder(true);
  };

  const handleEditTest = (test) => {
    setEditingTest(test);
    setShowBuilder(true);
  };

  const handleSaveTest = async (testData) => {
    try {
      console.log('📋 TestVariantManager: Saving test data:', testData);
      
      if (editingTest.id) {
        console.log('✏️ Updating existing test:', editingTest.id);
        await updateTest(editingTest.id, testData);
      } else {
        console.log('➕ Creating new test variant');
        const newTestId = await createTest(testData);
        console.log('✅ New test variant created with ID:', newTestId);
      }
      
      console.log('🔄 Reloading test variants...');
      await loadTestVariants();
      
      setShowBuilder(false);
      setEditingTest(null);
      console.log('✅ Test variant save process completed');
    } catch (error) {
      console.error('❌ Error saving test variant:', error);
      alert(t('common.error') + ': ' + error.message);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (window.confirm(t('admin.confirmDeleteTest'))) {
      try {
        await deleteTest(testId);
        await loadTestVariants();
      } catch (error) {
        console.error('Error deleting test:', error);
        alert(t('common.error'));
      }
    }
  };

  const handleManageQuestions = (test) => {
    setSelectedTest(test);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
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

  if (selectedTest) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedTest(null)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('admin.manageQuestions')}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedTest.title} 
                {selectedTest.variant && selectedTest.variant > 1 && ` - ${t('admin.variant')} ${selectedTest.variant}`}
              </p>
            </div>
          </div>
        </div>

        {/* Question Management Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('admin.totalQuestions')}: {selectedTest.totalQuestions || 0}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('test.subjects.' + subject)} - {selectedTest.totalQuestions || 0} {t('admin.questions')}
            </p>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              {t('admin.addQuestion')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('test.subjects.' + subject)} - {t('admin.testVariants')}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Управление вариантами тестов по предмету
            </p>
          </div>
        </div>
        
        <button
          onClick={handleCreateVariant}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Создать вариант</span>
        </button>
      </div>

      {/* Test Variants Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tests.map((test) => (
          <div key={test.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Test Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <h3 className="font-semibold text-lg truncate">
                {test.title}
                {test.variant && test.variant > 1 && (
                  <span className="text-blue-100 text-sm ml-2">- {t('admin.variant')} {test.variant}</span>
                )}
              </h3>
              <p className="text-blue-100 text-sm">
                {t('test.subjects.' + subject)}
              </p>
            </div>

            {/* Test Info */}
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

              {/* Statistics */}
              {testStats[test.id] && (
                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {testStats[test.id].totalAttempts || 0} {t('admin.attempts')}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {t('admin.avgScore')}: {testStats[test.id].averageScore || 0}%
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex space-x-2">
              <button
                onClick={() => handleManageQuestions(test)}
                className="flex items-center space-x-1 px-3 py-2 text-sm bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg transition-colors flex-1"
              >
                <Eye className="h-4 w-4" />
                <span>{t('admin.manageQuestions')}</span>
              </button>
              
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
        ))}

        {/* Empty State */}
        {tests.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Нет вариантов тестов
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Создайте первый вариант теста для предмета {t('test.subjects.' + subject)}
            </p>
            <button
              onClick={handleCreateVariant}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mx-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Создать первый вариант</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
