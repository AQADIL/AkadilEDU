import { useState, useEffect } from 'react';
import { X, Calendar, BookOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { assignCourseToUser, fetchAllCourses, getUserCourses } from '../../firebase/realtimeDb';
import { auth } from '../../firebase/config';

export default function AssignCourseModal({ user, isOpen, onClose, onSuccess }) {
  const [courses, setCourses] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCourses, enrolled] = await Promise.all([
        fetchAllCourses(),
        getUserCourses(user.uid)
      ]);
      
      setCourses(allCourses);
      setUserCourses(enrolled);
    } catch (error) {
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse) {
      alert('Выберите курс');
      return;
    }

    setAssigning(true);
    try {
      const expiryTimestamp = expiryDate ? new Date(expiryDate).getTime() : null;
      await assignCourseToUser(user.uid, selectedCourse, expiryTimestamp, auth.currentUser.uid);
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Ошибка при назначении курса');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen) return null;

  const isEnrolled = (courseId) => userCourses.some(c => c.id === courseId);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-primary-600" />
              Выдать курс
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {user?.firstName} {user?.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : (
            <>
              {/* Course Selection */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  📚 Выберите курс
                </label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                >
                  <option value="">-- Выберите курс --</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id} disabled={isEnrolled(course.id)}>
                      {course.title} {isEnrolled(course.id) ? '✅ Уже назначен' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expiry Date */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Дата окончания доступа (опционально)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-base"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Если не указать - доступ будет постоянным
                </p>
              </div>

              {/* Currently Enrolled Courses */}
              {userCourses.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    ✅ Назначенные курсы
                  </h3>
                  <div className="space-y-2">
                    {userCourses.map((course) => {
                      const isExpired = course.enrollment?.expiryDate && course.enrollment.expiryDate < Date.now();
                      const expiryDateStr = course.enrollment?.expiryDate 
                        ? new Date(course.enrollment.expiryDate).toLocaleDateString('ru-RU')
                        : 'Постоянно';

                      return (
                        <div
                          key={course.id}
                          className={`p-4 rounded-xl border-2 ${
                            isExpired 
                              ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">
                                {course.title}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                <span>
                                  <Calendar className="w-3 h-3 inline mr-1" />
                                  {expiryDateStr}
                                </span>
                                {isExpired && (
                                  <span className="text-red-600 dark:text-red-400 font-medium">
                                    ⚠️ Истёк
                                  </span>
                                )}
                              </div>
                            </div>
                            <CheckCircle2 className={`w-5 h-5 flex-shrink-0 ${
                              isExpired ? 'text-red-600' : 'text-green-600'
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
          <button
            onClick={onClose}
            disabled={assigning}
            className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Отмена
          </button>
          <button
            onClick={handleAssign}
            disabled={assigning || !selectedCourse}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {assigning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Назначаем...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Выдать курс
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
