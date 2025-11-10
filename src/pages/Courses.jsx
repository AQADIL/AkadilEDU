import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, BookOpen, Loader2, Eye, EyeOff, Play, Clock, Users, CheckCircle } from 'lucide-react';
import { fetchAllCourses, deleteCourse, getUserCourses } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/realtimeDb';
import CourseEditor from '../components/admin/CourseEditor';

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
  
  // Выбираем градиент на основе хэша названия
  const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return gradients[hash % gradients.length];
};

export default function Courses() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userCourses, setUserCourses] = useState([]);

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
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setIsAdmin(userData.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await fetchAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserCourses = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userCoursesData = await getUserCourses(auth.currentUser.uid);
      setUserCourses(userCoursesData);
    } catch (error) {
      console.error('Error loading user courses:', error);
    }
  };

  const isPurchased = (courseId) => {
    return userCourses.some(c => c.id === courseId);
  };

  const handleCourseClick = (course) => {
    if (isPurchased(course.id)) {
      // Если курс куплен, открыть в my-courses
      navigate(`/my-courses/${course.id}`);
    } else {
      // Если не куплен, показать детали курса с замочками
      navigate(`/courses/${course.id}`);
    }
  };

  const handleDelete = async (courseId) => {
    if (!confirm('Вы уверены что хотите удалить этот курс?')) return;
    
    try {
      await deleteCourse(courseId, auth.currentUser.uid);
      await loadCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Ошибка при удалении курса');
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  const showAdminControls = isAdmin;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            {showAdminControls ? t('courses.management') : t('sidebar.courses')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {courses.length === 0 ? t('courses.noCourses') : `${t('courses.availableCourses')}: ${courses.length}`}
          </p>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button
              onClick={handleCreate}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Создать курс</span>
              <span className="sm:hidden">Создать</span>
            </button>
          )}
        </div>
      </div>


      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const gradient = generateCoverGradient(course.title);
            const coverUrl = course.coverUrl;
            
            return (
              <div
                key={course.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        // Fallback to gradient if image fails to load
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
                      <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-90" />
                      <h3 className="text-xl font-bold opacity-90 line-clamp-2">
                        {course.title}
                      </h3>
                    </div>
                  </div>

                  {/* Admin Controls Overlay */}
                  {showAdminControls && (
                    <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:bg-red-50 dark:hover:bg-red-900 transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  )}
                  
                  {/* Status Badges */}
                  <div className="absolute bottom-2 left-2 flex gap-2">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                      {course.modules ? Object.keys(course.modules).length : 0} модулей
                    </span>
                    {isPurchased(course.id) && (
                      <span className="px-3 py-1.5 bg-green-500 backdrop-blur-sm text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-lg">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('courses.purchased')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Course Info */}
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {course.description || 'Нет описания курса'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(course.createdAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {course.enrolledCount && (
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>{course.enrolledCount} студентов</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => handleCourseClick(course)}
                    className={`w-full py-2.5 flex items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                      isPurchased(course.id)
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-2 border-green-500 hover:bg-green-100 dark:hover:bg-green-900/30 hover:scale-105 shadow-lg shadow-green-500/20'
                        : 'btn-primary'
                    }`}
                  >
                    {isPurchased(course.id) ? (
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
            Курсов пока нет
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin ? 'Создайте первый курс для ваших студентов' : 'Скоро здесь появятся интересные курсы'}
          </p>
          {showAdminControls && (
            <button
              onClick={handleCreate}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Создать первый курс
            </button>
          )}
        </div>
      )}

      {/* Course Editor Modal */}
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
