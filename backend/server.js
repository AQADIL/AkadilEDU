const admin = require('firebase-admin');
const { createApp } = require('./app');
if (!process.env.FIREBASE_DATABASE_URL || !process.env.ALLOWED_ORIGINS) {
  throw new Error('FIREBASE_DATABASE_URL and ALLOWED_ORIGINS are required');
}
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});
const app = createApp(
  admin,
  process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()),
);
module.exports = app;
if (require.main === module) {
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('A valid PORT is required');
  app.listen(port, process.env.HOST);
}
