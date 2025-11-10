import { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Youtube, GripVertical } from 'lucide-react';
import { createCourse, updateCourse } from '../../firebase/realtimeDb';
import { auth } from '../../firebase/config';

export default function CourseEditor({ course, isOpen, onClose }) {
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
              duration: 0
            }
          }
        }
      }
    });
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
              {course ? 'Редактировать курс' : 'Создать новый курс'}
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
                Название курса *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Введите название курса"
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
                {Object.entries(formData.modules).map(([moduleId, module]) => (
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
                      <button
                        onClick={() => deleteModule(moduleId)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
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

                      {module.lessons && Object.entries(module.lessons).map(([lessonId, lesson]) => (
                        <div
                          key={lessonId}
                          className="bg-white dark:bg-gray-600 rounded-lg p-3"
                        >
                          <div className="flex items-start gap-2">
                            <Youtube className="w-5 h-5 text-red-600 mt-2 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <input
                                type="text"
                                value={lesson.title}
                                onChange={(e) => updateLesson(moduleId, lessonId, 'title', e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                placeholder="Название урока"
                              />
                              <input
                                type="text"
                                value={lesson.videoUrl}
                                onChange={(e) => updateLesson(moduleId, lessonId, 'videoUrl', e.target.value)}
                                className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                placeholder="YouTube URL или ID видео"
                              />
                              <input
                                type="number"
                                value={lesson.duration}
                                onChange={(e) => updateLesson(moduleId, lessonId, 'duration', parseInt(e.target.value) || 0)}
                                className="w-32 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                placeholder="Минут"
                              />
                            </div>
                            <button
                              onClick={() => deleteLesson(moduleId, lessonId)}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {Object.keys(formData.modules).length === 0 && (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-gray-500 dark:text-gray-400">
                      Нет модулей. Добавьте первый модуль!
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
