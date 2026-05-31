import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Youtube, GripVertical, FileText, Calculator, Palette } from 'lucide-react';
import { createCourse, updateCourse } from '../../firebase/realtimeDb';
import { auth } from '../../firebase/config';
import { useTranslation } from 'react-i18next';

const MODULE_COLORS = [
  { name: 'blue', label: 'Көк', bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', iconBg: 'bg-blue-600' },
  { name: 'green', label: 'Жасыл', bg: 'from-green-50 to-green-100', border: 'border-green-200', iconBg: 'bg-green-600' },
  { name: 'purple', label: 'Күлгін', bg: 'from-purple-50 to-purple-100', border: 'border-purple-200', iconBg: 'bg-purple-600' },
  { name: 'orange', label: 'Қызыл-сары', bg: 'from-orange-50 to-orange-100', border: 'border-orange-200', iconBg: 'bg-orange-600' },
  { name: 'pink', label: 'Қызғылт', bg: 'from-pink-50 to-pink-100', border: 'border-pink-200', iconBg: 'bg-pink-600' },
  { name: 'indigo', label: 'Көкшіл', bg: 'from-indigo-50 to-indigo-100', border: 'border-indigo-200', iconBg: 'bg-indigo-600' },
];

export default function CourseEditor({ course, isOpen, onClose }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverUrl: '',
    modules: {}
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        coverUrl: course.coverUrl || '',
        modules: course.modules || {}
      });
    } else {
      setFormData({
        title: '',
        description: '',
        coverUrl: '',
        modules: {}
      });
    }
  }, [course]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('Введите название курса');
      return;
    }

    setSaving(true);
    try {
      if (course) {
        // Update existing course
        await updateCourse(course.id, formData, auth.currentUser.uid);
      } else {
        // Create new course
        await createCourse(formData, auth.currentUser.uid);
      }
      onClose();
    } catch (error) {
      console.error('Error saving course:', error);
      alert('Ошибка при сохранении курса');
    } finally {
      setSaving(false);
    }
  };

  const addModule = () => {
    const moduleId = `module_${Date.now()}`;
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [moduleId]: {
          title: 'Новый модуль',
          order: Object.keys(formData.modules).length,
          lessons: {}
        }
      }
    });
  };

  const updateModule = (moduleId, field, value) => {
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [moduleId]: {
          ...formData.modules[moduleId],
          [field]: value
        }
      }
    });
  };

  const deleteModule = (moduleId) => {
    const { [moduleId]: removed, ...rest } = formData.modules;
    setFormData({ ...formData, modules: rest });
  };

  const addLesson = (moduleId) => {
    const lessonId = `lesson_${Date.now()}`;
    const currentLessons = formData.modules[moduleId].lessons || {};
    
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [moduleId]: {
          ...formData.modules[moduleId],
          lessons: {
            ...currentLessons,
            [lessonId]: {
              title: 'Новый урок',
              videoUrl: '',
              order: Object.keys(currentLessons).length,
              duration: 0,
              homeworkUrl: '',
              formulasUrl: '',
              materials: []
            }
          }
        }
      }
    });
  };

  // ─── Formula links helpers ───
  const addFormulaLink = (moduleId, lessonId) => {
    const lesson = formData.modules?.[moduleId]?.lessons?.[lessonId];
    if (!lesson) return;
    const current = Array.isArray(lesson.formulaLinks) ? lesson.formulaLinks : (lesson.formulasUrl ? [lesson.formulasUrl] : []);
    updateLesson(moduleId, lessonId, 'formulaLinks', [...current, '']);
  };

  const updateFormulaLink = (moduleId, lessonId, index, value) => {
    const lesson = formData.modules?.[moduleId]?.lessons?.[lessonId];
    if (!lesson) return;
    const current = Array.isArray(lesson.formulaLinks) ? [...lesson.formulaLinks] : (lesson.formulasUrl ? [lesson.formulasUrl] : []);
    current[index] = value;
    updateLesson(moduleId, lessonId, 'formulaLinks', current);
  };

  const removeFormulaLink = (moduleId, lessonId, index) => {
    const lesson = formData.modules?.[moduleId]?.lessons?.[lessonId];
    if (!lesson) return;
    const current = Array.isArray(lesson.formulaLinks) ? [...lesson.formulaLinks] : [];
    current.splice(index, 1);
    updateLesson(moduleId, lessonId, 'formulaLinks', current);
  };

  const updateLesson = (moduleId, lessonId, field, value) => {
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [moduleId]: {
          ...formData.modules[moduleId],
          lessons: {
            ...formData.modules[moduleId].lessons,
            [lessonId]: {
              ...formData.modules[moduleId].lessons[lessonId],
              [field]: value
            }
          }
        }
      }
    });
  };

  const deleteLesson = (moduleId, lessonId) => {
    const { [lessonId]: removed, ...rest } = formData.modules[moduleId].lessons;
    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [moduleId]: {
          ...formData.modules[moduleId],
          lessons: rest
        }
      }
    });
  };

  // Custom modules functions
  const addCustomModule = (moduleId, lessonId) => {
    const lesson = formData.modules?.[moduleId]?.lessons?.[lessonId];
    if (!lesson) return;
    const current = Array.isArray(lesson.customModules) ? lesson.customModules : [];
    const newModule = {
      id: `custom_${Date.now()}`,
      name: '',
      color: 'blue',
      url: ''
    };
    updateLesson(moduleId, lessonId, 'customModules', [...current, newModule]);
  };

  const updateCustomModule = (moduleId, lessonId, moduleIndex, field, value) => {
    const lesson = formData.modules?.[moduleId]?.lessons?.[lessonId];
    if (!lesson) return;
    const current = Array.isArray(lesson.customModules) ? [...lesson.customModules] : [];
    current[moduleIndex] = { ...current[moduleIndex], [field]: value };
    updateLesson(moduleId, lessonId, 'customModules', current);
  };

  const deleteCustomModule = (moduleId, lessonId, moduleIndex) => {
    const lesson = formData.modules?.[moduleId]?.lessons?.[lessonId];
    if (!lesson) return;
    const current = Array.isArray(lesson.customModules) ? [...lesson.customModules] : [];
    current.splice(moduleIndex, 1);
    updateLesson(moduleId, lessonId, 'customModules', current);
  };

  const moveModule = (moduleId, direction) => {
    const entries = Object.entries(formData.modules || {});
    if (entries.length <= 1) return;

    const sorted = [...entries].sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
    const currentIndex = sorted.findIndex(([id]) => id === moduleId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const newModules = { ...formData.modules };
    reordered.forEach(([id, module], index) => {
      newModules[id] = { ...module, order: index };
    });

    setFormData({
      ...formData,
      modules: newModules
    });
  };

  const moveLesson = (moduleId, lessonId, direction) => {
    const module = formData.modules[moduleId];
    if (!module || !module.lessons) return;

    const entries = Object.entries(module.lessons);
    if (entries.length <= 1) return;

    const sorted = [...entries].sort(([, a], [, b]) => (a.order || 0) - (b.order || 0));
    const currentIndex = sorted.findIndex(([id]) => id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const reordered = [...sorted];
    const temp = reordered[currentIndex];
    reordered[currentIndex] = reordered[targetIndex];
    reordered[targetIndex] = temp;

    const newLessons = {};
    reordered.forEach(([id, lesson], index) => {
      newLessons[id] = { ...lesson, order: index };
    });

    setFormData({
      ...formData,
      modules: {
        ...formData.modules,
        [moduleId]: {
          ...module,
          lessons: newLessons
        }
      }
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-4 md:inset-10 bg-white dark:bg-gray-800 z-50 rounded-xl shadow-2xl overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {course ? t('courseEditor.editCourse') : t('courseEditor.createCourse')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6">
            {/* Course Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('courseEditor.courseName')}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('courseEditor.courseNamePlaceholder')}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Course Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Описание курса
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Опишите курс"
                rows={3}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Cover URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL Обложки (1920x480)
              </label>
              <input
                type="url"
                value={formData.coverUrl}
                onChange={(e) => setFormData({ ...formData, coverUrl: e.target.value })}
                placeholder="https://example.com/cover.jpg"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                📸 Рекомендуемый размер: 1920x480. Если не указать - сгенерируется красивый градиент автоматически
              </p>
              {formData.coverUrl && (
                <div className="mt-3 rounded-lg overflow-hidden">
                  <img
                    src={formData.coverUrl}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className="hidden p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                    ❌ Не удалось загрузить изображение. Проверьте URL.
                  </div>
                </div>
              )}
            </div>

            {/* Modules */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Модули курса
                </h3>
                <button
                  onClick={addModule}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Добавить модуль
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(formData.modules)
                  .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                  .map(([moduleId, module], moduleIndex, modulesArray) => (
                  <div
                    key={moduleId}
                    className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                  >
                    {/* Module Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <GripVertical className="w-5 h-5 text-gray-400 mt-2" />
                      <div className="flex-1 space-y-3">
                        <input
                          type="text"
                          value={module.title}
                          onChange={(e) => updateModule(moduleId, 'title', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg"
                          placeholder="Название модуля"
                        />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveModule(moduleId, 'up')}
                            disabled={moduleIndex === 0}
                            className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveModule(moduleId, 'down')}
                            disabled={moduleIndex === (modulesArray.length - 1)}
                            className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            ↓
                          </button>
                        </div>
                        <button
                          onClick={() => deleteModule(moduleId)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Lessons */}
                    <div className="ml-8 space-y-2">
                      <button
                        onClick={() => addLesson(moduleId)}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить урок
                      </button>

                      {module.lessons && Object.entries(module.lessons)
                        .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                        .map(([lessonId, lesson], lessonIndex, lessonsArray) => (
                        <div
                          key={lessonId}
                          className="bg-white dark:bg-gray-600 rounded-lg p-3 sm:p-4"
                        >
                          <div className="flex items-start gap-2">
                            <Youtube className="w-5 h-5 text-red-600 mt-2 flex-shrink-0" />
                            <div className="flex-1 space-y-3">
                              {/* Название урока */}
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLesson(moduleId, lessonId, 'title', e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm font-medium"
                                placeholder="📚 Название урока"
                              />
                              
                              {/* YouTube URL */}
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">🎥 Видео (YouTube)</label>
                                <input
                                  type="text"
                                  value={lesson.videoUrl || ''}
                                  onChange={(e) => updateLesson(moduleId, lessonId, 'videoUrl', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                  placeholder="https://youtube.com/watch?v=..."
                                />
                              </div>

                              {/* Длительность */}
                              <div className="space-y-1">
                                <label className="text-xs text-gray-600 dark:text-gray-400 font-medium">⏱️ Длительность</label>
                                <input
                                  type="number"
                                  value={lesson.duration || 0}
                                  onChange={(e) => updateLesson(moduleId, lessonId, 'duration', parseInt(e.target.value) || 0)}
                                  className="w-full sm:w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                  placeholder="Минут"
                                />
                              </div>

                              {/* Дополнительные материалы */}
                              <div className="pt-2 border-t border-gray-200 dark:border-gray-600 space-y-3">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">📎 Дополнительные материалы (опционально)</p>
                                
                                {/* Домашнее задание */}
                                <div className="space-y-1">
                                  <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    <span>Үй жұмысы / Домашнее задание (Google Drive)</span>
                                  </label>
                                  <input
                                    type="text"
                                    value={lesson.homeworkUrl || ''}
                                    onChange={(e) => updateLesson(moduleId, lessonId, 'homeworkUrl', e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                    placeholder="https://drive.google.com/file/d/.../view"
                                  />
                                </div>

                                {/* Формулалар / Формулы (несколько ссылок) */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                      <Calculator className="w-3 h-3" />
                                      <span>{t('courseDetail.formulasTitle')}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addFormulaLink(moduleId, lessonId)}
                                      className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 hover:bg-green-200"
                                    >
                                      + {t('courseEditor.addModule').split(' ')[0]}
                                    </button>
                                  </div>
                                  {(Array.isArray(lesson.formulaLinks) ? lesson.formulaLinks : (lesson.formulasUrl ? [lesson.formulasUrl] : [])).map((url, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <input
                                        type="text"
                                        value={url || ''}
                                        onChange={(e) => updateFormulaLink(moduleId, lessonId, idx, e.target.value)}
                                        className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                        placeholder="https://drive.google.com/file/d/.../view"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeFormulaLink(moduleId, lessonId, idx)}
                                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                      </button>
                                    </div>
                                  ))}
                                </div>

                                {/* Custom modules with custom names and colors */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <label className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                      <Palette className="w-3 h-3" />
                                      <span>{t('courseDetail.moduleAdd')}</span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addCustomModule(moduleId, lessonId)}
                                      className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200"
                                    >
                                      + {t('courseEditor.addModule').split(' ')[0]}
                                    </button>
                                  </div>
                                  {(Array.isArray(lesson.customModules) ? lesson.customModules : []).map((module, idx) => (
                                    <div key={module.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 space-y-2">
                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          value={module.name || ''}
                                          onChange={(e) => updateCustomModule(moduleId, lessonId, idx, 'name', e.target.value)}
                                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                          placeholder={t('courseDetail.moduleNamePlaceholder')}
                                        />
                                        <button
                                          type="button"
                                          onClick={() => deleteCustomModule(moduleId, lessonId, idx)}
                                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                      </div>
                                      <div className="flex gap-2">
                                        <select
                                          value={module.color || 'blue'}
                                          onChange={(e) => updateCustomModule(moduleId, lessonId, idx, 'color', e.target.value)}
                                          className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                        >
                                          {MODULE_COLORS.map(color => (
                                            <option key={color.name} value={color.name}>{color.label}</option>
                                          ))}
                                        </select>
                                        <input
                                          type="text"
                                          value={module.url || ''}
                                          onChange={(e) => updateCustomModule(moduleId, lessonId, idx, 'url', e.target.value)}
                                          className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                          placeholder={t('courseDetail.moduleUrlPlaceholder')}
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => moveLesson(moduleId, lessonId, 'up')}
                                  disabled={lessonIndex === 0}
                                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-500 hover:bg-gray-200 dark:hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveLesson(moduleId, lessonId, 'down')}
                                  disabled={lessonIndex === (lessonsArray.length - 1)}
                                  className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-500 hover:bg-gray-200 dark:hover:bg-gray-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  ↓
                                </button>
                              </div>
                              <button
                                onClick={() => deleteLesson(moduleId, lessonId)}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(formData.modules).length === 0 && (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      {t('courseEditor.noModules')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {saving ? 'Сохранение...' : 'Сохранить курс'}
              </button>
              <button
                onClick={onClose}
                className="px-6 btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
