/**
 * FCM Setup Diagnostic Tool
 * Проверяет настройку Firebase Cloud Messaging
 */

const admin = require('firebase-admin');

// Load service account
let serviceAccount;
try {
  serviceAccount = require('./serviceAccountKey.json');
  console.log('✅ Service account loaded');
} catch (error) {
  console.error('❌ Failed to load serviceAccountKey.json');
  console.error('   Download it from: https://console.firebase.google.com/project/akadiledu/settings/serviceaccounts/adminsdk');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app"
});

console.log('✅ Firebase Admin initialized');
console.log(`📦 Project ID: ${serviceAccount.project_id}`);
console.log(`📧 Service Account: ${serviceAccount.client_email}\n`);

async function checkFCMSetup() {
  try {
    console.log('🔍 Checking FCM setup...\n');

    // 1. Check database connection
    console.log('1️⃣ Checking Realtime Database connection...');
    const dbRef = admin.database().ref('/');
    await dbRef.once('value');
    console.log('   ✅ Database connected\n');

    // 2. Check users with FCM tokens
    console.log('2️⃣ Checking users with FCM tokens...');
    const usersSnapshot = await admin.database().ref('/users').once('value');
    
    if (!usersSnapshot.exists()) {
      console.log('   ❌ No users found in database');
      console.log('   ℹ️  Users need to login and grant notification permission\n');
      return;
    }

    const users = [];
    const usersWithTokens = [];
    
    usersSnapshot.forEach((userSnap) => {
      const userData = userSnap.val();
      users.push({
        uid: userSnap.key,
        email: userData.email || 'no email',
        hasFcmToken: !!userData.fcmToken
      });
      
      if (userData.fcmToken) {
        usersWithTokens.push({
          uid: userSnap.key,
          email: userData.email,
          token: userData.fcmToken
        });
      }
    });

    console.log(`   📊 Total users: ${users.length}`);
    console.log(`   📱 Users with FCM tokens: ${usersWithTokens.length}\n`);

    if (users.length > 0) {
      console.log('   Users list:');
      users.forEach(user => {
        const status = user.hasFcmToken ? '✅' : '❌';
        console.log(`   ${status} ${user.email} (${user.uid.substring(0, 8)}...)`);
      });
      console.log('');
    }

    if (usersWithTokens.length === 0) {
      console.log('   ⚠️  No users with FCM tokens!');
      console.log('   📝 To fix:');
      console.log('      1. Open https://akadiledu.web.app');
      console.log('      2. Login with your account');
      console.log('      3. Allow notifications when prompted');
      console.log('      4. Check browser console for "✅ FCM token saved"');
      console.log('      5. Run this script again\n');
      return;
    }

    // 3. Test sending to first token
    console.log('3️⃣ Testing FCM send to first user...');
    const testUser = usersWithTokens[0];
    console.log(`   📤 Sending to: ${testUser.email}`);
    console.log(`   🔑 Token: ${testUser.token.substring(0, 50)}...\n`);

    const payload = {
      notification: {
        title: '🧪 Test Notification',
        body: 'FCM setup is working correctly!',
        icon: '/icons/icon-192.png'
      }
    };

    try {
      const response = await admin.messaging().sendToDevice(testUser.token, payload);
      
      console.log('   📊 Send results:');
      console.log(`      Success: ${response.successCount}`);
      console.log(`      Failure: ${response.failureCount}\n`);

      if (response.successCount > 0) {
        console.log('   ✅ FCM WORKING! Notification sent successfully!');
        console.log('   🎉 Check your device for the notification\n');
      }

      if (response.failureCount > 0) {
        console.log('   ❌ FCM send failed!');
        response.results.forEach((result, index) => {
          if (result.error) {
            console.log(`      Error: ${result.error.code}`);
            console.log(`      Message: ${result.error.message}\n`);

            if (result.error.code === 'messaging/invalid-registration-token' ||
                result.error.code === 'messaging/registration-token-not-registered') {
              console.log('   💡 Token is invalid. User needs to login again and grant permission.');
            } else if (result.error.message.includes('404')) {
              console.log('   ⚠️  ERROR 404: Cloud Messaging API not enabled!');
              console.log('   📝 To fix:');
              console.log('      1. Open: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu');
              console.log('      2. Click "ENABLE" button');
              console.log('      3. Wait 1-2 minutes');
              console.log('      4. Run this script again\n');
            }
          }
        });
      }

    } catch (sendError) {
      console.log('   ❌ FCM send error!');
      console.log(`      ${sendError.message}\n`);

      if (sendError.message.includes('404')) {
        console.log('   ⚠️  ERROR 404: Cloud Messaging API NOT ENABLED!');
        console.log('   📝 To fix:');
        console.log('      1. Open: https://console.cloud.google.com/apis/library/fcm.googleapis.com?project=akadiledu');
        console.log('      2. Click "ENABLE" button');
        console.log('      3. Wait 1-2 minutes');
        console.log('      4. Run this script again\n');
      }
    }

    // 4. Summary
    console.log('═══════════════════════════════════════');
    console.log('📋 SUMMARY');
    console.log('═══════════════════════════════════════');
    console.log(`Total users: ${users.length}`);
    console.log(`Users with FCM tokens: ${usersWithTokens.length}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Ensure Cloud Messaging API is enabled');
    console.log('2. Ensure users login and grant notification permission');
    console.log('3. Start backend: cd backend && npm start');
    console.log('4. Test from admin panel: https://akadiledu.web.app/admin');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
  } finally {
    process.exit(0);
  }
}

checkFCMSetup();
