import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Play,
  Clock,
  Users,
  CheckCircle,
  RefreshCcw,
  Calendar,
} from 'lucide-react';
import AppLoader from '../components/AppLoader';
import { fetchAllCourses, deleteCourse, getUserCourses, isUserAdmin } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';

import { database } from '../firebase/realtimeDb';
import CourseEditor from '../components/admin/CourseEditor';

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

const getTotalDurationMinutes = (course) => {
  if (!course) return 0;
  if (!course.modules) return course.durationMinutes || 0;

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

export default function Courses() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userCourses, setUserCourses] = useState([]);

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

  useEffect(() => {
    checkAdminStatus();
    loadCourses();
    loadUserCourses();
  }, []);

  const checkAdminStatus = async () => {
    if (!auth.currentUser || !database) {
      setIsAdmin(false);
      return;
    }

    try {
      setIsAdmin(await isUserAdmin(auth.currentUser.uid));
    } catch {
      setIsAdmin(false);
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const coursesData = await fetchAllCourses();
      setCourses(coursesData);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCourses = async () => {
    if (!auth.currentUser) return;

    try {
      const userCoursesData = await getUserCourses(auth.currentUser.uid);
      setUserCourses(userCoursesData);
    } catch {}
  };

  const isPurchased = (courseId) => {
    const userCourse = userCourses.find((c) => c.id === courseId);
    return userCourse !== undefined;
  };

  const isExpired = (courseId) => {
    const userCourse = userCourses.find((c) => c.id === courseId);
    return (
      userCourse &&
      userCourse.enrollment?.expiryDate &&
      userCourse.enrollment.expiryDate < Date.now()
    );
  };

  const handleCourseClick = (course) => {
    if (isPurchased(course.id) && !isExpired(course.id)) {
      navigate(`/my-courses/${course.id}`);
    } else {
      navigate(`/courses/${course.id}`);
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm(t('courses.deleteConfirm'))) return;

    try {
      await deleteCourse(courseId, auth.currentUser.uid);
      await loadCourses();
    } catch {
      alert(t('courses.deleteError'));
    }
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedCourse(null);
    setEditorOpen(true);
  };

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

  const showAdminControls = isAdmin;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {showAdminControls ? t('courses.management') : t('sidebar.courses')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {courses.length === 0
              ? t('courses.noCourses')
              : `${t('courses.availableCourses')}: ${courses.length}`}
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">{t('courses.createCourse')}</span>
              <span className="sm:hidden">{t('courses.create')}</span>
            </button>
          )}
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const gradient = generateCoverGradient(course.title);
            const coverUrl = course.coverUrl;
            const purchased = isPurchased(course.id);

            const expired = isExpired(course.id);
            const totalDurationMinutes = getTotalDurationMinutes(course);
            const formattedDuration = formatDuration(totalDurationMinutes);

            return (
              <div
                key={course.id}
                className={`group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                  expired
                    ? 'border-2 border-dashed border-primary-500'
                    : purchased
                      ? 'border-2 border-green-500 ring-2 ring-green-500/20'
                      : 'border border-gray-200 dark:border-gray-700'
                }`}
              >
                {purchased && !expired && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg -slow">
                      <CheckCircle className="w-4 h-4" />
                      {t('courses.purchased')}
                    </div>
                  </div>
                )}

                {expired && (
                  <div className="absolute top-2 left-2 z-10">
                    <div className="bg-primary-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                      <Clock className="w-4 h-4" />
                      {t('courses.expired')}
                    </div>
                  </div>
                )}

                <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-100 dark:bg-gray-700">
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
                    className={`absolute inset-0 bg-gradient-to-br ${gradient} ${coverUrl ? 'hidden' : 'flex'} items-center justify-center text-white flex-col p-4`}
                  >
                    <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-90" />
                    <h3 className="text-xl font-bold opacity-90 line-clamp-2 text-center">
                      {course.title}
                    </h3>
                  </div>

                  {showAdminControls && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                        title={t('courses.edit')}
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                        title={t('courses.delete')}
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 flex gap-2">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      {course.modules
                        ? Object.keys(course.modules).length
                        : course.moduleCount || 0}{' '}
                      {t('courses.modules')}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {course.description || t('courses.noDescription')}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(course.createdAt).toLocaleDateString(i18n.resolvedLanguage)}
                      </span>
                    </div>
                    {formattedDuration && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formattedDuration}</span>
                      </div>
                    )}
                    {course.enrolledCount && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {course.enrolledCount} {t('courses.students')}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleCourseClick(course)}
                    className={`w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isExpired(course.id)
                        ? 'border-2 border-dashed border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:scale-105'
                        : isPurchased(course.id)
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-2 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105 shadow-lg shadow-green-500/20'
                          : 'btn-primary'
                    }`}
                  >
                    {isExpired(course.id) ? (
                      <>
                        <RefreshCcw className="w-5 h-5" />
                        <span className="font-semibold">{t('courses.buyAgain')}</span>
                      </>
                    ) : isPurchased(course.id) ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold">{t('courses.openCourse')}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {t('courses.viewCourse')}
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 sm:py-24 bg-white dark:bg-gray-800 rounded-xl">
          <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('courses.noCourses')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin ? t('courses.adminNoCoursesMessage') : t('courses.noCoursesMessage')}
          </p>
          {showAdminControls && (
            <button onClick={handleCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {t('courses.createFirst')}
            </button>
          )}
        </div>
      )}

      {editorOpen && (
        <CourseEditor
          course={selectedCourse}
          isOpen={editorOpen}
          onClose={() => {
            setEditorOpen(false);
            setSelectedCourse(null);
            loadCourses();
          }}
        />
      )}
    </div>
  );
}
