import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Loader2, Play, Lock, CheckCircle, FileText, Calculator, Youtube, Menu, X } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database, getUserCourses } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';

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

// Мотивационные цитаты на казахском - сильные, вдохновляющие, иногда жесткие
const motivationalQuotes = [
  {
    text: "Білім - күш, білім - қуат. Білімсіз адам - соқыр адам",
    author: "Қазақ мақалы"
  },
  {
    text: "Бүгін оқымасаң, ертең өкінесің. Уақыт ешкімді күтпейді",
    author: "Өмір шындығы"
  },
  {
    text: "Табысқа жетудің жалғыз жолы - үздіксіз білім алу",
    author: "Стив Джобс"
  },
  {
    text: "Ештеңе істемеген адам ештеңеге жетпейді. Әрекет ет!",
    author: "Даналық"
  },
  {
    text: "Сенің болашағың бүгінгі әрекетіңе байланысты",
    author: "Жігер сөзі"
  },
  {
    text: "Білім алмай отырған әр минут - жоғалған мүмкіндік",
    author: "Бенджамин Франклин"
  },
  {
    text: "Үйренбеген адам - артта қалған адам. Дамы немесе қал артта",
    author: "Заман талабы"
  },
  {
    text: "Қиын болса да үйрен. Оңай жол жетістікке апармайды",
    author: "Конфуций"
  },
  {
    text: "Білімді адам - еркін адам. Надандық - құлдықтың түрі",
    author: "Абай Құнанбаев"
  },
  {
    text: "Ертең деме, бүгін бастамасаң ертең де бастамайсың",
    author: "Өмір ережесі"
  },
  {
    text: "Жетістік үшін жұмыс істе, тыныштық үшін түсінік іздеме",
    author: "Альберт Эйнштейн"
  },
  {
    text: "Сәтсіздік - жеңістің бөлшегі. Тоқтама, алға жүр!",
    author: "Томас Эдисон"
  },
  {
    text: "Өзіңді дамытпасаң, өзгелер сені артта қалдырады",
    author: "Қазіргі заман"
  },
  {
    text: "Білім алу - ауыр, білімсіздік - одан да ауыр",
    author: "Қазақ даналығы"
  },
  {
    text: "Бір сабақ - болашаққа бір қадам. Әр күн маңызды",
    author: "Мотивация"
  },
  {
    text: "Шынайы күш білімде. Күш тапқың келсе - үйрен",
    author: "Фрэнсис Бэкон"
  },
  {
    text: "Сен өз өміріңнің авторысың. Не жазасың - сен шешесің",
    author: "Паоло Коэльо"
  },
  {
    text: "Мақсатқа жету үшін күн сайын қадам жаса",
    author: "Зиг Зиглар"
  },
  {
    text: "Үйренуден басқа жол жоқ. Білім - жалғыз инвестиция",
    author: "Уоррен Баффет"
  },
  {
    text: "Қиындық - құдайдың сыйы. Оны бас тарт демеді, күшей деді",
    author: "Даналық"
  }
];

