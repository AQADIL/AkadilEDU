import i18n from '../../i18n';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Calculator,
  FileText,
  Users,
  ArrowRight,
  X,
  Clock,
  Target,
  List,
  History,
  Trophy,
  Award,
  Globe,
  FlaskConical,
} from 'lucide-react';
import CertificateGenerator from '../CertificateGenerator';
import { fetchAvailableTests, fetchUserResults } from '../../firebase/rtdbApi';
import { getCurrentUser } from '../../firebase/auth';
import AppLoader from '../AppLoader';

const SUBJECTS = [
  {
    id: 'kazakh_history',
    nameKey: 'test.subjects.kazakhHistory',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-600',
    activeBorder: 'border-amber-500',
    description: 'test.subjects.kazakhHistoryDesc',
  },
  {
    id: 'math_literacy',
    nameKey: 'test.subjects.mathLiteracy',
    icon: Target,
    color: 'from-green-500 to-emerald-600',
    activeBorder: 'border-emerald-500',
    description: 'test.subjects.mathLiteracyDesc',
  },
  {
    id: 'reading_literacy',
    nameKey: 'test.subjects.readingLiteracy',
    icon: BookOpen,
    color: 'from-purple-500 to-violet-600',
    activeBorder: 'border-purple-500',
    description: 'test.subjects.readingLiteracyDesc',
  },
  {
    id: 'profile1',
    nameKey: 'test.subjects.profile1',
    icon: Users,
    color: 'from-orange-500 to-red-600',
    activeBorder: 'border-orange-500',
    description: 'test.subjects.profile1Desc',
  },
  {
    id: 'profile2',
    nameKey: 'test.subjects.profile2',
    icon: Users,
    color: 'from-pink-500 to-rose-600',
    activeBorder: 'border-pink-500',
    description: 'test.subjects.profile2Desc',
  },
];

const PROFILE_PAIRS = [
  { id: 'math_physics', label: 'ui.mathematicsPhysics', subjects: ['math', 'physics'] },
  {
    id: 'math_geography',
    label: 'ui.mathematicsGeography',
    subjects: ['math', 'geography'],
  },
  {
    id: 'world_history_geography',
    label: 'ui.worldHistoryGeography',
    subjects: ['world_history', 'geography'],
  },
  {
    id: 'biology_chemistry',
    label: 'ui.biologyChemistry',
    subjects: ['biology', 'chemistry'],
  },
  {
    id: 'biology_geography',
    label: 'ui.biologyGeography',
    subjects: ['biology', 'geography'],
  },
  {
    id: 'foreign_world_history',
    label: 'ui.englishWorldHistory',
    subjects: ['foreign_language', 'world_history'],
  },
  {
    id: 'language_literature',
    label: 'ui.languageLiterature',
    subjects: ['language_of_instruction', 'literature'],
  },
  {
    id: 'geography_foreign',
    label: 'ui.geographyEnglish',
    subjects: ['geography', 'foreign_language'],
  },
  {
    id: 'chemistry_physics',
    label: 'ui.chemistryPhysics',
    subjects: ['chemistry', 'physics'],
  },
  {
    id: 'world_history_law',
    label: 'ui.worldHistoryLaw',
    subjects: ['world_history', 'basics_of_law'],
  },
  {
    id: 'math_informatics',
    label: 'ui.mathematicsComputerScience',
    subjects: ['math', 'informatics'],
  },
];

const PROFILE_SUBJECTS = [
  { id: 'math', nameKey: 'test.subjects.math', icon: Calculator },
  { id: 'physics', nameKey: 'test.subjects.physics', icon: FlaskConical },
  { id: 'chemistry', nameKey: 'test.subjects.chemistry', icon: FlaskConical },
  { id: 'biology', nameKey: 'test.subjects.biology', icon: FlaskConical },
  { id: 'geography', nameKey: 'test.subjects.geography', icon: Globe },
  { id: 'world_history', nameKey: 'test.subjects.world_history', icon: BookOpen },
  { id: 'foreign_language', nameKey: 'test.subjects.foreign_language', icon: Globe },
  {
    id: 'language_of_instruction',
    nameKey: 'test.subjects.language_of_instruction',
    icon: FileText,
  },
  { id: 'literature', nameKey: 'test.subjects.literature', icon: BookOpen },
  { id: 'basics_of_law', nameKey: 'test.subjects.basics_of_law', icon: FileText },
  { id: 'informatics', nameKey: 'test.subjects.informatics', icon: Target },
];

