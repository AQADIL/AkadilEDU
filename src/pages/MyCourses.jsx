import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Loader2, Play, Clock, CheckCircle, Calendar, Zap } from 'lucide-react';
import { getUserCourses } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';

// Функция генерации красивой обложки на основе названия курса
const generateCoverGradient = (title) => {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-indigo-500 to-blue-600',
    'from-yellow-500 to-orange-600',
    'from-purple-500 to-pink-600',
    'from-teal-500 to-green-600',
  ];
  
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

export default function MyCourses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourseId, setSelectedCourseId] = useState(location.state?.selectedCourseId || null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (selectedCourseId && courses.length > 0) {
      // Scroll to selected course
      const element = document.getElementById(`course-${selectedCourseId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [selectedCourseId, courses]);

  const loadCourses = async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }
    
    try {
      const userCoursesData = await getUserCourses(auth.currentUser.uid);
      setCourses(userCoursesData);
    } catch (error) {
      console.error('Error loading user courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (course) => {
    return course.enrollment?.expiryDate && course.enrollment.expiryDate < Date.now();
  };

  const getDaysLeft = (expiryDate) => {
    if (!expiryDate) return null;
    const days = Math.ceil((expiryDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const handleOpenCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {t('sidebar.myCourses')}
        </h1>
        
        <div className="text-center py-16 sm:py-24 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-700">
          <BookOpen className="w-20 h-20 text-primary-400 mx-auto mb-6 animate-pulse" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Әзірге курстар жоқ
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Курстарды сатып алыңыз немесе оқытушы сізге тағайындағанша күтіңіз
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Барлық курстарды көру
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t('sidebar.myCourses')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Сізде {courses.length} курс бар
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => {
          const gradient = generateCoverGradient(course.title);
          const coverUrl = course.coverUrl;
          const expired = isExpired(course);
          const daysLeft = getDaysLeft(course.enrollment?.expiryDate);
          const progress = course.enrollment?.progress || 0;
          const isSelected = selectedCourseId === course.id;
          
          return (
            <div
              key={course.id}
              id={`course-${course.id}`}
              className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 $\{
                isSelected ? 'ring-4 ring-primary-500 scale-105' : ''
              } ${expired ? 'opacity-60' : ''}`}
            >
              {/* Cover Image */}
              <div className="relative h-40 sm:h-48 overflow-hidden">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Gradient Fallback */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} ${coverUrl ? 'hidden' : 'flex'} items-center justify-center`}
                  style={{ display: coverUrl ? 'none' : 'flex' }}
                >
                  <div className="text-center text-white p-6">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-90" />
                    <h3 className="text-lg font-bold opacity-90 line-clamp-2">
                      {course.title}
                    </h3>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    {expired ? (
                      <span className="px-3 py-1.5 bg-red-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <Clock className="w-3.5 h-3.5" />
                        Мерзімі өтті
                      </span>
                    ) : daysLeft !== null && daysLeft <= 7 ? (
                      <span className="px-3 py-1.5 bg-orange-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg animate-pulse">
                        <Zap className="w-3.5 h-3.5" />
                        {daysLeft} күн қалды
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-green-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Белсенді
                      </span>
                    )}
                  </div>
                  
                  {/* Progress Circle */}
                  {progress > 0 && (
                    <div className="relative w-14 h-14">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          className="text-white/30"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 24}`}
                          strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress / 100)}`}
                          className="text-white transition-all duration-300"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{progress}%</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Course Info */}
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {course.title}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                  {course.description || 'Курс сипаттамасы жоқ'}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.modules ? Object.keys(course.modules).length : 0} модуль</span>
                  </div>
                  {course.enrollment?.enrolledAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(course.enrollment.enrolledAt).toLocaleDateString('kk-KZ')}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {progress > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Прогресс</span>
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button 
                  onClick={() => handleOpenCourse(course.id)}
                  disabled={expired}
                  className={`w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    expired
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-105'
                  }`}
                >
                  {expired ? (
                    <>
                      <Clock className="w-5 h-5" />
                      <span>Мерзімі өткен</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Оқуды жалғастыру</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
