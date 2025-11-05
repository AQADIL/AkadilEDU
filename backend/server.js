const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Load service account from file or environment variable
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // For Vercel/cloud deployment
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // For local development
  serviceAccount = require('./serviceAccountKey.json');
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://akadiledu-default-rtdb.europe-west1.firebasedatabase.app"
});

const app = express();
app.use(cors());
app.use(express.json());

// Send push to all users
app.post('/api/send-push-to-all', async (req, res) => {
  try {
    const { title, message, adminUid } = req.body;

    if (!title || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and message are required' 
      });
    }

    console.log(`📱 Sending push: "${title}"`);

    // Get all users with FCM tokens
    const usersSnapshot = await admin.database().ref('/users').once('value');
    
    if (!usersSnapshot.exists()) {
      return res.status(404).json({ 
        success: false, 
        message: 'No users found' 
      });
    }

    const tokens = [];
    const userEmails = [];

    usersSnapshot.forEach((userSnap) => {
      const userData = userSnap.val();
      if (userData.fcmToken) {
        tokens.push(userData.fcmToken);
        userEmails.push(userData.email);
      }
    });

    if (tokens.length === 0) {
      return res.json({
        success: false,
        message: 'Нет пользователей с FCM токенами. Войдите в приложение и разрешите уведомления.',
        successCount: 0,
        failureCount: 0
      });
    }

    console.log(`📤 Sending to ${tokens.length} users:`, userEmails);

    // Send push notifications
    const payload = {
      notification: {
        title: title,
        body: message,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png'
      }
    };

    let response;
    try {
      response = await admin.messaging().sendToDevice(tokens, payload);
      console.log(`✅ Success: ${response.successCount}, Failed: ${response.failureCount}`);
      
      // Remove invalid tokens
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.results.forEach((result, index) => {
          if (result.error) {
            console.log(`❌ Invalid token ${index}:`, result.error.code);
            invalidTokens.push(tokens[index]);
          }
        });
        
        // TODO: Clean up invalid tokens from database
        console.log(`🗑️ Found ${invalidTokens.length} invalid tokens`);
      }
    } catch (sendError) {
      console.error('❌ FCM send error:', sendError);
      throw new Error(`FCM отправка не удалась: ${sendError.message}`);
    }

    // Log to database
    if (adminUid) {
      await admin.database().ref('/adminLogs').push({
        adminUid: adminUid,
        action: 'sendPushToAll',
        payload: { title, message, recipientCount: tokens.length },
        results: {
          success: response.successCount,
          failure: response.failureCount
        },
        ts: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Отправлено ${response.successCount} из ${tokens.length} пользователей`,
      successCount: response.successCount,
      failureCount: response.failureCount,
      totalUsers: tokens.length
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false, 
      message: `Ошибка: ${error.message}` 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📱 Push notification endpoint: http://localhost:${PORT}/api/send-push-to-all`);
});