export default function TestLanding({ onStartTest }) {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);
  const [, setSelectedTest] = useState(null);

  const [showTestModal, setShowTestModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [userResults, setUserResults] = useState([]);
  const [resultsByTestId, setResultsByTestId] = useState({});
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProfilePairId, setSelectedProfilePairId] = useState(null);
  const [selectedProfileSubjects, setSelectedProfileSubjects] = useState([]);
  const [showProfileSubjectModal, setShowProfileSubjectModal] = useState(false);
  const [, setActiveProfileSlot] = useState(null);
  const [selectedProfileSingleSubject, setSelectedProfileSingleSubject] = useState(null);

  const pickRandomTestForSubject = (subjectId) => {
    const candidates = (availableTests || []).filter(
      (test) => Array.isArray(test.subjects) && test.subjects.includes(subjectId),
    );
    if (candidates.length === 0) return null;
    const index = Math.floor(Math.random() * candidates.length);
    return candidates[index];
  };

  useEffect(() => {
    loadAvailableTests();
    loadUserResults();
    setUser(getCurrentUser());
  }, []);

  const loadAvailableTests = async () => {
    try {
      const tests = await fetchAvailableTests();
      setAvailableTests(tests || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const loadUserResults = async () => {
    try {
      const results = await fetchUserResults();
      const safeResults = results || [];
      setUserResults(safeResults);

      const map = {};
      safeResults.forEach((res) => {
        if (!res.testId) return;
        const existing = map[res.testId];
        if (!existing || new Date(res.finishedAt) > new Date(existing.finishedAt)) {
          map[res.testId] = res;
        }
      });
      setResultsByTestId(map);
    } catch (error) {}
  };

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    if (mode === 'full') {
      setSelectedSubjects([
        'kazakh_history',
        'math_literacy',
        'reading_literacy',
        'profile1',
        'profile2',
      ]);
      setSelectedProfilePairId(null);
      setSelectedProfileSubjects([]);
    } else if (mode === 'creative') {
      setSelectedSubjects(['kazakh_history', 'reading_literacy']);
      setSelectedProfilePairId(null);
      setSelectedProfileSubjects([]);
    } else {
      setSelectedSubjects([]);
    }
  };

  const handleSubjectToggle = (subjectId) => {
    if (selectedMode === 'creative') {
      return;
    }

    if (selectedMode === 'single' || !selectedMode) {
      setSelectedMode('single');
      setSelectedSubjects([subjectId]);
      setSelectedProfileSingleSubject(null);
    } else {
      setSelectedSubjects((prev) =>
        prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
      );
    }
  };

  const handleProfileSubjectSelect = (subjectId) => {
    setSelectedMode('single');
    setSelectedProfileSingleSubject(subjectId);
    setSelectedSubjects([subjectId]);
    setShowProfileSubjectModal(false);
    setActiveProfileSlot(null);
  };

  const handleStartTest = () => {
    if (selectedSubjects.length === 0) {
      alert(t('test.selectSubjectFirst'));
      return;
    }

    let mode = selectedMode;
    if (!mode) {
      mode = selectedSubjects.length === 1 ? 'single' : 'full';
    }

    if (mode === 'creative') {
      const allSubjects = ['kazakh_history', 'reading_literacy'];

      const composedTests = [];
      for (const subj of allSubjects) {
        const test = pickRandomTestForSubject(subj);
        if (!test) {
          alert(t('test.noTestsForSubject'));
          return;
        }
        composedTests.push({
          testId: test.id,
          subject: subj,
          title: test.title || '',
          timeLimit: test.timeLimit || null,
        });
      }

      const testConfig = {
        testId: `creative_${Date.now()}`,
        mode: 'creative',
        subjects: allSubjects,
        composedTests,
        title: t('test.creativeModeTitle'),
        timeLimit: 70,
        creativeMode: true,
        startedAt: new Date().toISOString(),
      };

      onStartTest(testConfig);
      return;
    }

    if (mode === 'single') {
      const subjectId = selectedSubjects[0];
      const chosenTest = pickRandomTestForSubject(subjectId);
      if (!chosenTest) {
        alert(t('test.noTestsForSubject'));
        return;
      }

      const testConfig = {
        testId: chosenTest.id,
        mode: 'single',
        subjects:
          Array.isArray(chosenTest.subjects) && chosenTest.subjects.length > 0
            ? chosenTest.subjects
            : [subjectId],
        title: chosenTest.title,
        timeLimit: chosenTest.timeLimit || 60,
        startedAt: new Date().toISOString(),
      };
      onStartTest(testConfig);
      return;
    }

    if (mode === 'full') {
      if (!selectedProfilePairId || selectedProfileSubjects.length !== 2) {
        alert(t('test.chooseProfileSubjects'));
        return;
      }

      const mandatorySubjects = ['kazakh_history', 'math_literacy', 'reading_literacy'];
      const allSubjects = [...mandatorySubjects, ...selectedProfileSubjects];

      const composedTests = [];
      for (const subj of allSubjects) {
        const test = pickRandomTestForSubject(subj);
        if (!test) {
          alert(t('test.noTestsForSubject'));
          return;
        }
        composedTests.push({
          testId: test.id,
          subject: subj,
          title: test.title || '',
          timeLimit: test.timeLimit || null,
        });
      }

      const testConfig = {
        testId: `full_${Date.now()}`,
        mode: 'full',
        subjects: allSubjects,
        profilePairId: selectedProfilePairId,
        profileSubjects: selectedProfileSubjects,
        composedTests,
        title: t('test.fullMockTest'),
        timeLimit: 240,
        startedAt: new Date().toISOString(),
      };

      onStartTest(testConfig);
    }
  };

  if (loading) {
    return <AppLoader text={t('common.loading')} />;
  }

  const getSingleMeta = (subjectId) => {
    if (!subjectId) {
      return { minutes: 0, questions: 0 };
    }
    if (subjectId === 'kazakh_history') {
      return { minutes: 40, questions: 20 };
    }
    if (subjectId === 'math_literacy' || subjectId === 'reading_literacy') {
      return { minutes: 30, questions: 10 };
    }
    return { minutes: 100, questions: 40 };
  };

  const getSummaryMeta = () => {
    const mode = selectedMode || (selectedSubjects.length === 1 ? 'single' : 'full');
    if (mode === 'full') {
      return { minutes: 240, questions: 120 };
    }
    if (mode === 'creative') {
      return { minutes: 70, questions: 30 };
    }
    if (mode === 'single') {
      const subjectId = selectedSubjects[0] || null;
      return getSingleMeta(subjectId);
    }
    return { minutes: 0, questions: 0 };
  };

  const getResultModeLabel = (result) => {
    if (!result) return i18n.t('ui.untPracticeTest');
    if (result.mode === 'creative') return t('test.creativeModeTitle');
    if (result.mode === 'full') return t('test.fullMockTest');
    if (result.mode === 'single') return t('test.singleSubject');
    return i18n.t('ui.untPracticeTest');
  };

  const getResultSubjectsLine = (result) => {
    if (!result || !Array.isArray(result.subjects) || result.subjects.length === 0) {
      return '';
    }
    const labels = result.subjects.map((subjectId) => t(`test.subjects.${subjectId}`));
    return labels.join(' · ');
  };

  const getResultDisplayTitle = (result) => {
    const modeLabel = getResultModeLabel(result);
    const subjectsLine = getResultSubjectsLine(result);
    if (subjectsLine) {
      return `${modeLabel} – ${subjectsLine}`;
    }
    return modeLabel;
  };

  const summaryMeta = getSummaryMeta();

  const singleModeSubjectId = selectedSubjects[0] || null;
  const singleSubjectTests = singleModeSubjectId
    ? (availableTests || [])
        .filter(
          (test) =>
            test.mode === 'single' &&
            Array.isArray(test.subjects) &&
            test.subjects.includes(singleModeSubjectId),
        )
        .sort((a, b) => {
          const av = typeof a.variant === 'number' ? a.variant : Number.POSITIVE_INFINITY;
          const bv = typeof b.variant === 'number' ? b.variant : Number.POSITIVE_INFINITY;
          if (av !== bv) return av - bv;
          return (a.title || '').localeCompare(b.title || '');
        })
    : [];

  const visibleSubjects =
    selectedMode === 'creative'
      ? SUBJECTS.filter((s) => s.id === 'kazakh_history' || s.id === 'reading_literacy')
      : selectedMode === 'single'
        ? SUBJECTS.filter((s) => s.id !== 'profile2')
        : SUBJECTS;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {t('test.ubtPracticeTests')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('test.chooseTestMode')}
        </p>
      </div>

      {userResults.length > 0 && (
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setShowHistoryModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <History className="h-5 w-5" />
            <span>{t('test.viewHistory')}</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {userResults.length}
            </span>
          </button>
        </div>
      )}

      {showProfileSubjectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('test.chooseProfileSubjects')}
              </h3>
              <button
                onClick={() => {
                  setShowProfileSubjectModal(false);
                  setActiveProfileSlot(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {t('test.singleSubject')} – {t('test.focusedPractice')}
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                {PROFILE_SUBJECTS.map((profile) => {
                  const Icon = profile.icon;
                  const isSelected = selectedProfileSingleSubject === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => handleProfileSubjectSelect(profile.id)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {t(profile.nameKey)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div
          onClick={() => handleModeChange('single')}
          className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
            selectedMode === 'single'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-xl ${selectedMode === 'single' ? 'bg-blue-500' : 'bg-gray-400'}`}
            >
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('test.singleSubject')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{t('test.singleSubjectDesc')}</p>
              <div className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
                • {t('test.chooseOneSubject')}
                <br />• {t('test.focusedPractice')}
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleModeChange('full')}
          className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
            selectedMode === 'full'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-xl ${selectedMode === 'full' ? 'bg-blue-500' : 'bg-gray-400'}`}
            >
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('test.fullMockTest')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{t('test.fullMockTestDesc')}</p>
              <div className="mt-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
                • {t('test.allSubjects')}
                <br />• {t('test.realExamExperience')}
              </div>
            </div>
          </div>
        </div>

        <div
          onClick={() => handleModeChange('creative')}
          className={`cursor-pointer p-6 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
            selectedMode === 'creative'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-purple-300'
          }`}
        >
          <div className="flex items-start space-x-4">
            <div
              className={`p-3 rounded-xl ${selectedMode === 'creative' ? 'bg-purple-500' : 'bg-gray-400'}`}
            >
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('test.creativeModeTitle')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{t('test.creativeModeNote')}</p>
            </div>
          </div>
        </div>
      </div>

      {selectedMode === 'full' && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            {t('test.chooseProfileSubjects')}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {PROFILE_PAIRS.map((pair) => {
              const isSelected = selectedProfilePairId === pair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  onClick={() => {
                    setSelectedProfilePairId(pair.id);
                    setSelectedProfileSubjects(pair.subjects);
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/10'
                  }`}
                >
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {t(pair.label)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          {selectedMode === 'single' ? t('test.selectSubject') : t('test.selectedSubjects')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleSubjects.map((subject) => {
            const Icon = subject.icon;
            const isProfilePlaceholder = subject.id === 'profile1' || subject.id === 'profile2';

            const hasSingleProfile = selectedMode === 'single' && !!selectedProfileSingleSubject;
            const hasFullProfile =
              selectedMode === 'full' &&
              Array.isArray(selectedProfileSubjects) &&
              selectedProfileSubjects.length === 2;

            const isProfileSelected = isProfilePlaceholder && (hasSingleProfile || hasFullProfile);
            const isSelected = isProfilePlaceholder
              ? isProfileSelected
              : selectedSubjects.includes(subject.id);

            const isDisabled =
              !isProfilePlaceholder &&
              selectedMode === 'single' &&
              selectedSubjects.length > 0 &&
              !isSelected;

            const handleClick = () => {
              if (isProfilePlaceholder) {
                if (selectedMode === 'full') return;
                setActiveProfileSlot(subject.id);
                setShowProfileSubjectModal(true);
                return;
              }
              if (!isDisabled) {
                handleSubjectToggle(subject.id);
              }
            };

            let titleText = t(subject.nameKey);
            let descText = t(subject.description);

            if (isProfilePlaceholder) {
              if (hasSingleProfile) {
                titleText = t(`test.subjects.${selectedProfileSingleSubject}`);
                descText = t('test.subjects.profile1Desc');
              } else if (hasFullProfile) {
                const idx = subject.id === 'profile1' ? 0 : 1;
                const subjId = selectedProfileSubjects[idx];
                if (subjId) {
                  titleText = t(`test.subjects.${subjId}`);
                  descText = t('test.subjects.profile1Desc');
                }
              }
            }

            return (
              <button
                key={subject.id}
                type="button"
                onClick={handleClick}
                disabled={isDisabled}
                className={`w-full text-left rounded-2xl border-2 px-4 py-3 sm:px-5 sm:py-4 transition-colors duration-200 ${
                  isDisabled
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? `${subject.activeBorder} bg-white dark:bg-gray-900 shadow-md`
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center ${
                      isSelected
                        ? `bg-gradient-to-r ${subject.color}`
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{titleText}</h3>
                </div>
                <p
                  className={`text-sm leading-snug ${
                    isSelected
                      ? 'text-gray-700 dark:text-gray-300'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {descText}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {selectedSubjects.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('test.readyToStart')}
              </h3>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4" />
                  <span>
                    {selectedSubjects.length} {t('test.subjects')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>
                    {summaryMeta.minutes} {t('test.minutes')}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>
                    {summaryMeta.questions} {t('test.questions')}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                const mode = selectedMode || (selectedSubjects.length === 1 ? 'single' : 'full');
                if (mode === 'single') {
                  setShowTestModal(true);
                } else {
                  handleStartTest();
                }
              }}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              {t('test.startTest')}
            </button>
          </div>
        </div>
      )}

      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t('test.selectTest')}
                </h3>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {singleModeSubjectId && (
                <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  {t('test.singleSubject')}: {t(`test.subjects.${singleModeSubjectId}`)}
                </p>
              )}

              <div className="space-y-3">
                {singleSubjectTests.map((test, index) => {
                  const lastResult = resultsByTestId[test.id];
                  const hasTaken = !!lastResult;

                  const baseSubjectId =
                    singleModeSubjectId ||
                    (Array.isArray(test.subjects) && test.subjects.length > 0
                      ? test.subjects[0]
                      : null);
                  const subjectLabel = baseSubjectId
                    ? t(`test.subjects.${baseSubjectId}`)
                    : t('test.singleSubjectTest');
                  const variantNumber = test.variant || index + 1;
                  const titleLine = i18n.t('test.variantTitle', {
                    v0: subjectLabel,
                    v1: variantNumber,
                  });

                  return (
                    <div
                      key={test.id}
                      onClick={() => {
                        setSelectedTest(test);
                        setShowTestModal(false);
                        onStartTest({
                          testId: test.id,
                          mode: test.mode,
                          subjects: test.subjects,
                          timeLimit: test.timeLimit,
                          title: test.title,
                          variant: test.variant || index + 1,
                          creativeMode: Boolean(test.creativeMode),
                        });
                      }}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                              {titleLine}
                            </h4>
                            {test.creativeMode && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                                {i18n.t('ui.creative')}
                              </span>
                            )}
                            {hasTaken && (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                {t('test.alreadyTaken')}
                              </span>
                            )}
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {test.timeLimit || 60} {t('test.minutes')}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="h-4 w-4" />
                              <span>
                                {test.totalQuestions || 0} {t('test.questions')}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {test.subjects?.map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs"
                              >
                                {t(`test.subjects.${subject}`)}
                              </span>
                            ))}
                          </div>
                          {hasTaken && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {t('test.lastScore', { score: lastResult.score })}
                            </div>
                          )}
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500 ml-4" />
                      </div>
                    </div>
                  );
                })}

                {singleSubjectTests.length === 0 && (
                  <div className="text-center py-8">
                    <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {t('test.noTestsAvailable')}
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('test.noTestsForSubject')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <History className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('test.testHistory')}
                </h2>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {userResults.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t('test.noHistoryYet')}</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {userResults.map((result, index) => (
                    <div
                      key={result.attemptId || index}
                      className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              result.score >= 70
                                ? 'bg-green-100 dark:bg-green-900/30'
                                : result.score >= 50
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                                  : 'bg-red-100 dark:bg-red-900/30'
                            }`}
                          >
                            <Award
                              className={`h-5 w-5 ${
                                result.score >= 70
                                  ? 'text-green-600 dark:text-green-400'
                                  : result.score >= 50
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                              }`}
                            />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {getResultDisplayTitle(result)}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(result.finishedAt).toLocaleDateString('kk-KZ', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hourCycle: 'h24',
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`text-2xl font-bold ${
                              result.score >= 70
                                ? 'text-green-600 dark:text-green-400'
                                : result.score >= 50
                                  ? 'text-yellow-600 dark:text-yellow-400'
                                  : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {result.score}%
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {result.totalCorrect}/{result.totalQuestions}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-gray-600 dark:text-gray-300">
                            {t('test.timeSpent')}: {Math.floor(result.timeSpent / 60)}:
                            {(result.timeSpent % 60).toString().padStart(2, '0')}
                          </span>
                          {Array.isArray(result.subjects) && result.subjects.length > 0 && (
                            <span className="text-gray-600 dark:text-gray-300">
                              {result.subjects
                                .map((subjectId) => t(`test.subjects.${subjectId}`))
                                .join(', ')}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setSelectedResult(result);
                            setShowCertificateModal(true);
                          }}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs"
                        >
                          {t('test.generateCertificate')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showCertificateModal && selectedResult && user && (
        <CertificateGenerator
          result={selectedResult}
          user={user}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedResult(null);
          }}
        />
      )}
    </div>
  );
}