const getRandomQuote = () => {
  return motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isPurchased, setIsPurchased] = useState(false); // Куплен ли курс
  const [hoveredLesson, setHoveredLesson] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Мобильный sidebar
  const [completedLessons, setCompletedLessons] = useState(new Set()); // Просмотренные уроки
  const [currentQuote] = useState(getRandomQuote()); // Случайная цитата
  
  // Определяем, открыт ли курс из my-courses
  const isFromMyCourses = location.pathname.startsWith('/my-courses');

  useEffect(() => {
    loadCourse();
    checkPurchaseStatus();
    loadCompletedLessons();
  }, [id]);

  const loadCompletedLessons = () => {
    // Загрузить из localStorage
    const saved = localStorage.getItem(`completed_lessons_${id}`);
    if (saved) {
      setCompletedLessons(new Set(JSON.parse(saved)));
    }
  };

  const toggleLessonComplete = (lessonId) => {
    setCompletedLessons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }
      // Сохранить в localStorage
      localStorage.setItem(`completed_lessons_${id}`, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const checkPurchaseStatus = async () => {
    if (!auth.currentUser) {
      setIsPurchased(false);
      return;
    }

    try {
      const userCourses = await getUserCourses(auth.currentUser.uid);
      const purchased = userCourses.some(c => c.id === id);
      setIsPurchased(purchased);
      console.log('✅ Purchase check:', { courseId: id, purchased });
    } catch (error) {
      console.error('Error checking purchase status:', error);
      setIsPurchased(false);
    }
  };

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
          <div className="grid grid-cols-1 gap-3">
            {lesson.homeworkUrl && (
              <button
                onClick={() => window.open(getGoogleDriveEmbedUrl(lesson.homeworkUrl), '_blank')}
                className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 border-2 border-blue-200 dark:border-blue-700 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 dark:bg-blue-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                      Үй жұмысы
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                      Тапсырманы ашу
                    </p>
                  </div>
                </div>
              </button>
            )}

            {lesson.formulasUrl && (
              <button
                onClick={() => window.open(getGoogleDriveEmbedUrl(lesson.formulasUrl), '_blank')}
                className="group p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/40 dark:hover:to-green-800/40 border-2 border-green-200 dark:border-green-700 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-green-600 dark:bg-green-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-bold text-green-900 dark:text-green-100 text-sm sm:text-base">
                      Формулалар жинағы
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 truncate">
                      Барлық формулаларды көру
                    </p>
                  </div>
                </div>
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
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate(isFromMyCourses ? '/my-courses' : '/courses')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {/* Mobile Menu Button - только на мобилках */}
        {isPurchased && (
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
        
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white truncate">
            {course.title}
          </h1>
          {course.description && (
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
              {course.description}
            </p>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl overflow-y-auto animate-slide-in-right">
            {/* Sidebar Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-purple-600 text-white p-5 flex items-center justify-between z-10 shadow-lg">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Курс мазмұны
                </h3>
                <p className="text-xs opacity-90 mt-1">
                  {modulesList.length} модуль • {modulesList.reduce((total, module) => 
                    total + Object.keys(module.lessons || {}).length, 0
                  )} сабақ
                </p>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Sidebar Content */}
            <div className="p-4">
              {modulesList.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Модулдер жоқ
                </p>
              ) : (
                <div className="space-y-4">
                  {modulesList.map((module, moduleIndex) => {
                    const lessons = module.lessons || {};
                    const lessonsList = Object.keys(lessons).map(key => ({
                      id: key,
                      ...lessons[key]
                    }));
                    
                    const completedCount = lessonsList.filter(l => completedLessons.has(l.id)).length;

                    return (
                      <div key={module.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg">
                        {/* Module Header */}
                        <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                              {module.title}
                            </h4>
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                              {completedCount}/{lessonsList.length}
                            </span>
                          </div>
                        </div>

                        {/* Lessons */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          {lessonsList.map((lesson, lessonIndex) => {
                            const isLocked = !isPurchased;
                            const isSelected = selectedLesson?.id === lesson.id;
                            const isCompleted = completedLessons.has(lesson.id);

                            return (
                              <div
                                key={lesson.id}
                                className={`group transition-all duration-200 ${
                                  isLocked
                                    ? 'opacity-50'
                                    : isSelected
                                    ? 'bg-primary-50 dark:bg-primary-900/20'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                                }`}
                              >
                                <div className="flex items-start gap-3 px-4 py-3">
                                  {/* Checkbox */}
                                  {!isLocked && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLessonComplete(lesson.id);
                                      }}
                                      className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                        isCompleted
                                          ? 'bg-green-500 border-green-500 scale-110'
                                          : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                                      }`}
                                    >
                                      {isCompleted && (
                                        <CheckCircle className="w-4 h-4 text-white" />
                                      )}
                                    </button>
                                  )}
                                  
                                  {/* Lesson Content */}
                                  <button
                                    onClick={() => {
                                      if (!isLocked) {
                                        setSelectedLesson(lesson);
                                        setIsMobileSidebarOpen(false);
                                      }
                                    }}
                                    disabled={isLocked}
                                    className="flex-1 text-left min-w-0"
                                  >
                                    <div className="flex items-start gap-2">
                                      {isLocked ? (
                                        <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                      ) : (
                                        <Play className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                          isSelected
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }`} />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <span className={`text-sm font-medium block ${
                                          isCompleted
                                            ? 'line-through text-gray-500 dark:text-gray-400'
                                            : isSelected
                                            ? 'text-primary-700 dark:text-primary-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                        }`}>
                                          {lesson.title}
                                        </span>
                                        {lesson.duration && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {lesson.duration} мин
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {selectedLesson && isPurchased ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-fade-in">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white line-clamp-2">
                    {selectedLesson.title}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-full text-xs font-medium flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {t('courseDetail.video')}
                    </span>
                    {selectedLesson.homeworkUrl && (
                      <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        ҮЖ
                      </span>
                    )}
                    {selectedLesson.formulasUrl && (
                      <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                        <Calculator className="w-3 h-3" />
                        Формулы
                      </span>
                    )}
                  </div>
                </div>
                {renderLessonContent(selectedLesson)}
                {selectedLesson.duration && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                    {t('courseEditor.duration')}: {selectedLesson.duration} мин
                  </p>
                )}
              </div>
            </div>
          ) : isPurchased ? (
            // Мотивационная цитата для купленного курса
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 sm:p-12 text-center border-2 border-primary-200 dark:border-primary-900">
              <div className="max-w-md mx-auto">
                <div className="relative inline-block mb-6">
                  <div className="text-6xl sm:text-7xl mb-4 animate-bounce">📚</div>
                </div>
                <blockquote className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 leading-relaxed">
                  "{currentQuote.text}"
                </blockquote>
                <p className="text-sm sm:text-base text-primary-600 dark:text-primary-400 font-semibold">
                  — {currentQuote.author}
                </p>
              </div>
            </div>
          ) : (
            // Блок "Купить курс" для не купленных
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 sm:p-12 text-center border-2 border-primary-200 dark:border-primary-900">
              <div className="max-w-md mx-auto">
                <div className="relative inline-block mb-6">
                  <BookOpen className="w-20 h-20 sm:w-24 sm:h-24 text-primary-600 dark:text-primary-400 mx-auto" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  Курс мазмұны
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Оң жақтағы құрылымды қараңыз 👉
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{modulesList.length} модуль</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>
                        {modulesList.reduce((total, module) => 
                          total + Object.keys(module.lessons || {}).length, 0
                        )} сабақ
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold">
                  🛒 Курсты сатып алу
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  Барлық материалдарға толық қол жеткізу
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Sidebar - Course Content (hidden on mobile) */}
        <div className="hidden lg:block space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Курс мазмұны
            </h3>

            {modulesList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                Модулдер жоқ
              </p>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {modulesList.map((module, moduleIndex) => {
                  const lessons = module.lessons || {};
                  const lessonsList = Object.keys(lessons).map(key => ({
                    id: key,
                    ...lessons[key]
                  }));
                  
                  const completedCount = lessonsList.filter(l => completedLessons.has(l.id)).length;

                  return (
                    <div key={module.id} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                      {/* Module Header */}
                      <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 bg-primary-600 text-white rounded-full text-xs">
                              {moduleIndex + 1}
                            </span>
                            {module.title}
                          </h4>
                          {isPurchased && (
                            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 rounded-full">
                              {completedCount}/{lessonsList.length}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Lessons */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {lessonsList.map((lesson, lessonIndex) => {
                          const isLocked = !isPurchased;
                          const isSelected = selectedLesson?.id === lesson.id;
                          const isCompleted = completedLessons.has(lesson.id);

                          return (
                            <div
                              key={lesson.id}
                              className={`group transition-all duration-200 ${
                                isLocked
                                  ? 'opacity-50'
                                  : isSelected
                                  ? 'bg-primary-50 dark:bg-primary-900/20'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                              }`}
                            >
                              <div className="flex items-start gap-3 px-4 py-3">
                                {/* Checkbox */}
                                {!isLocked && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLessonComplete(lesson.id);
                                    }}
                                    className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center ${
                                      isCompleted
                                        ? 'bg-green-500 border-green-500 scale-110'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-500'
                                    }`}
                                  >
                                    {isCompleted && (
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    )}
                                  </button>
                                )}
                                
                                {/* Lesson Content */}
                                <button
                                  onClick={() => {
                                    if (!isLocked) {
                                      setSelectedLesson(lesson);
                                    }
                                  }}
                                  disabled={isLocked}
                                  className="flex-1 text-left min-w-0"
                                >
                                  <div className="flex items-start gap-2">
                                    {isLocked ? (
                                      <Lock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    ) : (
                                      <Play className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                        isSelected
                                          ? 'text-primary-600 dark:text-primary-400'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className={`text-sm font-medium block ${
                                        isCompleted
                                          ? 'line-through text-gray-500 dark:text-gray-400'
                                          : isSelected
                                          ? 'text-primary-700 dark:text-primary-300'
                                          : 'text-gray-700 dark:text-gray-300'
                                      }`}>
                                        {lesson.title}
                                      </span>
                                      {lesson.duration && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          {lesson.duration} мин
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isPurchased && (
              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      🔒 Курс жабық
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Барлық материалдарға қол жеткізу үшін курсты сатып алыңыз
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
