import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Lock, Unlock, Play, FileText, Calculator, Loader2, BookOpen, CheckCircle } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database } from '../firebase/realtimeDb';

// Функция для преобразования Google Drive ссылки в embed
const getGoogleDriveEmbedUrl = (url) => {
  if (!url) return null;
  
  // Формат: https://drive.google.com/file/d/FILE_ID/view
  const match = url.match(/\/file\/d\/([^\/]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/file/d/${match[1]}/preview`;
  }
  
  // Если уже preview формат
  if (url.includes('/preview')) {
    return url;
  }
  
  return null;
};

// Функция для YouTube embed
const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\?]+)/);
  if (videoIdMatch && videoIdMatch[1]) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }
  
  return url;
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false); // Куплен ли курс
  const [hoveredLesson, setHoveredLesson] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    if (!database) {
      setLoading(false);
      return;
    }
    
    try {
      const courseRef = ref(database, `courses/${id}`);
      const snapshot = await get(courseRef);
      
      if (snapshot.exists()) {
        const courseData = { id, ...snapshot.val() };
        setCourse(courseData);
        
        // TODO: Проверить куплен ли курс пользователем
        // Пока все заблокировано
        setIsPurchased(false);
      } else {
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasAttachments = (lesson) => {
    return !!(lesson.homeworkUrl || lesson.formulasUrl);
  };

  const renderLessonContent = (lesson) => {
    if (!lesson) return null;

    const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
    
    return (
      <div className="space-y-4">
        {/* Видео */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>Видео недоступно</p>
              </div>
            </div>
          )}
        </div>

        {/* Дополнительные материалы */}
        {(lesson.homeworkUrl || lesson.formulasUrl) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {lesson.homeworkUrl && (
              <button
                onClick={() => window.open(getGoogleDriveEmbedUrl(lesson.homeworkUrl), '_blank')}
                className="group p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 border-2 border-blue-200 dark:border-blue-700 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                    {t('courseDetail.homework')}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 text-left">
                  Үй жұмысын ашыңыз
                </p>
              </button>
            )}

            {lesson.formulasUrl && (
              <button
                onClick={() => window.open(getGoogleDriveEmbedUrl(lesson.formulasUrl), '_blank')}
                className="group p-4 sm:p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/40 dark:hover:to-green-800/40 border-2 border-green-200 dark:border-green-700 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-600 dark:bg-green-500 rounded-lg group-hover:scale-110 transition-transform">
                    <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h4 className="font-bold text-green-900 dark:text-green-100 text-sm sm:text-base">
                    {t('courseDetail.formulas')}
                  </h4>
                </div>
                <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 text-left">
                  Формулалар жинағын көріңіз
                </p>
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const modules = course.modules || {};
  const modulesList = Object.keys(modules).map(key => ({
    id: key,
    ...modules[key]
  })).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/courses')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {course.description}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedLesson && isPurchased ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fade-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedLesson.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {t('courseDetail.video')}
                    </span>
                    {selectedLesson.homeworkUrl && (
                      <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        ҮЖ
                      </span>
                    )}
                    {selectedLesson.formulasUrl && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1">
                        <Calculator className="w-3 h-3" />
                        Формулы
                      </span>
                    )}
                  </div>
                </div>
                {renderLessonContent(selectedLesson)}
                {selectedLesson.duration && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {t('courseEditor.duration')}: {selectedLesson.duration} {t('courseEditor.duration').toLowerCase()}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-12 text-center border-2 border-primary-200 dark:border-primary-900">
              <div className="max-w-md mx-auto">
                <div className="relative inline-block mb-6">
                  <BookOpen className="w-24 h-24 text-primary-600 dark:text-primary-400 mx-auto" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
                    <Lock className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {t('courseDetail.courseContent')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Ознакомьтесь со структурой курса справа 👉
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{modulesList.length} модулей</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>
                        {modulesList.reduce((total, module) => 
                          total + Object.keys(module.lessons || {}).length, 0
                        )} уроков
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary px-8 py-3 text-lg font-semibold">
                  🛒 Купить курс
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Получите полный доступ ко всем материалам
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Course Content */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {t('courseDetail.courseContent')}
            </h3>

            {modulesList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {t('courseDetail.noModules')}
              </p>
            ) : (
              <div className="space-y-4">
                {modulesList.map((module, moduleIndex) => {
                  const lessons = module.lessons || {};
                  const lessonsList = Object.keys(lessons).map(key => ({
                    id: key,
                    ...lessons[key]
                  }));

                  return (
                    <div key={module.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                      {/* Module Header */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-xs">
                            {moduleIndex + 1}
                          </span>
                          {module.title}
                        </h4>
                      </div>

                      {/* Lessons */}
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {lessonsList.map((lesson, lessonIndex) => {
                          const isActive = selectedLesson?.id === lesson.id;
                          const isHovered = hoveredLesson === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => isPurchased && setSelectedLesson({ ...lesson, id: lesson.id })}
                              onMouseEnter={() => setHoveredLesson(lesson.id)}
                              onMouseLeave={() => setHoveredLesson(null)}
                              disabled={!isPurchased}
                              className={`w-full px-4 py-3 flex items-center gap-3 transition-all duration-200 text-left group ${
                                isActive ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600' : 'border-l-4 border-transparent'
                              } ${
                                isPurchased ? 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer' : 'cursor-not-allowed'
                              } ${
                                isHovered && !isPurchased ? 'bg-red-50 dark:bg-red-900/10' : ''
                              }`}
                            >
                              <div className={`flex-shrink-0 transition-all duration-200 ${
                                isActive ? 'text-primary-600 scale-110' : !isPurchased ? 'text-gray-400' : 'text-gray-500 group-hover:text-primary-500'
                              }`}>
                                {!isPurchased ? (
                                  <div className="relative">
                                    <Lock className={`w-5 h-5 ${
                                      isHovered ? 'animate-bounce' : ''
                                    }`} />
                                  </div>
                                ) : (
                                  <Play className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isActive ? 'text-primary-700 dark:text-primary-300' : 
                                  !isPurchased ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {lesson.title}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                                  <span className="flex items-center gap-1">
                                    <Play className="w-3 h-3" />
                                    {lesson.duration ? `${lesson.duration} мин` : 'Видео'}
                                  </span>
                                  {lesson.homeworkUrl && (
                                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                                      <FileText className="w-3 h-3" />
                                      ҮЖ
                                    </span>
                                  )}
                                  {lesson.formulasUrl && (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                      <Calculator className="w-3 h-3" />
                                      Ф
                                    </span>
                                  )}
                                  {!isPurchased && isHovered && (
                                    <span className="text-red-600 dark:text-red-400 animate-pulse font-medium">• Заблокировано</span>
                                  )}
                                </div>
                              </div>
                              {isPurchased && (
                                <CheckCircle className={`w-5 h-5 flex-shrink-0 transition-all duration-200 ${
                                  isActive ? 'text-primary-600 scale-110' : 'text-gray-300 group-hover:text-primary-400'
                                }`} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isPurchased && (
              <div className="mt-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Lock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                      🔒 {t('courseDetail.allLocked')}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Приобретите курс, чтобы получить доступ ко всем материалам
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
