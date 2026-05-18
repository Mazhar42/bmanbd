const admin = require("firebase-admin");

let firebaseStorage = null;
let firebaseConfigured = false;

const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

let credential = null;

if (serviceAccountJson) {
  try {
    const parsed = JSON.parse(serviceAccountJson);
    credential = admin.credential.cert(parsed);
  } catch (_) {
    credential = null;
  }
} else if (projectId && clientEmail && privateKeyRaw) {
  credential = admin.credential.cert({
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  });
}

if (credential && storageBucket) {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential,
      storageBucket,
    });
  }

  firebaseStorage = admin.storage();
  firebaseConfigured = true;
}

module.exports = { firebaseStorage, firebaseConfigured };
