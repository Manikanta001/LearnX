import { initializeApp, getApps } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyBtoY7BPSW_zdrZAh-SmgTKp0KqEyftIgY',
  authDomain: 'dsa-platform-93141.firebaseapp.com',
  projectId: 'dsa-platform-93141',
  storageBucket: 'dsa-platform-93141.firebasestorage.app',
  messagingSenderId: '641640697696',
  appId: '1:641640697696:web:f9ff6c8a81aea674589805',
  measurementId: 'G-VPFZ6XJ3BJ',
};

export const firebaseConfigError: string | null = null;

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let analytics: Analytics | null = null;

if (app && typeof window !== 'undefined') {
  void isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

export const auth: Auth = getAuth(app);
export { analytics };
export default app;
