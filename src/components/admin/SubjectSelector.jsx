import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookOpen, Calculator, FileText, Users, Globe, FlaskConical } from 'lucide-react';

const subjects = [
  { id: 'math_literacy', nameKey: 'test.subjects.math_literacy', icon: Calculator },
  { id: 'kazakh_lang', nameKey: 'test.subjects.kazakh_lang', icon: BookOpen },
  { id: 'russian_lang', nameKey: 'test.subjects.russian_lang', icon: FileText },
  { id: 'english_lang', nameKey: 'test.subjects.english_lang', icon: Globe },
  { id: 'history_kz', nameKey: 'test.subjects.history_kz', icon: Users },
  { id: 'physics', nameKey: 'test.subjects.physics', icon: FlaskConical },
  { id: 'chemistry', nameKey: 'test.subjects.chemistry', icon: FlaskConical },
  { id: 'biology', nameKey: 'test.subjects.biology', icon: FlaskConical },
  { id: 'geography', nameKey: 'test.subjects.geography', icon: Globe },
  { id: 'profile1', nameKey: 'test.subjects.profile1', icon: BookOpen },
  { id: 'profile2', nameKey: 'test.subjects.profile2', icon: BookOpen }
];

export default function SubjectSelector({ onSubjectSelect, onBack }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Выберите предмет
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Для управления вариантами тестов выберите предмет
            </p>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {subjects.map((subject) => {
          const IconComponent = subject.icon;
          return (
            <button
              key={subject.id}
              onClick={() => onSubjectSelect(subject.id)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-200 hover:shadow-xl group"
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <IconComponent className="h-6 w-6 text-blue-600 dark:text-blue-400 group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-center">
                  {t(subject.nameKey)}
                </h3>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
