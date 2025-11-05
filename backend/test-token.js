// Test single FCM token
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app"
});

// Вставьте ваш FCM токен сюда:
const TEST_TOKEN = 'cGFYLhllE_OeGtkHpGsoqm:APA91bGtHAHYW5FqMhyuVjO6NxBFZw_4OYpQ3JnRjTZ7iF6KOFtO4bU5zghqCN7oS5Z0u8X_4lCLRN0JYdPc6jCwvQnPvQ7nO3tVsO9KqHJMXPZoJ3YhJ0W9lZkuGHnJKhcPJ9yZHEw';

const message = {
  notification: {
    title: 'Тест',
    body: 'Проверка одного токена'
  },
  token: TEST_TOKEN
};

console.log('📱 Отправка тестового push...');

admin.messaging().send(message)
  .then((response) => {
    console.log('✅ Успешно отправлено:', response);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ошибка отправки:');
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('\n⚠️ Токен невалиден или истек. Получите новый токен.');
    } else if (error.code === 'messaging/invalid-registration-token') {
      console.log('\n⚠️ Токен имеет неправильный формат.');
    } else if (error.message.includes('404')) {
      console.log('\n⚠️ Cloud Messaging API не включен!');
      console.log('Откройте: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu');
      console.log('Нажмите ENABLE');
    }
    
    process.exit(1);
  });
