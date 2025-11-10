/**
 * Database Cleanup Script
 * Удаляет старые логи, сессии, IP history и другой мусор из Firebase
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: ' https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app'
});

const db = admin.database();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // 1. Удаляем все сессии пользователей
    console.log('📝 Cleaning up user sessions...');
    const usersRef = db.ref('users');
    const usersSnapshot = await usersRef.once('value');
    const users = usersSnapshot.val();

    if (users) {
      let sessionCount = 0;
      let ipHistoryCount = 0;
      let securityAlertCount = 0;

      for (const [uid, userData] of Object.entries(users)) {
        const updates = {};

        // Удаляем sessions
        if (userData.sessions) {
          updates[`users/${uid}/sessions`] = null;
          sessionCount += Object.keys(userData.sessions).length;
        }

        // Удаляем ipHistory
        if (userData.ipHistory) {
          updates[`users/${uid}/ipHistory`] = null;
          ipHistoryCount += Object.keys(userData.ipHistory).length;
        }

        // Удаляем securityAlerts
        if (userData.securityAlerts) {
          updates[`users/${uid}/securityAlerts`] = null;
          securityAlertCount += Object.keys(userData.securityAlerts).length;
        }

        // Удаляем lastIP (оставляем только lastLogin)
        if (userData.lastIP) {
          updates[`users/${uid}/lastIP`] = null;
        }

        // Удаляем securityStatus
        if (userData.securityStatus) {
          updates[`users/${uid}/securityStatus`] = null;
        }

        if (Object.keys(updates).length > 0) {
          await db.ref().update(updates);
        }
      }

      console.log(`  ✅ Deleted ${sessionCount} sessions`);
      console.log(`  ✅ Deleted ${ipHistoryCount} IP history entries`);
      console.log(`  ✅ Deleted ${securityAlertCount} security alerts`);
    }

    // 2. Удаляем старые adminLogs (оставляем последние 100)
    console.log('\n📝 Cleaning up admin logs...');
    const adminLogsRef = db.ref('adminLogs');
    const logsSnapshot = await adminLogsRef.once('value');
    const logs = logsSnapshot.val();

    if (logs) {
      const logEntries = Object.entries(logs);
      const sortedLogs = logEntries.sort((a, b) => {
        const tsA = new Date(a[1].ts).getTime();
        const tsB = new Date(b[1].ts).getTime();
        return tsB - tsA; // Новые первые
      });

      // Удаляем все кроме последних 100
      if (sortedLogs.length > 100) {
        const logsToDelete = sortedLogs.slice(100);
        const updates = {};

        logsToDelete.forEach(([logId]) => {
          updates[`adminLogs/${logId}`] = null;
        });

        await db.ref().update(updates);
        console.log(`  ✅ Deleted ${logsToDelete.length} old admin logs (kept last 100)`);
      } else {
        console.log(`  ℹ️ Only ${sortedLogs.length} admin logs found, nothing to delete`);
      }
    }

    // 3. Удаляем глобальные security alerts
    console.log('\n📝 Cleaning up global security alerts...');
    const globalAlertsRef = db.ref('securityAlerts');
    const globalAlertsSnapshot = await globalAlertsRef.once('value');
    
    if (globalAlertsSnapshot.exists()) {
      await globalAlertsRef.remove();
      console.log('  ✅ Deleted all global security alerts');
    } else {
      console.log('  ℹ️ No global security alerts found');
    }

    console.log('\n✅ Database cleanup completed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - User sessions: cleaned');
    console.log('  - IP history: cleaned');
    console.log('  - Security alerts: cleaned');
    console.log('  - Admin logs: kept last 100');
    console.log('  - lastIP fields: removed');
    console.log('  - securityStatus fields: removed');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  }
}

// Run cleanup
cleanupDatabase()
  .then(() => {
    console.log('\n🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
