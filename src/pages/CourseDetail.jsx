import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Loader2, Play, Lock, CheckCircle, FileText, Calculator, Youtube, Menu, X, Clock, Download, Presentation, ExternalLink, Target } from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database, getUserCourses, isUserAdmin } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';
import VideoPlayer from '../components/VideoPlayer';
import LessonQuizPlayer from '../components/LessonQuizPlayer';
import AdminLessonQuizManager from '../components/AdminLessonQuizManager';

// Функция для преобразования Google Drive ссылки в embed
const getGoogleDriveFileId = (url) => {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([^\/]+)/);
  return match && match[1] ? match[1] : null;
};

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

const getGoogleDriveDownloadUrl = (url) => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
};

const normalizeExternalUrl = (url) => {
  const raw = (url || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  // best-effort: allow pasting without scheme
  return `https://${raw}`;
};


const motivationalQuotes = [
  // Цитаты от Ақәділ ағай
  {
    text: "Оқымасаң – табыс жоқ, табыс жоқ болса – құрмет жоқ. Таңда: оқу немесе кедейлік.",
    author: "Ақәділ ағай"
  },
  {
    text: "Сен өзіңе ақыл айтатын адамдарды тыңдамайсың, ал өмір саған қатал сабақпен үйретеді.",
    author: "Ақәділ ағай"
  },
  {
    text: "Білім – жалғыз нәрсе, оны сенен ешкім ала алмайды. Ақшаны алады, денсаулықты алады, бірақ білімді – ешқашан.",
    author: "Ақәділ ағай"
  },
  {
    text: "Ертең деп жүрген адамның ертеңі ешқашан келмейді. Бүгін бастамасаң – мәңгі бастамайсың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Табысты адамдар мен табыссыз адамдардың айырмашылығы – бірі істейді, екіншісі тек ойлайды.",
    author: "Ақәділ ағай"
  },
  {
    text: "Шаршадым дейтін адам – өз шегіне жетпеген адам. Адамның шегі – өз ойында.",
    author: "Ақәділ ағай"
  },
  {
    text: "Оқу қиын ба? Кедейлікте өмір сүру одан да қиын. Таңдау сенде.",
    author: "Ақәділ ағай"
  },
  {
    text: "Жолдастарыңмен уақыт өткізіп жүргенде, біреу сенің арманыңды жүзеге асырып жатыр.",
    author: "Ақәділ ағай"
  },
  {
    text: "Ешкім сені құтқармайды. Өзің, тек өзің.",
    author: "Ақәділ ағай"
  },
  {
    text: "Егер сен күн сайын өспесең – артқа кетіп барасың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Өз уақытыңды құрметтемеген адам – өз өмірін ысырап етеді.",
    author: "Ақәділ ағай"
  },
  {
    text: "Сен қаншалықты шаршасаң да, сенің арманың сенен күшті болуы керек.",
    author: "Ақәділ ағай"
  },
  {
    text: "Күн сайын кішкентай қадам жасасаң да – бір жылда алыста боласың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Саған ешкім ештеңе бермейді. Барлығы өз қолыңда.",
    author: "Ақәділ ағай"
  },
  {
    text: "Қателік – бұл сәтсіздік емес, сабақ.",
    author: "Ақәділ ағай"
  },
  {
    text: "Тәртіп – табыстың әкесі. Еріншектік – сәтсіздіктің шешесі.",
    author: "Ақәділ ағай"
  },
  {
    text: "Білім – сенің қаруың. Ал білімсіз – сен нысанасың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Мақсатсыз адам – жел айдаған жапырақ. Қайда ұшып жатқанын өзі де білмейді.",
    author: "Ақәділ ағай"
  },
  {
    text: "Бүгін тырыссаң – ертең тынығасың. Бүгін жалқау болсаң – ертең жылайсың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Өз мүмкіндігіңді өзің шектейсің. Оны ешкім тартып алмайды.",
    author: "Ақәділ ағай"
  },
  {
    text: "Саған сеніп отырған адамдар бар. Сол сенімді ақтау – сенің міндетің.",
    author: "Ақәділ ағай"
  },
  {
    text: "Бүгінгі ауырлық – ертеңгі жеңіс.",
    author: "Ақәділ ағай"
  },
  {
    text: "Сен өз өміріңнің бағдарламашысысың. Қателік бар ма? Түзет.",
    author: "Ақәділ ағай"
  },
  {
    text: "Тәртіпсіз талант – бос қуат.",
    author: "Ақәділ ағай"
  },
  {
    text: "Қиындық – сенің өсуіңнің сигналы. Демек, сен дұрыс жолдасың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Өз потенциалыңды көрсең – қорқасың. Сол қорқыныш – дамудың белгісі.",
    author: "Ақәділ ағай"
  },
  {
    text: "Таңдауың қарапайым: не нәтиже, не сылтау.",
    author: "Ақәділ ағай"
  },
  {
    text: "Табыстың кілті – әр күнді есеппен өткізу.",
    author: "Ақәділ ағай"
  },
  {
    text: "Өзіңе уәде берсең – орында. Себебі сенің сөзің – сенің абыройың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Қазір оқы, кейін өмірің үшін рахмет айтасың.",
    author: "Ақәділ ағай"
  },
  {
    text: "Қиын болса да жалғастыр. Сындыра алмаса – күшейтеді.",
    author: "Ақәділ ағай"
  },

  // ⚡ Басқа авторлар мен даналықтар
  {
    text: "Білім – күш, білім – қуат. Білімсіз адам – соқыр адам.",
    author: "Қазақ мақалы"
  },
  {
    text: "Ештеңе істемеген адам ештеңеге жетпейді. Әрекет ет қазір!",
    author: "Даналық"
  },
  {
    text: "Білімді адам – еркін адам. Надандық – құлдықтың түрі.",
    author: "Абай Құнанбаев"
  },
  {
    text: "Білмегенің үшін ұялма, үйренгің келмейтініңе ұял.",
    author: "Қазақ даналығы"
  },
  {
    text: "Сәтсіздік – жеңістің бөлшегі. Тоқтама, алға жүр!",
    author: "Томас Эдисон"
  },
  {
    text: "Knowledge is power. Power to change your life.",
    author: "Francis Bacon"
  },
  {
    text: "Discipline is stronger than motivation.",
    author: "Jocko Willink"
  },
  {
    text: "Success doesn’t come to those who wait, it comes to those who work.",
    author: "Unknown"
  },
  {
    text: "Pain is temporary, pride is forever.",
    author: "Anonymous"
  },
  {
    text: "Dream big. Work harder. Repeat.",
    author: "Aқәділ ағай"
  },
  {
    text: "No one cares how you feel — only what you do.",
    author: "Ақәділ ағай"
  },
  {
    text: "Be so good they can’t ignore you.",
    author: "Steve Martin"
  },
  {
    text: "The only limit is the one in your mind.",
    author: "Napoleon Hill"
  },
  {
    text: "Hard times create strong people.",
    author: "Aқәділ ағай"
  },
  {
    text: "If you can’t handle pressure, you can’t handle success.",
    author: "Aқәділ ағай"
  },
  {
    text: "Work until you don’t need to introduce yourself.",
    author: "Aқәділ ағай"
  },
  
  // Дополнительная мотивация
  {
    text: "Бүгін бар күшіңді салып дайындал, ертең еркін демал! Осы девизбен өмір сүр",
    author: "Ақәділ ағай"
  },
  {
    text: "Үлкен жетістіктер кішкентай қадамдардан басталады. Қазір кішкентай болып көрінген жаттығулар ертең үлкен нәтижеге әкеледі",
    author: "Ақәділ ағай"
  },
  {
    text: "Қателіктерден қорықпа, олар сені күшейтеді. Әр қателікті ҰБТ жолыңдағы тек бір қадам ретінде қабылда, сүрінсең де бұл толық құлдырым емес",
    author: "Ақәділ ағай"
  },
  {
    text: "Саған сеніп отырған адамдар туралы ұмытпа. Олардың сенімі саған үлкен мотивация. Сол адамдардың үмітің ақтағаң сәтті елестетші!",
    author: "Ақәділ ағай"
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
  const [isPurchased, setIsPurchased] = useState(null); // Куплен ли курс (null = загрузка)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false); // Мобильный sidebar
  const [completedLessons, setCompletedLessons] = useState(new Set()); // Просмотренные уроки
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(getRandomQuote()); // Текущая цитата
  const [nextQuote, setNextQuote] = useState(getRandomQuote()); // Следующая цитата для предпросмотра
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [showInstagramHint, setShowInstagramHint] = useState(false);
  const [quoteSwapped, setQuoteSwapped] = useState(false); // Флаг что цитата уже поменялась
  
  // Определяем, открыт ли курс из my-courses
  const isFromMyCourses = location.pathname.startsWith('/my-courses');
  
  // Проверяем, показывали ли подсказку
  useEffect(() => {
    const hintShown = localStorage.getItem('instagram_hint_shown');
    if (!hintShown && isPurchased && !selectedLesson) {
      const showTimer = setTimeout(() => {
        setShowInstagramHint(true);
        localStorage.setItem('instagram_hint_shown', 'true');
      }, 2000);
      
      return () => clearTimeout(showTimer);
    }
  }, [isPurchased, selectedLesson]);
  
  // Таймеры для модального окна - запускаются при каждом showInstagramHint
  useEffect(() => {
    if (showInstagramHint) {
      // X появляется через 3 секунды
      const xTimer = setTimeout(() => {
        const closeBtn = document.getElementById('instagram-hint-close');
        if (closeBtn) {
          closeBtn.classList.remove('opacity-0');
        }
      }, 3000);
      
      // Автозакрытие через 5 секунд
      const closeTimer = setTimeout(() => {
        setShowInstagramHint(false);
      }, 5000);
      
      return () => {
        clearTimeout(xTimer);
        clearTimeout(closeTimer);
      };
    }
  }, [showInstagramHint]);
  
  // Pull to refresh для смены цитаты - плавное раскрытие снизу вверх
  const handleTouchStart = (e) => {
    if (isPurchased !== true || selectedLesson) return;
    const touch = e.touches[0];
    const windowHeight = window.innerHeight;
    // Касание внизу экрана
    if (touch.clientY > windowHeight - 150) {
      setPullStartY(touch.clientY);
      setQuoteSwapped(false); // Сбрасываем флаг при начале нового жеста
      // ФИКСИРУЕМ nextQuote в начале жеста - НЕ МЕНЯЕМ во время тяги!
      if (!isPulling) {
        setNextQuote(getRandomQuote());
      }
    }
  };
  
  const handleTouchMove = (e) => {
    if (isPurchased !== true || selectedLesson || pullStartY === 0) return;
    const touch = e.touches[0];
    const distance = pullStartY - touch.clientY; // ВВЕРХ = положительное
    
    if (distance > 0) {
      e.preventDefault();
      const windowHeight = window.innerHeight;
      const pullPercent = (distance / windowHeight) * 100;
      
      setPullDistance(distance);
      setIsPulling(true);
      
      // КЛЮЧЕВОЙ МОМЕНТ: Когда достигли 70% покрытия - СРАЗУ меняем цитату ПОД overlay ОДИН РАЗ
      if (pullPercent >= 70 && !quoteSwapped) {
        console.log('🔄 Reached 70% - swapping quote UNDER overlay ONE TIME');
        setCurrentQuote(nextQuote);
        // НЕ генерируем новый nextQuote здесь! Он уже зафиксирован в handleTouchStart
        setQuoteSwapped(true); // ФИКСИРУЕМ что поменяли, больше не меняем
      }
    }
  };
  
  const handleTouchEnd = () => {
    const windowHeight = window.innerHeight;
    const pullPercent = (pullDistance / windowHeight) * 100;
    
    console.log('Pull ended:', pullPercent, '% of screen');
    
    // Если протянули больше 70% - цитата УЖЕ поменялась в handleTouchMove
    // Просто закрываем overlay плавно
    if (pullPercent > 70) {
      console.log('✅ Quote already changed, closing overlay smoothly');
    }
    
    // Закрываем overlay - он исчезнет и покажет УЖЕ НОВУЮ цитату внизу
    setIsPulling(false);
    setPullDistance(0);
    setPullStartY(0);
  };

  useEffect(() => {
    loadCourse();
    checkPurchaseStatus();
    loadCompletedLessons();
    checkAdminStatus();
  }, [id]);

  // Auto-select lesson from URL param ?lesson=X (set by MyCourses "continue" button)
  useEffect(() => {
    if (!course || isPurchased === null) return;
    if (!isPurchased) return;
    const params = new URLSearchParams(location.search);
    const lessonParam = params.get('lesson');
    if (!lessonParam) return;
    // Find lesson across all modules
    if (!course.modules) return;
    for (const mod of Object.values(course.modules)) {
      if (mod.lessons && mod.lessons[lessonParam]) {
        setSelectedLesson({ id: lessonParam, ...mod.lessons[lessonParam] });
        return;
      }
    }
  }, [course, isPurchased, location.search]);

  const checkAdminStatus = async () => {
    if (!auth.currentUser) return;
    try {
      const admin = await isUserAdmin(auth.currentUser.uid);
      setIsAdmin(admin || auth.currentUser.email === 'youtub.maj@gmail.com');
    } catch (e) { setIsAdmin(false); }
  };
  
  // Отдельный useEffect для touch handlers
  useEffect(() => {
    // Добавляем обработчики для pull-to-refresh только на мобильных
    if (window.innerWidth < 1024 && isPurchased === true && !selectedLesson) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isPurchased, selectedLesson, pullStartY]);

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
      const userCourse = userCourses.find(c => c.id === id);
      
      // Проверяем истек ли срок курса
      const isExpired = userCourse && 
                        userCourse.enrollment?.expiryDate && 
                        userCourse.enrollment.expiryDate < Date.now();
      
      // Если курс куплен и не истек срок - показываем как купленный
      const purchased = userCourse !== undefined && !isExpired;
      setIsPurchased(purchased);
      console.log('✅ Purchase check:', { courseId: id, purchased, expired: isExpired });
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
    const hasLegacy = !!(lesson?.homeworkUrl || lesson?.formulasUrl);
    const hasFormulaLinks = Array.isArray(lesson?.formulaLinks) && lesson.formulaLinks.some(u => (u || '').trim());
    const hasMaterials = Array.isArray(lesson?.materials) && lesson.materials.some((m) => (m?.url || '').trim());
    return hasLegacy || hasFormulaLinks || hasMaterials;
  };

  const findModuleIdForLesson = (lessonId) => {
    if (!course?.modules) return null;
    for (const [mId, mod] of Object.entries(course.modules)) {
      if (mod.lessons && mod.lessons[lessonId]) return mId;
    }
    return null;
  };

  const getMaterialIcon = (type) => {
    if (type === 'wayground') return ExternalLink;
    if (type === 'pptx') return Presentation;
    return FileText;
  };

  const openMaterial = (material) => {
    if (!material) return;
    const url = typeof material === 'string' ? material : material.url;
    if (!url) return;

    // External quizzes (Wayground/Quizizz): open as-is inside iframe
    if (typeof material === 'object' && material.type === 'wayground') {
      const normalized = normalizeExternalUrl(url);
      if (!normalized) return;
      setActiveMaterial({
        title: material.title || 'Wayground',
        type: 'wayground',
        url: normalized,
        embedUrl: normalized,
        downloadUrl: null
      });
      return;
    }

    const embedUrl = getGoogleDriveEmbedUrl(url);
    if (!embedUrl) {
      window.open(url, '_blank');
      return;
    }

    setActiveMaterial({
      title: typeof material === 'string' ? 'Материал' : (material.title || 'Материал'),
      type: typeof material === 'string' ? 'file' : (material.type || 'file'),
      url,
      embedUrl,
      downloadUrl: getGoogleDriveDownloadUrl(url)
    });
  };

  const closeMaterial = () => setActiveMaterial(null);

  const renderLessonContent = (lesson) => {
    if (!lesson) return null;
    
    return (
      <div className="space-y-4">
        {/* Видео с CustomVideoPlayer */}
        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          {lesson.videoUrl ? (
            <VideoPlayer
              key={lesson.id}
              videoUrl={lesson.videoUrl}
              courseId={id}
              lessonId={lesson.id}
              durationSeconds={typeof lesson.duration === 'number' ? lesson.duration * 60 : undefined}
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
        {hasAttachments(lesson) && (
          <div className="grid grid-cols-1 gap-3">
            {lesson.homeworkUrl && (
              <button
                onClick={() => openMaterial({ title: 'Үй жұмысы', type: 'pdf', url: lesson.homeworkUrl })}
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

            {/* Formula links - support both legacy single URL and new array */}
            {(() => {
              const links = Array.isArray(lesson.formulaLinks)
                ? lesson.formulaLinks.filter(u => (u || '').trim())
                : lesson.formulasUrl ? [lesson.formulasUrl] : [];
              return links.map((url, fi) => (
                <button
                  key={`formula-${fi}`}
                  onClick={() => openMaterial({ title: `${t('courseDetail.formulasTitle')} ${links.length > 1 ? fi + 1 : ''}`.trim(), type: 'pdf', url })}
                  className="group p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/40 dark:hover:to-green-800/40 border-2 border-green-200 dark:border-green-700 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-600 dark:bg-green-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="font-bold text-green-900 dark:text-green-100 text-sm sm:text-base">
                        {t('courseDetail.formulasTitle')}{links.length > 1 ? ` ${fi + 1}` : ''}
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-300 truncate">
                        {t('courseDetail.formulasOpen')}
                      </p>
                    </div>
                  </div>
                </button>
              ));
            })()}

            {Array.isArray(lesson.materials) && lesson.materials
              .filter((m) => (m?.url || '').trim())
              .map((m) => {
                const Icon = getMaterialIcon(m.type);
                return (
                  <button
                    key={m.id || m.url}
                    onClick={() => openMaterial(m)}
                    className="group p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 hover:from-slate-100 hover:to-slate-200 dark:hover:from-slate-900/40 dark:hover:to-slate-800/40 border-2 border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-slate-700 dark:bg-slate-600 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base truncate">
                          {m.title || (m.type || 'file').toUpperCase()}
                        </h4>
                        <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                          {m.type ? m.type.toUpperCase() : 'FILE'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}

      </div>
    );
  };

  if (loading || isPurchased === null) {
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
                    })).sort((a, b) => (a.order || 0) - (b.order || 0));
                    
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
            <>
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
                    {(selectedLesson.formulasUrl || (Array.isArray(selectedLesson.formulaLinks) && selectedLesson.formulaLinks.some(u => (u||'').trim()))) && (
                      <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                        <Calculator className="w-3 h-3" />
                        {t('courseDetail.formulas')}
                      </span>
                    )}
                    {Array.isArray(selectedLesson.materials) && selectedLesson.materials.some((m) => (m?.url || '').trim()) && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full text-xs font-medium flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {selectedLesson.materials.filter((m) => (m?.url || '').trim()).length}
                      </span>
                    )}
                    {selectedLesson.quiz?.questions?.length > 0 && (
                      <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Квиз
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

            {/* ── Quiz — separate card below player, same ternary branch ── */}
            {selectedLesson.quiz?.questions?.length > 0 && (
              <LessonQuizPlayer
                quiz={selectedLesson.quiz}
                courseId={id}
                lessonId={selectedLesson.id}
              />
            )}

            {/* ── Admin quiz manager ── */}
            {isAdmin && (
              <AdminLessonQuizManager
                courseId={id}
                lessonId={selectedLesson.id}
                moduleId={findModuleIdForLesson(selectedLesson.id)}
                quiz={selectedLesson.quiz}
                onQuizUpdate={() => loadCourse()}
              />
            )}
            </>
          ) : isPurchased === true ? (
            // Мотивационная цитата для купленного курса - минимализм
            <div className="relative">
              {/* СЛЕДУЮЩАЯ цитата появляется ПОВЕРХ текущей как ВОДА снизу - начинается тоньше */}
              <div 
                className="lg:hidden fixed bg-white dark:bg-gray-800 pointer-events-none z-50 overflow-hidden"
                style={{ 
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${(pullDistance / window.innerHeight * 100)}%`,
                  opacity: Math.min(pullDistance / 200, 1),
                  transition: isPulling ? 'none' : 'all 0.3s ease-out',
                  clipPath: isPulling 
                    ? (() => {
                        const progress = pullDistance / window.innerHeight;
                        // Начинается с 40% ширины, плавно расширяется до 100%
                        const topWidth = 40 + (progress * 60); // от 40% до 100%
                        const leftOffset = (100 - topWidth) / 2; // центрируем
                        return `polygon(
                          ${leftOffset}% 0%, 
                          ${leftOffset + topWidth}% 0%, 
                          100% 100%, 
                          0% 100%
                        )`;
                      })()
                    : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                }}
              >
                {/* Декоративный фон */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                  <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradNext" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{stopColor: 'rgb(59, 130, 246)', stopOpacity: 1}} />
                        <stop offset="100%" style={{stopColor: 'rgb(147, 51, 234)', stopOpacity: 1}} />
                      </linearGradient>
                    </defs>
                    <circle cx="10" cy="10" r="40" fill="url(#gradNext)" />
                    <circle cx="90" cy="90" r="40" fill="url(#gradNext)" />
                  </svg>
                </div>
                
                {/* Контент следующей цитаты */}
                <div className="relative h-full flex items-center justify-center p-6">
                  <div className="max-w-3xl mx-auto text-center space-y-8">
                    {/* Логотип */}
                    <div className="inline-flex items-center justify-center w-28 h-28 sm:w-32 sm:h-32">
                      <img 
                        src="/icons/logo-прозрачный.png" 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Следующая цитата */}
                    <blockquote className="space-y-6">
                      <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                        "{nextQuote.text}"
                      </p>
                      <footer className="flex items-center justify-center gap-3">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary-600 to-transparent"></div>
                        <cite className="text-base sm:text-lg text-primary-600 dark:text-primary-400 font-semibold not-italic">
                          {nextQuote.author}
                        </cite>
                        <div className="h-px w-12 bg-gradient-to-r from-transparent via-primary-600 to-transparent"></div>
                      </footer>
                    </blockquote>
                  </div>
                </div>
              </div>
              
              {/* Instagram Hint - красивое модальное окно */}
              {showInstagramHint && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-scale-in">
                    <button 
                      id="instagram-hint-close"
                      onClick={() => setShowInstagramHint(false)}
                      className="absolute -top-3 -right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-all duration-300 shadow-lg opacity-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    
                    <div className="text-center space-y-4">
                      {/* Instagram Logo */}
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-2xl shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                          Мотивациямен бөлісіңіз! 🎯
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          Скриншот жасап, Instagram Storiesқа салсаңыз болады,<br/>
                          <span className="font-bold text-purple-600 dark:text-purple-400">@aqdlsh</span> белгілеңіз
                        </p>
                      </div>
                      
                      <div className="pt-2">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-500 dark:text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Автоматты жабылады 5 секундта
                        </div>
                      </div>
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
                  {/* Логотип - БОЛЬШЕ */}
                  <div className="inline-flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36">
                    <img 
                      src="/icons/logo-прозрачный.png" 
                      alt="Logo" 
                      className="w-full h-full object-contain"
                    />
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
                    
                    {/* Вопросительный знак ВНИЗУ автора */}
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => setShowInstagramHint(true)}
                        className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                        title="Қалай бөлісу керек?"
                      >
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                  </blockquote>
                </div>
              </div>
              
              {/* Стрелка с "Келесі" ВНИЗУ блока цитаты, ВВЕРХ */}
              <div className="lg:hidden flex justify-center pt-6">
                <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div className="text-sm font-medium">Келесі</div>
                  <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                </div>
              </div>
              
              {/* Кнопка для desktop */}
              <div className="hidden lg:block flex justify-center pt-6">
                <button
                  onClick={() => {
                    setCurrentQuote(nextQuote);
                    setNextQuote(getRandomQuote());
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  Келесі
                </button>
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
              
              {/* Список уроков с замочками для МОБИЛЬНЫХ */}
              <div className="lg:hidden mt-8 space-y-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-center">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  Курс мазмұны
                </h4>
                {modulesList.map((module, moduleIndex) => {
                  const lessons = module.lessons || {};
                  const lessonsList = Object.keys(lessons).map(key => ({
                    id: key,
                    ...lessons[key]
                  })).sort((a, b) => (a.order || 0) - (b.order || 0));
                  
                  return (
                    <div key={module.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
                      {/* Module Header */}
                      <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {module.title}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {lessonsList.length} сабақ
                        </p>
                      </div>
                      
                      {/* Lessons List */}
                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {lessonsList.map((lesson, lessonIndex) => (
                          <div 
                            key={lesson.id}
                            className="px-4 py-3 flex items-center gap-3 opacity-60"
                          >
                            {/* Lock Icon */}
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            
                            {/* Lesson Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration} мин
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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
                  })).sort((a, b) => (a.order || 0) - (b.order || 0));
                  
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

      {activeMaterial && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3 sm:p-6" onClick={closeMaterial}>
          <div
            className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeMaterial.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{String(activeMaterial.type || 'file').toUpperCase()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {activeMaterial.downloadUrl && (
                  <a
                    href={activeMaterial.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs sm:text-sm font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Скачать
                  </a>
                )}
                <button
                  type="button"
                  onClick={closeMaterial}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                </button>
              </div>
            </div>
            <div className="bg-black">
              <iframe
                title={activeMaterial.title}
                src={activeMaterial.embedUrl}
                className="w-full h-[70vh]"
                allow="autoplay"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
