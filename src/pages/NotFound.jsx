import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, ArrowLeft, Ghost } from 'lucide-react';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Ghosts */}
        <div className="absolute top-20 left-10 animate-float">
          <Ghost className="w-16 h-16 text-white/20" />
        </div>
        <div className="absolute top-40 right-20 animate-float delay-1000">
          <Ghost className="w-12 h-12 text-white/20" />
        </div>
        <div className="absolute bottom-20 left-1/4 animate-float delay-2000">
          <Ghost className="w-20 h-20 text-white/20" />
        </div>

        {/* Floating Circles */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        {/* Animated 404 */}
        <div className="mb-8">
          <h1 className="text-[200px] md:text-[300px] font-black text-white/90 leading-none animate-bounce-slow">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="animate-spin-slow">
              <Search className="w-32 h-32 text-white/30" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl max-w-2xl mx-auto mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 animate-fade-in">
            {t('notFound.oops')} 🙈
          </h2>
          <p className="text-xl text-white/90 mb-2 animate-fade-in delay-200">
            {t('notFound.pageNotFound')}
          </p>
          <p className="text-lg text-white/70 animate-fade-in delay-300">
            {t('notFound.message')}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in delay-500">
          <Link
            to="/"
            className="group px-8 py-4 bg-white hover:bg-gray-100 text-purple-600 font-bold rounded-full shadow-lg transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <Home className="w-5 h-5 group-hover:animate-bounce" />
            {t('notFound.goHome')}
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="group px-8 py-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold rounded-full border-2 border-white/50 transform hover:scale-105 transition-all flex items-center gap-3"
          >
            <ArrowLeft className="w-5 h-5 group-hover:animate-pulse" />
            {t('notFound.goBack')}
          </button>
        </div>

        {/* Fun Facts */}
        <div className="mt-12 animate-fade-in delay-700">
          <p className="text-white/60 text-sm mb-2">
            {t('notFound.funFact')}
          </p>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto border border-white/10">
            <p className="text-white/80 text-sm italic">
              {t('notFound.fact')}
            </p>
          </div>
        </div>

        {/* Easter Egg - Rotating Elements */}
        <div className="mt-8 flex justify-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-lg animate-spin-reverse backdrop-blur-sm"></div>
          <div className="w-16 h-16 bg-white/20 rounded-full animate-bounce backdrop-blur-sm"></div>
          <div className="w-16 h-16 bg-white/20 rounded-lg animate-spin backdrop-blur-sm"></div>
        </div>
      </div>

      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-30px); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
        .delay-700 {
          animation-delay: 0.7s;
        }
      `}</style>
    </div>
  );
}
