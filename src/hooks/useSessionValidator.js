/**
 * Real-time Session Validator Hook
 * 
 * Проверяет каждую секунду: не выкинули ли пользователя
 * Если currentSession изменился → logout + показать modal
 */

import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/realtimeDb';

export function useSessionValidator(user, localSessionId, onSessionInvalidated) {
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!user || !localSessionId || !database) return;

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

    return () => unsubscribe();
  }, [user, localSessionId, onSessionInvalidated]);

  return isValid;
}
