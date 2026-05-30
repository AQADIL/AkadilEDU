
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ВНИМАНИЕ: Замените путь на свой Service Account Key JSON файл!
// Скачайте его из: Firebase Console → Project Settings → Service Accounts → Generate new private key
const serviceAccountPath = join(__dirname, 'serviceAccountKey.json');

// Инициализация Firebase Admin
try {
  const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app"
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin');
  console.error('📝 Instructions:');
  console.error('   1. Go to: https://console.firebase.google.com/');
  console.error('   2. Select your project: akadiledu');
  console.error('   3. Project Settings → Service Accounts');
  console.error('   4. Click "Generate new private key"');
  console.error('   5. Save as: scripts/serviceAccountKey.json');
  console.error('');
  console.error('Error:', error.message);
  process.exit(1);
}

const db = admin.database();
const auth = admin.auth();

/**
 * Создать профиль пользователя в Realtime DB
 */
async function createUserProfile(user) {
  const userRef = db.ref(`users/${user.uid}`);
  
  // Проверяем, существует ли уже профиль
  const snapshot = await userRef.once('value');
  if (snapshot.exists()) {
    console.log(`   ⏭️  Profile already exists: ${user.email}`);
    return { skipped: true, user: snapshot.val() };
  }
  
  // Создаём новый профиль
  const userData = {
    uid: user.uid,
    email: user.email,
    name: user.displayName || user.email.split('@')[0],
    phone: user.phoneNumber || '',
    role: 'student', // По умолчанию все студенты
    status: user.disabled ? 'inactive' : 'active',
    registeredAt: user.metadata.creationTime,
    lastLogin: user.metadata.lastSignInTime || user.metadata.creationTime,
    emailVerified: user.emailVerified,
    ipHistory: {},
    sessions: {},
    purchasedCourses: {},
    isDeleted: false
  };
  
  await userRef.set(userData);
  console.log(`   ✅ Created profile: ${user.email} (${user.uid})`);
  
  return { created: true, user: userData };
}

/**
 * Логирование миграции
 */
async function logMigration(stats) {
  const migrationLogRef = db.ref('migrationLogs').push();
  
  await migrationLogRef.set({
    timestamp: new Date().toISOString(),
    type: 'auth_to_rtdb_migration',
    stats: stats,
    performedBy: 'migration_script'
  });
  
  console.log('📊 Migration log saved');
}

/**
 * ГЛАВНАЯ ФУНКЦИЯ МИГРАЦИИ
 */
async function migrateUsers() {
  console.log('🚀 Starting migration...\n');
  
  const stats = {
    total: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date().toISOString()
  };
  
  try {
    // Получаем всех пользователей (по 1000 за раз)
    let pageToken;
    let allUsers = [];
    
    do {
      const listUsersResult = await auth.listUsers(1000, pageToken);
      allUsers = allUsers.concat(listUsersResult.users);
      pageToken = listUsersResult.pageToken;
    } while (pageToken);
    
    stats.total = allUsers.length;
    console.log(`📋 Found ${stats.total} users in Firebase Authentication\n`);
    
    // Обрабатываем каждого пользователя
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      console.log(`[${i + 1}/${allUsers.length}] Processing: ${user.email}`);
      
      try {
        const result = await createUserProfile(user);
        
        if (result.created) {
          stats.created++;
        } else if (result.skipped) {
          stats.skipped++;
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
        stats.errors++;
      }
      
      // Небольшая задержка, чтобы не перегружать базу
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    stats.endTime = new Date().toISOString();
    
    // Сохраняем лог миграции
    await logMigration(stats);
    
    // Итоги
    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`📊 Total users:     ${stats.total}`);
    console.log(`✅ Created:         ${stats.created}`);
    console.log(`⏭️  Skipped:         ${stats.skipped}`);
    console.log(`❌ Errors:          ${stats.errors}`);
    console.log(`⏱️  Duration:        ${new Date(stats.endTime) - new Date(stats.startTime)}ms`);
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED!');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    process.exit(1);
  }
}

// Запускаем миграцию
migrateUsers();
