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

// Мотивационные цитаты на казахском - сильные, жесткие, мотивирующие
const motivationalQuotes = [
  // Цитаты от Ақәділ ағай
  {
    text: "Оқымасаң - табыс жоқ, табыс жоқ болса - құрмет жоқ. Таңда: оқу немесе кедейлік",
    author: "Ақәділ ағай"
  },
  {
    text: "Сен өзіңе ақыл айтатын адамдарды тыңдамайсың, ал өмір саған қатал сабақпен үйретеді",
    author: "Ақәділ ағай"
  },
  {
    text: "Білім - жалғыз нәрсе, оны сенен ешкім ала алмайды. Ақшаны алады, денсаулықты алады, бірақ білімді - ешқашан",
    author: "Ақәділ ағай"
  },
  {
    text: "Ертең деп жүрген адамның ертеңі ешқашан келмейді. Бүгін бастамасаң - мәңгі бастамайсың",
    author: "Ақәділ ағай"
  },
  {
    text: "Табысты адамдар мен табыссыз адамдардың айырмашылығы - бірі істейді, екіншісі жоспарлайды",
    author: "Ақәділ ағай"
  },
  {
    text: "Шаршадым деп жүрген адам әлі өз шынайы күшін көрмеген. Адам шегі - өзіне өзі қойған шек",
    author: "Ақәділ ағай"
  },
  {
    text: "Оқу қиын ба? Кедейлікте өмір сүру одан да қиын. Таңдау сенде",
    author: "Ақәділ ағай"
  },
  {
    text: "Жолдастарыңмен уақытты ысырып жүрген сәтте, басқалар сенің орныңды алып жатыр",
    author: "Ақәділ ағай"
  },
  // Жесткие и мотивирующие цитаты
  {
    text: "Білім - күш, білім - қуат. Білімсіз адам - соқыр адам",
    author: "Қазақ мақалы"
  },
  {
    text: "Бүгін оқымасаң, ертең өкінесің. Уақыт ешкімді күтпейді",
    author: "Өмір шындығы"
  },
  {
    text: "Ештеңе істемеген адам ештеңеге жетпейді. Әрекет ет қазір!",
    author: "Даналық"
  },
  {
    text: "Үйренбеген адам - артта қалған адам. Дамы немесе өл",
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
    text: "Шынайы күш білімде. Күш тапқың келсе - үйрен",
    author: "Фрэнсис Бэкон"
  },
  {
    text: "Сен өз өміріңнің авторысың. Не жазасың - сен шешесің",
    author: "Паоло Коэльо"
  },
  {
    text: "Үйренуден басқа жол жоқ. Білім - жалғыз инвестиция",
    author: "Уоррен Баффет"
  },
  {
    text: "Қиындық - құдайдың сыйы. Оны бас тарт демеді, күшей деді",
    author: "Даналық"
  },
  {
    text: "Сенің болашағың бүгінгі әрекетіңе байланысты. Әрекет ет!",
    author: "Жігер сөзі"
  },
  {
    text: "Мақсатсыз адам - жел ұшыратын қағаз. Мақсат қой, жол тап",
    author: "Өмір шындығы"
  },
  {
    text: "Табыс - бұл жұмыс пен уақыттың көбейтіндісі. Еріншектікке орын жоқ",
    author: "Заманауи даналық"
  },
  {
    text: "Білмегенің үшін ұялма, үйренгің келмейтініңе ұялма",
    author: "Қазақ мақалы"
  },
  {
    text: "Әр сабақ - болашаққа инвестиция. Босқа уақыт жоқ",
    author: "Білім философиясы"
  },
  {
    text: "Өкініш - өткен күнге, оқу - келер күнге",
    author: "Ақыл-ой"
  },
  {
    text: "Жетістік өздігінен келмейді. Тер төгесің, нәтиже аласың",
    author: "Өмір шындығы"
  },
  {
    text: "Уақыт - ең қымбат ресурс. Оны білімге жұмса",
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
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote()); // Случайная цитата
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [showInstagramHint, setShowInstagramHint] = useState(false);
  
  // Определяем, открыт ли курс из my-courses
  const isFromMyCourses = location.pathname.startsWith('/my-courses');
  
  // Проверяем, показывали ли подсказку
  useEffect(() => {
    const hintShown = localStorage.getItem('instagram_hint_shown');
    if (!hintShown && isPurchased && !selectedLesson) {
      setTimeout(() => {
        setShowInstagramHint(true);
        localStorage.setItem('instagram_hint_shown', 'true');
        // Скрываем через 8 секунд
        setTimeout(() => setShowInstagramHint(false), 8000);
      }, 2000);
    }
  }, [isPurchased, selectedLesson]);
  
  // Pull to refresh для смены цитаты на мобильном
  const handleTouchStart = (e) => {
    if (!isPurchased || selectedLesson) return;
    const touch = e.touches[0];
    setPullStartY(touch.clientY);
  };
  
  const handleTouchMove = (e) => {
    if (!isPurchased || selectedLesson || pullStartY === 0) return;
    const touch = e.touches[0];
    const distance = touch.clientY - pullStartY;
    
    // Только если тянем вниз и скролл в самом верху
    if (distance > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(distance, 120));
      setIsPulling(true);
    }
  };
  
  const handleTouchEnd = () => {
    if (pullDistance > 80) {
      // Смена цитаты
      setCurrentQuote(getRandomQuote());
    }
    setPullStartY(0);
    setPullDistance(0);
    setIsPulling(false);
  };

  useEffect(() => {
    loadCourse();
    checkPurchaseStatus();
    loadCompletedLessons();
    
    // Добавляем обработчики для pull-to-refresh только на мобильных
    if (window.innerWidth < 1024) {
      document.addEventListener('touchstart', handleTouchStart);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [id, pullStartY, pullDistance, isPurchased, selectedLesson]);

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
            // Мотивационная цитата для купленного курса - минимализм
            <div className="relative">
              {/* Pull indicator for mobile */}
              {isPulling && (
                <div 
                  className="lg:hidden absolute -top-20 left-1/2 transform -translate-x-1/2 transition-all duration-300"
                  style={{ opacity: pullDistance / 120 }}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-bounce">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </div>
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                      Жаңа цитата үшін тартыңыз
                    </span>
                  </div>
                </div>
              )}
              
              {/* Instagram Hint - показывается один раз */}
              {showInstagramHint && (
                <div className="fixed top-20 right-4 left-4 md:left-auto md:w-96 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-2xl p-4 z-50 animate-fade-in">
                  <button 
                    onClick={() => setShowInstagramHint(false)}
                    className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">📸</div>
                    <div className="flex-1">
                      <p className="font-bold text-sm mb-1">Мотивацияны бөлісіңіз!</p>
                      <p className="text-xs opacity-90">
                        Скриншот жасап, Instagram Stories-те бөлісіп, <span className="font-bold">@aqdlsh</span> белгілеңіз
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Минималистичная страница с цитатой */}
              <div className="min-h-[60vh] flex items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 sm:p-12 relative overflow-hidden">
                {/* Декоративный фон */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: 'rgb(59, 130, 246)', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: 'rgb(147, 51, 234)', stopOpacity: 1}} />
                      </linearGradient>
                    </defs>
                    <circle cx="10" cy="10" r="40" fill="url(#grad)" />
                    <circle cx="90" cy="90" r="40" fill="url(#grad)" />
                  </svg>
                </div>
                
                {/* Контент */}
                <div className="relative max-w-3xl mx-auto text-center space-y-8">
                  {/* Иконка книги */}
                  <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
                    <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                  </div>
                  
                  {/* Цитата */}
                  <blockquote className="space-y-6">
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                      "{currentQuote.text}"
                    </p>
                    <footer className="flex items-center justify-center gap-3">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary-600 to-transparent"></div>
                      <cite className="text-base sm:text-lg text-primary-600 dark:text-primary-400 font-semibold not-italic">
                        {currentQuote.author}
                      </cite>
                      <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary-600 to-transparent"></div>
                    </footer>
                  </blockquote>
                  
                  {/* Hint для мобильного */}
                  <div className="lg:hidden pt-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-full text-xs text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      <span>Жаңа цитата үшін төменнен тартыңыз</span>
                    </div>
                  </div>
                  
                  {/* Hint для desktop - можно обновить */}
                  <div className="hidden lg:block pt-4">
                    <button
                      onClick={() => setCurrentQuote(getRandomQuote())}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Басқа цитата
                    </button>
                  </div>
                </div>
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
