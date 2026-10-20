import i18n from '../i18n';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLoader from '../components/AppLoader';

export default function AuthAction() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    const apiKey = searchParams.get('apiKey');

    const queryString = `?mode=${mode}&oobCode=${oobCode}&apiKey=${apiKey}`;

    switch (mode) {
      case 'verifyEmail':
        navigate(`/verify-email${queryString}`, { replace: true });
        break;

      case 'resetPassword':
        navigate(`/reset-password${queryString}`, { replace: true });
        break;

      case 'recoverEmail':
        navigate(`/recover-email${queryString}`, { replace: true });
        break;

      default:
        navigate('/login', { replace: true });
    }
  }, [searchParams, navigate]);

  return <AppLoader text={i18n.t('ui.redirecting')} />;
}
