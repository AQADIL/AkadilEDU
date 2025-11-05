import { useState } from 'react';
import { Bell } from 'lucide-react';
import { requestNotificationPermission } from '../../firebase/messaging';
import { auth } from '../../firebase/config';

export default function TestPushButton() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const handleTestNotifications = async () => {
    setTesting(true);
    setResult(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setResult({ success: false, message: 'Войдите в аккаунт' });
        return;
      }

      console.log('🧪 Testing push notifications...');
      
      // Check if notifications are supported
      if (!('Notification' in window)) {
        setResult({ 
          success: false, 
          message: 'Браузер не поддерживает уведомления' 
        });
        return;
      }

      // Request permission and get token
      const token = await requestNotificationPermission(user.uid);
      
      if (token) {
        setResult({ 
          success: true, 
          message: `✅ FCM Token получен и сохранен!\n${token.substring(0, 50)}...` 
        });
      } else {
        setResult({ 
          success: false, 
          message: 'Не удалось получить FCM token. Проверьте консоль браузера.' 
        });
      }
    } catch (error) {
      console.error('Test error:', error);
      setResult({ 
        success: false, 
        message: `Ошибка: ${error.message}` 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Bell className="w-5 h-5" />
        🧪 Тест Push Уведомлений
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Проверьте что ваш браузер получает FCM токен и сохраняет его в базу данных.
      </p>
      
      <button
        onClick={handleTestNotifications}
        disabled={testing}
        className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {testing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Тестирование...
          </>
        ) : (
          <>
            <Bell className="w-5 h-5" />
            Запросить Разрешение на Уведомления
          </>
        )}
      </button>
      
      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
        }`}>
          <p className="text-sm whitespace-pre-wrap font-mono">
            {result.message}
          </p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p>💡 Если не работает:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Проверьте что Service Worker зарегистрирован (консоль)</li>
          <li>Разрешите уведомления в настройках браузера</li>
          <li>Перезагрузите страницу после разрешения</li>
        </ul>
      </div>
    </div>
  );
}
