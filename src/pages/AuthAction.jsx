import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Firebase Auth Action Handler
 * 
 * This component handles all Firebase Authentication action links:
 * - verifyEmail: Email verification
 * - resetPassword: Password reset
 * - recoverEmail: Email recovery
 * 
 * Firebase sends users to: https://your-domain.com/__/auth/action?mode=xxx&oobCode=xxx
 */
export default function AuthAction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const apiKey = searchParams.get('apiKey');

    // Build query string to preserve all parameters
    const queryString = `?mode=${mode}&oobCode=${oobCode}&apiKey=${apiKey}`;

    // Route to appropriate page based on mode
    switch (mode) {
      case 'verifyEmail':
        navigate(`/verify-email${queryString}`, { replace: true });
        break;
      
      case 'resetPassword':
        navigate(`/reset-password${queryString}`, { replace: true });
        break;
      
      case 'recoverEmail':
        // Optional: handle email recovery
        navigate(`/recover-email${queryString}`, { replace: true });
        break;
      
      default:
        // Unknown mode or missing parameters
        console.error('Invalid auth action:', { mode, oobCode });
        navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
        <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 animate-spin mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Бағыттауда...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Күте тұрыңыз
        </p>
      </div>
    </div>
  );
}
