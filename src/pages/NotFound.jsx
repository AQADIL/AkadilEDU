import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Home } from 'lucide-react';

export default function NotFound() {
  const [rotation, setRotation] = useState(-45);

  useEffect(() => {
    const updateRotation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const ratio = 45 / (width / height);
      setRotation(-ratio);
    };

    updateRotation();
    window.addEventListener('resize', updateRotation);
    return () => window.removeEventListener('resize', updateRotation);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] dark:bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 overflow-hidden relative">
      {/* Home Button */}
      <Link
        to="/"
        className="fixed z-50 top-6 left-6 sm:top-8 sm:left-8 border-2 border-[#444] px-4 py-2 sm:px-6 sm:py-3 text-[#777] hover:text-[#1a1a1a] hover:bg-[#e0e0e0] hover:border-transparent transition-all duration-200 flex items-center gap-2 text-sm sm:text-base font-semibold group"
      >
        <svg 
          height="0.8em" 
          width="0.8em" 
          viewBox="0 0 2 1" 
          preserveAspectRatio="none"
          className="transition-all duration-200"
        >
          <polyline
            fill="none" 
            stroke="currentColor"
            className="group-hover:stroke-[#000]"
            strokeWidth="0.1" 
            points="0.9,0.1 0.1,0.5 0.9,0.9" 
          />
        </svg>
        Home
      </Link>

      {/* Giant 404 Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <h1 
          className="text-[#1a1a1a] dark:text-[#1a1a1a] transition-all duration-700 ease-in-out"
          style={{
            fontSize: 'clamp(200px, 60vmax, 800px)',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            fontFamily: 'Eczar, serif',
            fontWeight: 800,
            letterSpacing: '0.025em',
            position: 'absolute',
            top: '50%',
            left: '50%',
            margin: 0,
            lineHeight: 1
          }}
        >
          404
        </h1>
      </div>

      {/* Message */}
      <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-10 max-w-[90%] sm:max-w-[70%] md:max-w-[50%] lg:max-w-[30%] xl:max-w-[25%]">
        <p 
          className="text-[#e0e0e0] dark:text-[#e0e0e0] text-right m-0 leading-relaxed"
          style={{
            fontSize: 'clamp(16px, calc(1em + 3vmin), 32px)',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            textShadow: `-1px -1px 0 #0a0a0a, 1px 1px 0 #0a0a0a, -1px 1px 0 #0a0a0a, 1px -1px 0 #0a0a0a`
          }}
        >
          The page you're looking for does not exist.
        </p>
      </div>

      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-blue-500/5 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Google Fonts Import */}
      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Eczar:wght@800&family=Poppins:wght@600&display=swap');
      `}</style>
    </div>
  );
}
