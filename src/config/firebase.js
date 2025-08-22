const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
require('dotenv').config();

let serviceAccount = null;

// Option A: JSON file path
if (process.env.SERVICE_ACCOUNT_PATH) {
  const abs = path.resolve(process.env.SERVICE_ACCOUNT_PATH);
  serviceAccount = JSON.parse(fs.readFileSync(abs, 'utf8'));
}

// Option B: Base64 in env
if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
}

if (!serviceAccount) {
  console.error('Firebase service account not configured. Set SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_BASE64.');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('Firebase Admin initialized.');
}

const db = admin.firestore();
module.exports = { admin, db };