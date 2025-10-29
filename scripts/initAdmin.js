/**
 * Initialize Admin User in Realtime Database
 * 
 * Usage:
 * 1. Get your UID from Firebase Console → Authentication
 * 2. Run: node scripts/initAdmin.js YOUR_UID_HERE
 */

const https = require('https');

// Firebase config
const PROJECT_ID = 'akadiledu'; // Замени на свой project ID
const DATABASE_URL = `https://${PROJECT_ID}-default-rtdb.firebaseio.com`;

// Get UID from command line
const uid = process.argv[2];

if (!uid) {
  console.error('❌ Ошибка: Укажи UID пользователя');
  console.log('');
  console.log('Использование:');
  console.log('  node scripts/initAdmin.js YOUR_UID_HERE');
  console.log('');
  console.log('Где взять UID:');
  console.log('  Firebase Console → Authentication → Users → скопируй UID');
  process.exit(1);
}

// Admin user data
const adminData = {
  uid: uid,
  name: 'Admin',
  email: 'youtub.maj@gmail.com',
  phone: '',
  role: 'admin',
  status: 'active',
  registeredAt: new Date().toISOString(),
  lastLogin: new Date().toISOString(),
  ipHistory: {},
  sessions: {},
  purchasedCourses: {},
  isDeleted: false
};

// Create admin profile
console.log('🔥 Создание админ профиля...');
console.log('UID:', uid);
console.log('Email:', adminData.email);
console.log('');

const data = JSON.stringify(adminData);
const url = `${DATABASE_URL}/users/${uid}.json`;

const options = {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(url, options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Админ профиль создан успешно!');
      console.log('');
      console.log('Теперь:');
      console.log('1. Перейди на сайт');
      console.log('2. Войди с youtub.maj@gmail.com');
      console.log('3. Обнови страницу (F5)');
      console.log('4. Должен увидеть админ меню в sidebar');
      console.log('');
    } else {
      console.error('❌ Ошибка:', res.statusCode);
      console.error('Response:', responseData);
      console.log('');
      console.log('Возможные причины:');
      console.log('1. Неправильный PROJECT_ID в скрипте');
      console.log('2. Realtime Database не создана');
      console.log('3. Security Rules блокируют запись');
      console.log('');
      console.log('Решение:');
      console.log('Открой Firebase Console → Realtime Database');
      console.log('Временно поставь Test Mode в Rules');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Ошибка запроса:', error.message);
  console.log('');
  console.log('Проверь:');
  console.log('1. Интернет соединение');
  console.log('2. PROJECT_ID правильный');
  console.log('3. Realtime Database создана в Firebase');
});

req.write(data);
req.end();
