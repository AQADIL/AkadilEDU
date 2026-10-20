import { normalizeExternalUrl } from '../utils/urls';
import i18n from '../i18n';
import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  BookOpen,
  Loader2,
  Play,
  Lock,
  CheckCircle,
  FileText,
  Calculator,
  Menu,
  X,
  Clock,
  Download,
  Presentation,
  ExternalLink,
  Target,
} from 'lucide-react';
import { ref, get } from 'firebase/database';
import { database, getUserCourses, isUserAdmin } from '../firebase/realtimeDb';
import { auth } from '../firebase/config';
import VideoPlayer from '../components/VideoPlayer';
import LessonQuizPlayer from '../components/LessonQuizPlayer';
const AdminLessonQuizManager = lazy(() => import('../components/AdminLessonQuizManager'));

const getGoogleDriveFileId = (url) => {
  if (!url) return null;
  const match = url.match(/\/file\/d\/([^/]+)/);
  return match && match[1] ? match[1] : null;
};

const getGoogleDriveEmbedUrl = (url) => {
  if (!url) return null;

  const match = url.match(/\/file\/d\/([^/]+)/);
  if (match && match[1]) {
    return `${new URL(url).origin}/file/d/${match[1]}/preview`;
  }

  if (url.includes('/preview')) {
    return url;
  }

  return null;
};

