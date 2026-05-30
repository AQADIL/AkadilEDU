import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Trophy, 
  Target, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  RotateCcw,
  Award,
  TrendingUp,
  Share2
} from 'lucide-react';
import CertificateGenerator from '../CertificateGenerator';
import { getCurrentUser } from '../../firebase/auth';

export default function ResultView({ results, onBackToLanding }) {
  const { t } = useTranslation();
  const [showAnswers, setShowAnswers] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const user = getCurrentUser();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Use normalized score percent if available
  const score = typeof results?.scorePercent === 'number'
    ? results.scorePercent
    : (typeof results?.score === 'number' ? results.score : 0);

  const hasPoints = Number.isFinite(results?.earnedPoints) && Number.isFinite(results?.totalPoints) && results.totalPoints > 0;

  const getModeLabel = () => {
    if (!results) return 'ҰБТ тесті';
    if (results.mode === 'creative') return t('test.creativeModeTitle');
    if (results.mode === 'full') return t('test.fullMockTest');
    if (results.mode === 'single') return t('test.singleSubject');
    return 'ҰБТ тесті';
  };

  const getSubjectsLine = () => {
    if (!results || !Array.isArray(results.subjects) || results.subjects.length === 0) return '';
    const labels = results.subjects.map((subjectId) => t(`test.subjects.${subjectId}`));
    return labels.join(' · ');
  };

  const getResultTitle = () => {
    const modeLabel = getModeLabel();
    const subjectsLine = getSubjectsLine();
    if (subjectsLine) {
      return `${modeLabel} – ${subjectsLine}`;
    }
    return modeLabel;
  };

  const formatAnswerValue = (value) => {
    if (!value) return t('test.noAnswer');
    if (Array.isArray(value)) {
      if (value.length === 0) return t('test.noAnswer');
      return value.join(', ');
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return t('test.noAnswer');
      return entries.map(([left, right]) => `${left}→${right}`).join(', ');
    }
    return String(value);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30';
    if (score >= 60) return 'from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30';
    if (score >= 50) return 'from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30';
    return 'from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30';
  };

  const getGradeText = (score) => {
    if (score >= 90) return t('test.grades.excellent');
    if (score >= 80) return t('test.grades.good');
    if (score >= 70) return t('test.grades.satisfactory');
    if (score >= 60) return t('test.grades.needsImprovement');
    return t('test.grades.unsatisfactory');
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    const shareText = `${t('test.shareText', {
      score,
      correct: results.totalCorrect,
      total: results.totalQuestions,
      testTitle: getResultTitle()
    })}`;
    
    if (navigator.share) {
      navigator.share({
        title: t('test.myTestResult'),
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert(t('test.linkCopied'));
    }
  };

  const renderAnswerReview = () => {
    if (!results.canViewAnswers || !showAnswers) return null;
    if (!results.answers) return null;

    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          {t('test.answerReview')}
        </h3>
        
        <div className="space-y-3">
          {Object.entries(results.answers).map(([questionId, answer], index) => (
            <div
              key={questionId}
              className={`p-4 rounded-lg border-2 ${
                answer.correct
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {t('test.questionNumber', { current: index + 1, total: Object.keys(results.answers).length })}
                    </span>
                    {answer.correct ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {t('test.yourAnswer')}:
                      </span>
                      <span className={`ml-2 ${answer.correct ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {formatAnswerValue(answer.selected)}
                      </span>
                    </div>
                    
                    {!answer.correct && (
                      <div>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {t('test.correctAnswer')}:
                        </span>
                        <span className="ml-2 text-green-700 dark:text-green-300">
                          {formatAnswerValue(answer.correctAnswer)}
                        </span>
                      </div>
                    )}
                    
                    <div className="text-gray-500 dark:text-gray-400">
                      {t('test.timeSpent')}: {formatTime(answer.timeSpent || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
            <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('test.testCompleted')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getResultTitle()}
          </p>
        </div>

        {/* Score Card */}
        <div className={`bg-gradient-to-br ${getScoreBgColor(score)} rounded-2xl p-8 mb-8 border border-gray-200 dark:border-gray-700`}>
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Award className={`h-12 w-12 ${getScoreColor(score)}`} />
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(score)} mb-2`}>
              {score}%
            </div>
            <div className={`text-xl font-semibold ${getScoreColor(score)} mb-4`}>
              {getGradeText(score)}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {t('test.correctAnswers', { 
                correct: results.totalCorrect, 
                total: results.totalQuestions 
              })}
            </div>
            {hasPoints && (
              <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t('test.points')}: {results.earnedPoints} / {results.totalPoints}
              </div>
            )}
            {Array.isArray(results.profileSubjects) && results.profileSubjects.length > 0 && (
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {t('test.profileSubjects')}: {results.profileSubjects.map((subjectId) => t(`test.subjects.${subjectId}`)).join(' + ')}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('test.accuracy')}
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round((results.totalCorrect / results.totalQuestions) * 100)}%
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <Clock className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('test.timeSpent')}
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatTime(results.timeSpent || 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('test.performance')}
                </h3>
                <p className="text-2xl font-bold text-purple-600">
                  {score >= 80 ? t('test.excellent') : 
                   score >= 60 ? t('test.good') : 
                   score >= 50 ? t('test.average') : t('test.needsWork')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {results.canViewAnswers ? (
            <button
              onClick={() => setShowAnswers(!showAnswers)}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
            >
              <Eye className="h-5 w-5" />
              <span>
                {showAnswers ? t('test.hideAnswers') : t('test.viewAnswers')}
              </span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-xl">
              <XCircle className="h-5 w-5" />
              <span>{t('test.needMinScore')}</span>
            </div>
          )}

          <button
            onClick={() => setShowCertificateModal(true)}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            <Award className="h-5 w-5" />
            <span>{t('test.generateCertificate')}</span>
          </button>

          <button
            onClick={onBackToLanding}
            className="flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            <RotateCcw className="h-5 w-5" />
            <span>{t('test.takeAnotherTest')}</span>
          </button>
        </div>

        {/* Answer Review */}
        {renderAnswerReview()}

        {/* Recommendations */}
        {score < 50 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
              {t('test.recommendations')}
            </h3>
            <ul className="space-y-2 text-yellow-700 dark:text-yellow-300">
              <li>• {t('test.recommendation1')}</li>
              <li>• {t('test.recommendation2')}</li>
              <li>• {t('test.recommendation3')}</li>
            </ul>
          </div>
        )}

        {score >= 80 && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mt-8">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-3">
              {t('test.congratulations')}
            </h3>
            <p className="text-green-700 dark:text-green-300">
              {t('test.excellentPerformance')}
            </p>
          </div>
        )}

        {/* Certificate Generator Modal */}
        {showCertificateModal && user && (
          <CertificateGenerator
            result={results}
            user={user}
            onClose={() => setShowCertificateModal(false)}
          />
        )}
      </div>
    </div>
  );
}
