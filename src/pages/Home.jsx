import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookOpen, TrendingUp, Award, Users } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle Firebase auth action links that come to root URL
  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    // If this is a Firebase auth action link, redirect to auth action handler
    if (mode && oobCode) {
      const queryString = searchParams.toString();
      navigate(`/__/auth/action?${queryString}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const featuredCourses = [
    { id: 1, title: 'Mathematics Advanced', students: 234, rating: 4.8 },
    { id: 2, title: 'Physics Fundamentals', students: 189, rating: 4.9 },
    { id: 3, title: 'Chemistry Basics', students: 156, rating: 4.7 },
    { id: 4, title: 'Biology Introduction', students: 201, rating: 4.6 },
  ];

  const stats = [
    { icon: BookOpen, label: 'Courses', value: '50+' },
    { icon: Users, label: 'Students', value: '1,200+' },
    { icon: Award, label: 'Certificates', value: '800+' },
    { icon: TrendingUp, label: 'Success Rate', value: '94%' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-8 sm:p-12 text-white">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {t('home.welcome')}
          </h1>
          <p className="text-lg sm:text-xl opacity-90 mb-6">
            {t('home.subtitle')}
          </p>
          <button className="px-6 py-3 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            {t('home.getStarted')}
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <Icon className="w-8 h-8 text-primary-500 mb-3" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          );
        })}
      </section>

      {/* Featured Courses */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('home.featuredCourses')}
        </h2>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCourses.map((course) => (
            <div key={course.id} className="card p-0 overflow-hidden group cursor-pointer">
              <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-white opacity-80 group-hover:scale-110 transition-transform" />
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h3>
                
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.students}
                  </div>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {course.rating}
                  </div>
                </div>
                
                <div className="mt-3 text-sm text-gray-500 dark:text-gray-500 italic">
                  {t('home.coursePlaceholder')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Boxes */}
      <section className="grid md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Quality Content
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Learn from expertly crafted courses designed for maximum learning efficiency.
          </p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Track Progress
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor your learning journey with detailed analytics and progress tracking.
          </p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-4">
            <Award className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Earn Certificates
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get recognized for your achievements with official course certificates.
          </p>
        </div>
      </section>
    </div>
  );
}