const getGoogleDriveDownloadUrl = (url) => {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;
  return `${new URL(url).origin}/uc?export=download&id=${fileId}`;
};

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isPurchased, setIsPurchased] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [activeMaterial, setActiveMaterial] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const isFromMyCourses = location.pathname.startsWith('/my-courses');

  const toggleLessonComplete = (lessonId) => {
    setCompletedLessons((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId);
      } else {
        newSet.add(lessonId);
      }

      localStorage.setItem(`completed_lessons_${id}`, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const hasAttachments = (lesson) => {
    const hasLegacy = !!(lesson?.homeworkUrl || lesson?.formulasUrl);
    const hasFormulaLinks =
      Array.isArray(lesson?.formulaLinks) && lesson.formulaLinks.some((u) => (u || '').trim());
    const hasMaterials =
      Array.isArray(lesson?.materials) && lesson.materials.some((m) => (m?.url || '').trim());
    const hasCustomModules =
      Array.isArray(lesson?.customModules) &&
      lesson.customModules.some((m) => (m?.url || '').trim());
    return hasLegacy || hasFormulaLinks || hasMaterials || hasCustomModules;
  };

  const getLessonMaterials = (lesson) => {
    const materials = [];
    if (lesson?.homeworkUrl) {
      materials.push({
        id: 'homework',
        title: i18n.t('courseDetail.homeworkTitle'),
        type: 'homework',
        url: lesson.homeworkUrl,
        color: 'blue',
        icon: FileText,
        badgeLabel: i18n.t('ui.homework'),
      });
    }
    const formulaLinks = Array.isArray(lesson?.formulaLinks)
      ? lesson.formulaLinks.filter((u) => (u || '').trim())
      : lesson?.formulasUrl
        ? [lesson.formulasUrl]
        : [];
    formulaLinks.forEach((url, idx) => {
      materials.push({
        id: `formula-${idx}`,
        title: `${t('courseDetail.formulasTitle')}${formulaLinks.length > 1 ? ` ${idx + 1}` : ''}`,
        type: 'formula',
        url,
        color: 'green',
        icon: Calculator,
        badgeLabel: t('courseDetail.formulas'),
      });
    });
    if (Array.isArray(lesson?.customModules)) {
      lesson.customModules
        .filter((m) => (m?.url || '').trim())
        .forEach((m) => {
          materials.push({
            id: m.id,
            title: m.name,
            type: 'custom',
            url: m.url,
            color: m.color || 'pink',
            icon: FileText,
            badgeLabel: m.name || i18n.t('ui.module'),
          });
        });
    }
    if (Array.isArray(lesson?.materials)) {
      lesson.materials
        .filter((m) => (m?.url || '').trim())
        .forEach((m) => {
          materials.push({
            id: m.id || m.url,
            title: m.title || (m.type || 'file').toUpperCase(),
            type: m.type || 'file',
            url: m.url,
            color: 'slate',
            icon: getMaterialIcon(m.type),
            badgeLabel: m.type ? m.type.toUpperCase() : 'FILE',
          });
        });
    }
    return materials;
  };

  const MODULE_COLORS = [
    {
      name: 'blue',
      label: i18n.t('ui.blue'),
      bg: 'from-blue-50 to-blue-100',
      darkBg: 'bg-blue-900/30',
      border: 'border-blue-200 dark:border-blue-700',
      iconBg: 'bg-blue-600 dark:bg-blue-500',
      text: 'text-blue-900 dark:text-blue-100',
      subtext: 'text-blue-700 dark:text-blue-300',
    },
    {
      name: 'green',
      label: i18n.t('ui.green'),
      bg: 'from-green-50 to-green-100',
      darkBg: 'bg-green-900/30',
      border: 'border-green-200 dark:border-green-700',
      iconBg: 'bg-green-600 dark:bg-green-500',
      text: 'text-green-900 dark:text-green-100',
      subtext: 'text-green-700 dark:text-green-300',
    },
    {
      name: 'purple',
      label: i18n.t('ui.purple'),
      bg: 'from-purple-50 to-purple-100',
      darkBg: 'bg-purple-900/30',
      border: 'border-purple-200 dark:border-purple-700',
      iconBg: 'bg-purple-600 dark:bg-purple-500',
      text: 'text-purple-900 dark:text-purple-100',
      subtext: 'text-purple-700 dark:text-purple-300',
    },
    {
      name: 'orange',
      label: i18n.t('ui.orange'),
      bg: 'from-orange-50 to-orange-100',
      darkBg: 'bg-orange-900/30',
      border: 'border-orange-200 dark:border-orange-700',
      iconBg: 'bg-orange-600 dark:bg-orange-500',
      text: 'text-orange-900 dark:text-orange-100',
      subtext: 'text-orange-700 dark:text-orange-300',
    },
    {
      name: 'pink',
      label: i18n.t('ui.pink'),
      bg: 'from-pink-50 to-pink-100',
      darkBg: 'bg-pink-900/30',
      border: 'border-pink-200 dark:border-pink-700',
      iconBg: 'bg-pink-600 dark:bg-pink-500',
      text: 'text-pink-900 dark:text-pink-100',
      subtext: 'text-pink-700 dark:text-pink-300',
    },
    {
      name: 'indigo',
      label: i18n.t('ui.indigo'),
      bg: 'from-indigo-50 to-indigo-100',
      darkBg: 'bg-indigo-900/30',
      border: 'border-indigo-200 dark:border-indigo-700',
      iconBg: 'bg-indigo-600 dark:bg-indigo-500',
      text: 'text-indigo-900 dark:text-indigo-100',
      subtext: 'text-indigo-700 dark:text-indigo-300',
    },
  ];

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
    const url = normalizeExternalUrl(typeof material === 'string' ? material : material.url);
    if (!url) {
      alert(t('courseDetail.invalidMaterialUrl'));
      return;
    }

    if (typeof material === 'object' && material.type === 'wayground') {
      const normalized = normalizeExternalUrl(url);
      if (!normalized) return;
      setActiveMaterial({
        title: material.title || i18n.t('ui.material'),
        type: 'wayground',
        url: normalized,
        embedUrl: normalized,
        downloadUrl: null,
      });
      return;
    }

    const embedUrl = getGoogleDriveEmbedUrl(url);
    if (!embedUrl) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    setActiveMaterial({
      title:
        typeof material === 'string'
          ? i18n.t('ui.material')
          : material.title || i18n.t('ui.material'),
      type: typeof material === 'string' ? 'file' : material.type || 'file',
      url,
      embedUrl,
      downloadUrl: getGoogleDriveDownloadUrl(url),
    });
  };

  const closeMaterial = () => setActiveMaterial(null);

  const renderLessonContent = (lesson) => {
    if (!lesson) return null;

    return (
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          {lesson.videoUrl ? (
            <VideoPlayer
              key={lesson.id}
              videoUrl={lesson.videoUrl}
              courseId={id}
              lessonId={lesson.id}
              durationSeconds={
                typeof lesson.duration === 'number' ? lesson.duration * 60 : undefined
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              <div className="text-center">
                <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
                <p>{i18n.t('courseDetail.videoUnavailable')}</p>
              </div>
            </div>
          )}
        </div>

        {Array.isArray(lesson.customModules) &&
          lesson.customModules.filter((m) => (m?.url || '').trim()).length > 0 && (
            <div className="flex flex-wrap gap-3">
              {lesson.customModules
                .filter((m) => (m?.url || '').trim())
                .map((m) => {
                  const colorConfig =
                    MODULE_COLORS.find((color) => color.name === m.color) || MODULE_COLORS[0];
                  return (
                    <button
                      key={m.id}
                      onClick={() => openMaterial({ title: m.name, type: 'pdf', url: m.url })}
                      className={`group px-4 py-2.5 border-2 ${colorConfig.border} rounded-lg transition-all duration-300 hover:shadow-lg active:scale-95`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`p-2 ${colorConfig.iconBg} rounded-md group-hover:scale-110 transition-transform flex-shrink-0`}
                        >
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="text-left">
                          <h4 className={`font-bold ${colorConfig.text} text-sm`}>{m.name}</h4>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          )}

        {hasAttachments(lesson) && (
          <div className="grid grid-cols-1 gap-6">
            {lesson.homeworkUrl && (
              <button
                onClick={() =>
                  openMaterial({
                    title: i18n.t('courseDetail.homeworkTitle'),
                    type: 'pdf',
                    url: lesson.homeworkUrl,
                  })
                }
                className="group p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-900/40 dark:hover:to-blue-800/40 border-2 border-blue-200 dark:border-blue-700 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-600 dark:bg-blue-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h4 className="font-bold text-blue-900 dark:text-blue-100 text-sm sm:text-base">
                      {i18n.t('courseDetail.homeworkTitle')}
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 truncate">
                      {i18n.t('courseDetail.homeworkOpen')}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {(() => {
              const links = Array.isArray(lesson.formulaLinks)
                ? lesson.formulaLinks.filter((u) => (u || '').trim())
                : lesson.formulasUrl
                  ? [lesson.formulasUrl]
                  : [];
              return links.map((url, fi) => (
                <button
                  key={`formula-${fi}`}
                  onClick={() =>
                    openMaterial({
                      title:
                        `${t('courseDetail.formulasTitle')} ${links.length > 1 ? fi + 1 : ''}`.trim(),
                      type: 'pdf',
                      url,
                    })
                  }
                  className="group p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 hover:from-green-100 hover:to-green-200 dark:hover:from-green-900/40 dark:hover:to-green-800/40 border-2 border-green-200 dark:border-green-700 rounded-xl transition-all duration-300 hover:shadow-lg active:scale-95"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-600 dark:bg-green-500 rounded-lg group-hover:scale-110 transition-transform flex-shrink-0">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <h4 className="font-bold text-green-900 dark:text-green-100 text-sm sm:text-base">
                        {t('courseDetail.formulasTitle')}
                        {links.length > 1 ? ` ${fi + 1}` : ''}
                      </h4>
                      <p className="text-xs text-green-700 dark:text-green-300 truncate">
                        {t('courseDetail.formulasOpen')}
                      </p>
                    </div>
                  </div>
                </button>
              ));
            })()}

            {Array.isArray(lesson.materials) &&
              lesson.materials
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
                            {m.title || m.type?.toUpperCase() || i18n.t('ui.material')}
                          </h4>
                          <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                            {m.type ? m.type.toUpperCase() : i18n.t('ui.material')}
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

  const loadCompletedLessons = useCallback(() => {
    const saved = localStorage.getItem(`completed_lessons_${id}`);
    if (saved) {
      setCompletedLessons(new Set(JSON.parse(saved)));
    }
  }, [id]);

  const checkPurchaseStatus = useCallback(async () => {
    if (!auth.currentUser) {
      setIsPurchased(false);
      return;
    }

    try {
      const userCourses = await getUserCourses(auth.currentUser.uid);
      const userCourse = userCourses.find((c) => c.id === id);

      const isExpired =
        userCourse &&
        userCourse.enrollment?.expiryDate &&
        userCourse.enrollment.expiryDate < Date.now();

      const purchased = userCourse !== undefined && !isExpired;
      setIsPurchased(purchased);
    } catch {
      setIsPurchased(false);
    }
  }, [id]);

  const loadCourse = useCallback(async () => {
    if (!database) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    try {
      const adminAccess = await isUserAdmin(auth.currentUser.uid);
      const enrollment = await get(
        ref(database, 'users/' + auth.currentUser.uid + '/courses/' + id),
      );
      const access = enrollment.val();
      const canRead =
        adminAccess || (access && (!access.expiryDate || access.expiryDate > Date.now()));
      const courseRef = ref(database, (canRead ? 'courses/' : 'courseCatalog/') + id);
      const snapshot = await get(courseRef);

      if (snapshot.exists()) {
        const courseData = { id, ...snapshot.val() };
        setCourse(courseData);
      } else {
        navigate('/courses');
      }
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const checkAdminStatus = useCallback(async () => {
    if (!auth.currentUser) return;
    try {
      const admin = await isUserAdmin(auth.currentUser.uid);
      setIsAdmin(admin);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    loadCourse();
    checkPurchaseStatus();
    loadCompletedLessons();
    checkAdminStatus();
  }, [checkAdminStatus, checkPurchaseStatus, loadCompletedLessons, loadCourse]);

  useEffect(() => {
    if (!course || isPurchased === null) return;
    if (!isPurchased) return;
    const params = new URLSearchParams(location.search);
    const lessonParam = params.get('lesson');
    if (!lessonParam) return;

    if (!course.modules) return;
    for (const mod of Object.values(course.modules)) {
      if (mod.lessons && mod.lessons[lessonParam]) {
        setSelectedLesson({ id: lessonParam, ...mod.lessons[lessonParam] });
        return;
      }
    }
  }, [course, isPurchased, location]);

  if (loading || isPurchased === null) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (loadError)
    return (
      <div role="alert" className="py-16 text-center space-y-4">
        <p>{t('common.loadError')}</p>
        <button
          type="button"
          onClick={loadCourse}
          className="px-5 py-3 rounded-xl bg-primary-600 text-white"
        >
          {t('common.retry')}
        </button>
      </div>
    );

  if (!course) {
    return null;
  }

  const modules = course.modules || {};
  const modulesList = Object.keys(modules)
    .map((key) => ({
      id: key,
      ...modules[key],
    }))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          onClick={() => navigate(isFromMyCourses ? '/my-courses' : '/courses')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

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

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          <div className="absolute right-0 top-0 bottom-0 w-96 max-w-[90vw] bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-purple-600 text-white p-5 flex items-center justify-between z-10 shadow-lg">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {i18n.t('courseDetail.courseContent')}
                </h3>
                <p className="text-xs opacity-90 mt-1">
                  {modulesList.length}
                  {i18n.t('ui.modules')}
                  {modulesList.reduce(
                    (total, module) => total + Object.keys(module.lessons || {}).length,
                    0,
                  )}
                  {i18n.t('ui.lessons')}
                </p>
              </div>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4">
              {modulesList.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  {i18n.t('ui.noModules')}
                </p>
              ) : (
                <div className="space-y-4">
                  {modulesList.map((module, moduleIndex) => {
                    const lessons = module.lessons || {};
                    const lessonsList = Object.keys(lessons)
                      .map((key) => ({
                        id: key,
                        ...lessons[key],
                      }))
                      .sort((a, b) => (a.order || 0) - (b.order || 0));

                    const completedCount = lessonsList.filter((l) =>
                      completedLessons.has(l.id),
                    ).length;

                    return (
                      <div
                        key={module.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg"
                      >
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
                                        <Play
                                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                            isSelected
                                              ? 'text-primary-600 dark:text-primary-400'
                                              : 'text-gray-500 dark:text-gray-400'
                                          }`}
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <span
                                          className={`text-sm font-medium block ${
                                            isCompleted
                                              ? 'line-through text-gray-500 dark:text-gray-400'
                                              : isSelected
                                                ? 'text-primary-700 dark:text-primary-300'
                                                : 'text-gray-700 dark:text-gray-300'
                                          }`}
                                        >
                                          {lesson.title}
                                        </span>
                                        {lesson.duration && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {lesson.duration}
                                            {i18n.t('ui.min')}
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
                      {getLessonMaterials(selectedLesson).map((material) => {
                        const Icon = material.icon;

                        return (
                          <span
                            key={material.id}
                            className={`px-2.5 py-1 bg-${material.color}-100 dark:bg-${material.color}-900 text-${material.color}-700 dark:text-${material.color}-300 rounded-full text-xs font-medium flex items-center gap-1`}
                          >
                            <Icon className="w-3 h-3" />
                            {material.badgeLabel}
                          </span>
                        );
                      })}
                      {selectedLesson.quiz?.questions?.length > 0 && (
                        <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {i18n.t('ui.quiz2')}
                        </span>
                      )}
                    </div>
                  </div>
                  {renderLessonContent(selectedLesson)}
                  {selectedLesson.duration && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                      {t('courseEditor.duration')}: {selectedLesson.duration}
                      {i18n.t('ui.min')}
                    </p>
                  )}
                </div>
              </div>

              {selectedLesson.quiz?.questions?.length > 0 && (
                <LessonQuizPlayer
                  quiz={selectedLesson.quiz}
                  courseId={id}
                  lessonId={selectedLesson.id}
                />
              )}

              {isAdmin && (
                <Suspense fallback={null}>
                  <AdminLessonQuizManager
                    courseId={id}
                    lessonId={selectedLesson.id}
                    moduleId={findModuleIdForLesson(selectedLesson.id)}
                    quiz={selectedLesson.quiz}
                    onQuizUpdate={() => loadCourse()}
                  />
                </Suspense>
              )}
            </>
          ) : isPurchased === true ? (
            <div className="p-8">
              <BookOpen className="w-10 h-10 text-primary-600 mb-4" />
              <p>{t('courseDetail.chooseLesson')}</p>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-8 sm:p-12 text-center border-2 border-primary-200 dark:border-primary-900">
              <div className="max-w-md mx-auto">
                <div className="relative inline-block mb-6">
                  <BookOpen className="w-20 h-20 sm:w-24 sm:h-24 text-primary-600 dark:text-primary-400 mx-auto" />
                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-2">
                    <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {i18n.t('courseDetail.courseContent')}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {i18n.t('ui.selectALessonFromTheCourseContents')}
                </p>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>
                        {modulesList.length}
                        {i18n.t('course.modules')}
                      </span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Play className="w-4 h-4" />
                      <span>
                        {modulesList.reduce(
                          (total, module) => total + Object.keys(module.lessons || {}).length,
                          0,
                        )}
                        {i18n.t('ui.lessons')}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary px-6 sm:px-8 py-2.5 sm:py-3 text-base sm:text-lg font-semibold">
                  {i18n.t('ui.browseCourses')}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                  {i18n.t('ui.contactTheCourseAdministratorToRequestAccess')}
                </p>
              </div>

              <div className="lg:hidden mt-8 space-y-4">
                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-center">
                  <BookOpen className="w-5 h-5 text-primary-600" />
                  {i18n.t('courseDetail.courseContent')}
                </h4>
                {modulesList.map((module, moduleIndex) => {
                  const lessons = module.lessons || {};
                  const lessonsList = Object.keys(lessons)
                    .map((key) => ({
                      id: key,
                      ...lessons[key],
                    }))
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                  return (
                    <div
                      key={module.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
                      <div className="bg-gradient-to-r from-primary-500/10 to-purple-500/10 dark:from-primary-500/20 dark:to-purple-500/20 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <h5 className="font-semibold text-gray-900 dark:text-white text-sm">
                          {module.title}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {lessonsList.length}
                          {i18n.t('ui.lessons')}
                        </p>
                      </div>

                      <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {lessonsList.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className="px-4 py-3 flex items-center gap-3 opacity-60"
                          >
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Lock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {lesson.title}
                              </p>
                              {lesson.duration && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                                  <Clock className="w-3 h-3" />
                                  {lesson.duration}
                                  {i18n.t('ui.min')}
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

        <div className="hidden lg:block space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              {i18n.t('courseDetail.courseContent')}
            </h3>

            {modulesList.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {i18n.t('ui.noModules')}
              </p>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {modulesList.map((module, moduleIndex) => {
                  const lessons = module.lessons || {};
                  const lessonsList = Object.keys(lessons)
                    .map((key) => ({
                      id: key,
                      ...lessons[key],
                    }))
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                  const completedCount = lessonsList.filter((l) =>
                    completedLessons.has(l.id),
                  ).length;

                  return (
                    <div
                      key={module.id}
                      className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700/50 dark:to-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700"
                    >
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
                                    {isCompleted && <CheckCircle className="w-4 h-4 text-white" />}
                                  </button>
                                )}

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
                                      <Play
                                        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                                          isSelected
                                            ? 'text-primary-600 dark:text-primary-400'
                                            : 'text-gray-500 dark:text-gray-400'
                                        }`}
                                      />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span
                                        className={`text-sm font-medium block ${
                                          isCompleted
                                            ? 'line-through text-gray-500 dark:text-gray-400'
                                            : isSelected
                                              ? 'text-primary-700 dark:text-primary-300'
                                              : 'text-gray-700 dark:text-gray-300'
                                        }`}
                                      >
                                        {lesson.title}
                                      </span>
                                      {lesson.duration && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                          {lesson.duration}
                                          {i18n.t('ui.min')}
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
                      {i18n.t('ui.courseAccessRequired')}
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      {i18n.t('ui.yourAdministratorAssignsAccessToCourseMaterials')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeMaterial && (
        <div
          className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-3 sm:p-6"
          onClick={closeMaterial}
        >
          <div
            className="w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {activeMaterial.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {i18n.t('ui.material')}
                </p>
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
                    {i18n.t('ui.download')}
                  </a>
                )}
                <button
                  type="button"
                  onClick={closeMaterial}
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={i18n.t('common.close')}
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
