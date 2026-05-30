import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import UncompletedTestModal from './UncompletedTestModal';
import { useUncompletedTest } from '../hooks/useUncompletedTest';
import { getCurrentUser } from '../firebase/auth';

export default function AppWrapper({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { uncompletedTest, loading, clearUncompletedTest } = useUncompletedTest();
  const [showModal, setShowModal] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    // Only show modal if user is authenticated and not already on test page
    if (user && uncompletedTest && !loading) {
      // Don't show modal if already on test page or auth pages
      const isOnTestPage = location.pathname.startsWith('/test');
      const authPages = ['/login', '/signup', '/forgot-password', '/verify-email', '/reset-password'];
      
      if (!isOnTestPage && !authPages.includes(location.pathname)) {
        setShowModal(true);
      }
    }
  }, [user, uncompletedTest, loading, location.pathname]);

  const handleContinueTest = () => {
    if (!uncompletedTest) return;

    setShowModal(false);

    const isComposed =
      uncompletedTest.hasComposed ||
      uncompletedTest.mode === 'full' ||
      uncompletedTest.mode === 'creative';

    if (isComposed) {
      // For composed (full/creative) tests, resume via /test-ubt with state
      navigate('/test-ubt', {
        state: {
          resumeTest: true,
          testId: uncompletedTest.testId,
          mode: uncompletedTest.mode || null,
          hasComposed: true,
          subjects: uncompletedTest.subjects || []
        }
      });
    } else {
      // For simple single tests, use direct URL with question index (1-based)
      const testUrl = `/test/${uncompletedTest.testId}/question/${uncompletedTest.currentQuestionIndex + 1}`;
      navigate(testUrl);
    }
  };

  const handleAbandonTest = () => {
    clearUncompletedTest();
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <>
      {children}
      {showModal && (
        <UncompletedTestModal
          uncompletedTest={uncompletedTest}
          onContinue={handleContinueTest}
          onAbandon={handleAbandonTest}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}
