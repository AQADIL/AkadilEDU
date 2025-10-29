import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { isUserAdmin } from '../firebase/realtimeDb';
import { Loader2 } from 'lucide-react';

/**
 * AdminGuard - Защита админских роутов
 * 
 * Проверяет:
 * 1. Пользователь авторизован
 * 2. Email = youtub.maj@gmail.com ИЛИ role = admin в Database
 */
export default function AdminGuard({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async (user) => {
      console.log('🔐 AdminGuard checking for user:', user?.email);
      
      if (!user) {
        console.log('❌ No user, denying access');
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Проверка 1: Email админа
      if (user.email === 'youtub.maj@gmail.com') {
        console.log('✅ Admin by email:', user.email);
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      // Проверка 2: Роль в базе данных
      try {
        console.log('🔍 Checking admin role in database...');
        const adminStatus = await isUserAdmin(user.uid);
        console.log('📊 Admin status:', adminStatus);
        setIsAdmin(adminStatus);
      } catch (error) {
        console.error('❌ Admin check error:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    // Listen to auth changes instead of checking once
    const unsubscribe = auth.onAuthStateChanged((user) => {
      checkAdmin(user);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Проверка доступа...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
