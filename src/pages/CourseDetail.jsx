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
  const [isLocked, setIsLocked] = useState(true); // По умолчанию все закрыто

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
        // Пока для демонстрации разблокируем первый урок
        setIsLocked(false);
      } else {
        navigate('/courses');
      }
    } catch (error) {
      console.error('Error loading course:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLessonIcon = (type) => {
    switch (type) {
      case 'homework':
        return <FileText className="w-5 h-5" />;
      case 'formulas':
        return <Calculator className="w-5 h-5" />;
      default:
        return <Play className="w-5 h-5" />;
    }
  };

  const getLessonTypeLabel = (type) => {
    switch (type) {
      case 'homework':
        return t('courseDetail.homework');
      case 'formulas':
        return t('courseDetail.formulas');
      default:
        return t('courseDetail.video');
    }
  };

  const renderLessonContent = (lesson) => {
    if (!lesson) return null;

    const lessonType = lesson.type || 'video';

    if (lessonType === 'video') {
      const embedUrl = getYouTubeEmbedUrl(lesson.videoUrl);
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <p>Видео недоступно</p>
            </div>
          )}
        </div>
      );
    }

    // Для homework и formulas - Google Drive embed
    const embedUrl = getGoogleDriveEmbedUrl(lesson.fileUrl || lesson.videoUrl);
    return (
      <div className="aspect-video bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Файл недоступен</p>
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
          {selectedLesson ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedLesson.title}
                  </h2>
                  <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium">
                    {getLessonTypeLabel(selectedLesson.type)}
                  </span>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
              <BookOpen className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('courseDetail.courseContent')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Выберите урок из списка справа
              </p>
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
                          const lessonLocked = isLocked && !(moduleIndex === 0 && lessonIndex === 0);
                          const isActive = selectedLesson?.id === lesson.id;

                          return (
                            <button
                              key={lesson.id}
                              onClick={() => !lessonLocked && setSelectedLesson({ ...lesson, id: lesson.id })}
                              disabled={lessonLocked}
                              className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left ${
                                isActive ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                              } ${lessonLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <div className={`flex-shrink-0 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
                                {lessonLocked ? (
                                  <Lock className="w-5 h-5" />
                                ) : (
                                  getLessonIcon(lesson.type)
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  isActive ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                                }`}>
                                  {lesson.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {getLessonTypeLabel(lesson.type)}
                                  {lesson.duration && ` • ${lesson.duration} мин`}
                                </p>
                              </div>
                              {!lessonLocked && (
                                <CheckCircle className={`w-5 h-5 flex-shrink-0 ${
                                  isActive ? 'text-primary-600' : 'text-gray-300'
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

            {isLocked && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 text-center">
                  🔒 {t('courseDetail.allLocked')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
