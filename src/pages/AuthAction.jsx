import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLoader from '../components/AppLoader';

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
    <AppLoader text="Бағыттауда..." />
  );
}
