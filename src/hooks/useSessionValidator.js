/**
 * Real-time Session Validator Hook
 * 
 * Проверяет каждую секунду: не выкинули ли пользователя
 * Если currentSession изменился → logout + показать modal
 */

import { useEffect, useState } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../firebase/realtimeDb';

export function useSessionValidator(user, localSessionId, onSessionInvalidated) {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!user || !localSessionId || !database) {
      return;
    }

    // 👑 ADMINS = GODS - Skip session validation for admins
    const checkAdminStatus = async () => {
      try {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
          const userData = snapshot.val();
          if (userData.role === 'admin') {
            console.log('👑 Admin detected - skipping session validation');
            return true; // Admin - no validation needed
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
      return false;
    };

    checkAdminStatus().then(isAdmin => {
      if (isAdmin) {
        return; // Don't set up validation for admins
      }

      // Continue with normal validation for non-admins
      // Слушаем изменения currentSession в реальном времени
      const userRef = ref(database, `users/${user.uid}`);
      
      const unsubscribe = onValue(userRef, (snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const currentSession = userData.currentSession;

          // Проверка: совпадает ли текущая сессия в DB с локальной
          if (currentSession && currentSession !== localSessionId) {
            console.warn('🚨 SESSION INVALIDATED: Someone else logged in!');
            console.log('DB session:', currentSession);
            console.log('Local session:', localSessionId);
            
            setIsValid(false);
            
            // Вызвать callback (logout + показать modal)
            if (onSessionInvalidated) {
              onSessionInvalidated();
            }
          } else {
            setIsValid(true);
          }
        }
      });

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    });
  }, [user, localSessionId, onSessionInvalidated]);

  return isValid;
}
