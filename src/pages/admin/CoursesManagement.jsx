import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { fetchAllCourses, deleteCourse } from '../../firebase/realtimeDb';
import { auth } from '../../firebase/config';
import CourseEditor from '../../components/admin/CourseEditor';

export default function CoursesManagement() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    loadCourses();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Управление Курсами
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Всего курсов: {courses.length}
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Создать курс
        </button>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <BookOpen className="w-8 h-8 text-primary-600" />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {course.description || 'Нет описания'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>
                  Модулей: {course.modules ? Object.keys(course.modules).length : 0}
                </span>
                <span>
                  {new Date(course.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Курсов пока нет. Создайте первый курс!
          </p>
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
