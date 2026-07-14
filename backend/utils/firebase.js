const admin = require('firebase-admin');

let db = null;
let auth = null;

const sanitizeEnvValue = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  // Vercel env values are sometimes pasted with wrapping quotes.
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
};

const normalizePrivateKey = (value) => {
  const sanitized = sanitizeEnvValue(value);
  if (typeof sanitized !== 'string') return sanitized;
  return sanitized.replace(/\\n/g, '\n');
};

// Initialize Firebase Admin SDK
try {
  const projectId = sanitizeEnvValue(process.env.FIREBASE_PROJECT_ID);
  const clientEmail = sanitizeEnvValue(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  const missingVars = [];
  if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');

  if (missingVars.length > 0) {
    throw new Error(`Missing Firebase env vars: ${missingVars.join(', ')}`);
  }

  const serviceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  db = admin.firestore();
  auth = admin.auth();
  console.log('Firebase initialized successfully');
} catch (error) {
  console.warn('Firebase initialization failed:', error.message);
  console.warn('Please configure valid Firebase credentials in environment variables');
  console.warn('The server will start but Firebase-dependent routes will not work');
}

module.exports = { admin, db, auth };
