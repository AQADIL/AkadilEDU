import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, Play, Clock, CheckCircle, Calendar, Zap } from 'lucide-react';
import AppLoader from '../components/AppLoader';
import {
  getUserCourses,
  updateUserCoursesOrder,
  getUserCoursesProgress,
} from '../firebase/realtimeDb';
import { auth } from '../firebase/config';

const generateCoverGradient = (title) => {
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-teal-600',
    'from-orange-500 to-red-600',
    'from-pink-500 to-rose-600',
    'from-sky-600 to-blue-700',
    'from-yellow-500 to-orange-600',
    'from-slate-500 to-slate-700',
    'from-teal-500 to-green-600',
  ];

  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

const getLessonTitle = (course, lessonId) => {
  if (!course || !course.modules || !lessonId) return null;

  for (const module of Object.values(course.modules)) {
    if (!module.lessons) continue;
    for (const [id, lesson] of Object.entries(module.lessons)) {
      if (id === lessonId) {
        return lesson.title || null;
      }
    }
  }

  return null;
};

const formatTimeFromSeconds = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (h > 0) {
    return `${h}:${pad(m)}:${pad(s)}`;
  }
  return `${m}:${pad(s)}`;
};

export default function MyCourses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedCourseId] = useState(location.state?.selectedCourseId || null);
  const [draggedCourseId, setDraggedCourseId] = useState(null);

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

  const getTotalDurationMinutes = (course) => {
    if (!course.modules) return 0;

    let total = 0;
    Object.values(course.modules).forEach((module) => {
      if (!module.lessons) return;
      Object.values(module.lessons).forEach((lesson) => {
        const minutes = Number(lesson.duration) || 0;
        if (minutes > 0) {
          total += minutes;
        }
      });
    });
    return total;
  };

  const formatDuration = (totalMinutes) => {
    if (!totalMinutes || totalMinutes <= 0) return null;

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return t('duration.hoursAndMinutes', { hours, minutes });
    }
    if (hours > 0) {
      return t('duration.hoursOnly', { hours });
    }
    return t('duration.minutesOnly', { minutes });
  };

  const reorderCourses = (list, sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return list;
    const currentIndex = list.findIndex((c) => c.id === sourceId);
    const targetIndex = list.findIndex((c) => c.id === targetId);
    if (currentIndex === -1 || targetIndex === -1) return list;

    const updated = [...list];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    return updated;
  };

  const handleDragStart = (courseId) => {
    setDraggedCourseId(courseId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = async (event, targetCourseId) => {
    event.preventDefault();
    if (!draggedCourseId || draggedCourseId === targetCourseId) return;

    const newOrder = reorderCourses(courses, draggedCourseId, targetCourseId);
    setCourses(newOrder);
    setDraggedCourseId(null);

    if (auth.currentUser) {
      try {
        await updateUserCoursesOrder(
          auth.currentUser.uid,
          newOrder.map((c) => c.id),
        );
      } catch (error) {}
    }
  };

  const loadCourses = useCallback(async () => {
    if (!auth.currentUser) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setLoadError(false);
    try {
      const userCoursesData = await getUserCourses(auth.currentUser.uid);
      const progressMap = await getUserCoursesProgress(auth.currentUser.uid);

      if (progressMap) {
        userCoursesData.forEach((course) => {
          if (progressMap[course.id]) {
            course.progressData = progressMap[course.id];
          }
        });
      }

      userCoursesData.sort((a, b) => {
        const orderA = a.enrollment?.order;
        const orderB = b.enrollment?.order;

        const hasOrderA = typeof orderA === 'number';
        const hasOrderB = typeof orderB === 'number';

        if (hasOrderA && hasOrderB) {
          return orderA - orderB;
        }
        if (hasOrderA) return -1;
        if (hasOrderB) return 1;

        const enrolledA = a.enrollment?.enrolledAt || 0;
        const enrolledB = b.enrollment?.enrolledAt || 0;
        return enrolledA - enrolledB;
      });

      setCourses(userCoursesData);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    if (selectedCourseId && courses.length > 0) {
      const element = document.getElementById(`course-${selectedCourseId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [courses, selectedCourseId]);

  if (loading) {
    return <AppLoader text={t('common.loading')} />;
  }

  if (loadError)
    return (
      <div role="alert" className="py-16 text-center space-y-4">
        <p>{t('common.loadError')}</p>
        <button
          type="button"
          onClick={loadCourses}
          className="px-5 py-3 rounded-xl bg-primary-600 text-white"
        >
          {t('common.retry')}
        </button>
      </div>
    );

  if (courses.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          {t('sidebar.myCourses')}
        </h1>

        <div className="text-center py-16 sm:py-24 bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl border-2 border-dashed border-primary-300 dark:border-primary-700">
          <BookOpen className="w-20 h-20 text-primary-400 mx-auto mb-6 " />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('courses.noCourses')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('courses.buyCourses')}
          </p>
          <button
            onClick={() => navigate('/courses')}
            className="btn-primary inline-flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            {t('courses.viewAllCourses')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {t('sidebar.myCourses')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t('courses.youHave', { count: courses.length })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {courses.map((course) => {
          const gradient = generateCoverGradient(course.title);
          const coverUrl = course.coverUrl;
          const expired = isExpired(course);
          const daysLeft = getDaysLeft(course.enrollment?.expiryDate);
          const progress = course.enrollment?.progress || 0;
          const isSelected = selectedCourseId === course.id;
          const totalDurationMinutes = getTotalDurationMinutes(course);
          const formattedDuration = formatDuration(totalDurationMinutes);

          const progressData = course.progressData || null;
          const lastLessonId = progressData?.lastActiveLessonId;
          const lastTimestamp = progressData?.lastActiveTimestamp || 0;
          const lastLessonTitle = getLessonTitle(course, lastLessonId);
          const lastLessonProgress =
            lastLessonId && progressData?.lessons ? progressData.lessons[lastLessonId] : null;
          const resumePercent = lastLessonProgress?.percent || 0;
          const smartProgress = resumePercent > 0 ? resumePercent : progress;
          const hasResumePoint = !!lastLessonId && lastTimestamp > 0;

          const handleSmartContinue = () => {
            if (expired) return;

            if (lastLessonId) {
              const params = new URLSearchParams();
              params.set('lesson', lastLessonId);
              const seek = Math.floor(lastTimestamp || 0);
              if (seek > 0) {
                params.set('t', String(seek));
              }
              navigate(`/courses/${course.id}?${params.toString()}`);
            } else {
              handleOpenCourse(course.id);
            }
          };

          return (
            <div
              key={course.id}
              id={`course-${course.id}`}
              draggable
              onDragStart={() => handleDragStart(course.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, course.id)}
              className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${
                isSelected ? 'ring-4 ring-primary-500 scale-105' : ''
              } ${expired ? 'opacity-60' : ''}`}
            >
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

                <div
                  className={`absolute inset-0 bg-gradient-to-br ${gradient} ${coverUrl ? 'hidden' : 'flex'} items-center justify-center`}
                  style={{ display: coverUrl ? 'none' : 'flex' }}
                >
                  <div className="text-center text-white p-6">
                    <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-90" />
                    <h3 className="text-lg font-bold opacity-90 line-clamp-2">{course.title}</h3>
                  </div>
                </div>

                <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                  <div className="flex flex-col gap-2">
                    {expired ? (
                      <span className="px-3 py-1.5 bg-red-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <Clock className="w-3.5 h-3.5" />
                        {t('course.expiredStatus')}
                      </span>
                    ) : daysLeft !== null && daysLeft <= 7 ? (
                      <span className="px-3 py-1.5 bg-orange-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg ">
                        <Zap className="w-3.5 h-3.5" />
                        {daysLeft} {t('course.daysLeft')}
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-green-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('course.active')}
                      </span>
                    )}
                  </div>

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

              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {course.title}
                </h3>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                  {course.description || t('course.noDescription')}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>
                      {course.modules
                        ? Object.keys(course.modules).length
                        : course.moduleCount || 0}{' '}
                      {t('course.modules')}
                    </span>
                  </div>
                  {formattedDuration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formattedDuration}</span>
                    </div>
                  )}
                  {course.enrollment?.enrolledAt && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {t('course.receivedOn')}:{' '}
                        {new Date(course.enrollment.enrolledAt).toLocaleDateString('kk-KZ')}
                      </span>
                    </div>
                  )}
                  {course.enrollment?.expiryDate && !expired && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {t('course.validUntil')}:{' '}
                        {new Date(course.enrollment.expiryDate).toLocaleDateString('kk-KZ')}
                      </span>
                    </div>
                  )}
                </div>

                {progress > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>{t('course.progress')}</span>
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

                <button
                  onClick={handleSmartContinue}
                  disabled={expired}
                  className={`relative w-full overflow-hidden group rounded-2xl px-4 py-4 text-left transition-all duration-300 ${
                    expired
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-white/60 dark:bg-slate-900/60 text-gray-900 dark:text-white border border-white/40 dark:border-white/10 shadow-[0_18px_45px_rgba(15,23,42,0.18)] backdrop-blur-xl hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(15,23,42,0.28)]'
                  }`}
                  style={{ minHeight: '80px' }}
                >
                  {!expired && (
                    <div className="pointer-events-none absolute inset-0 opacity-60 group-hover:opacity-90 transition-opacity duration-300">
                      <div className="absolute inset-[1px] rounded-2xl border border-white/40 dark:border-white/10" />
                      <div className="absolute -bottom-10 right-[-40%] h-32 w-32 bg-gradient-to-tr from-indigo-400/30 via-sky-400/20 to-transparent blur-2xl" />
                    </div>
                  )}

                  <div className="relative z-10 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gray-700/80 dark:text-gray-300/80">
                        {hasResumePoint
                          ? t('myCourses.continueWatching')
                          : t('course.continueLearning')}
                      </p>
                      <p className="mt-1 text-sm sm:text-[15px] font-semibold truncate max-w-[220px]">
                        {lastLessonTitle || course.title}
                      </p>
                      <p
                        className={`mt-0.5 text-xs transition-opacity duration-200 ${
                          hasResumePoint
                            ? 'opacity-75 text-gray-700 dark:text-gray-200'
                            : 'opacity-0'
                        }`}
                      >
                        {hasResumePoint ? formatTimeFromSeconds(lastTimestamp) : '00:00'}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
                          expired
                            ? 'bg-gray-300/60 text-gray-500'
                            : 'bg-white/30 dark:bg-white/10 text-indigo-600 dark:text-indigo-300 shadow-lg shadow-indigo-500/40 group-hover:scale-110'
                        }`}
                      >
                        <Play className="w-4 h-4 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  {!expired && (
                    <div className="absolute left-4 right-4 bottom-2 h-[2px] rounded-full bg-white/20 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 via-violet-400 to-amber-300 transition-all duration-700 ease-out"
                        style={{ width: `${Math.min(100, smartProgress || 0)}%` }}
                      />
                    </div>
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
