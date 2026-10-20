import { useEffect, useRef, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase/realtimeDb';

export function useSessionValidator(user, localSessionId, onSessionInvalidated) {
  const [isValid, setIsValid] = useState(true);
  const callback = useRef(onSessionInvalidated);
  useEffect(() => {
    callback.current = onSessionInvalidated;
  }, [onSessionInvalidated]);

  useEffect(() => {
    setIsValid(true);
    if (!user || !localSessionId || !database) return;
    let active = true;
    let invalidated = false;
    let unsubscribe = () => {};
    user
      .getIdTokenResult()
      .then(({ claims }) => {
        if (!active || claims.admin === true) return;
        unsubscribe = onValue(ref(database, `users/${user.uid}`), (snapshot) => {
          const profile = snapshot.val();
          const session = profile?.sessions?.[localSessionId];
          const revoked = session?.revoked === true || session?.active === false;
          const replaced = profile?.currentSession && profile.currentSession !== localSessionId;
          if ((revoked || replaced) && !invalidated) {
            invalidated = true;
            setIsValid(false);
            callback.current?.();
          }
        });
      })
      .catch(() => {
        if (active) setIsValid(false);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [user, localSessionId]);

  return isValid;
}
