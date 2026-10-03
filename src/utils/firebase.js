import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// בודק האם המשתמש הגדיר את מפתחות הפרויקט ב-Firebase בקובץ .env.local
let isFirebaseConfigured = !!import.meta.env.VITE_FIREBASE_PROJECT_ID;

let db = null;
let auth = null;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    // מטמון קבוע ב-IndexedDB: סימון נוכחות שנעשה בלי קליטה נשמר בטלפון
    // ונשלח כשהרשת חוזרת, גם אם האפליקציה נסגרה בינתיים (במטמון זיכרון
    // הוא היה נעלם בסגירה). בונוס: פתיחה חוזרת מושכת מהשרת רק שינויים,
    // מה שחוסך קריאות במכסה החינמית. אם הדפדפן חוסם IndexedDB (גלישה
    // בסתר), ה-SDK נופל למטמון זיכרון, ו-beforeunload ב-App.jsx מזהיר.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
    auth = getAuth(app);
  } catch (error) {
    console.error("שגיאה באתחול חיבור Firebase:", error);
    // נסיגה בטוחה למצב מקומי במקרה של שגיאת אתחול
    isFirebaseConfigured = false;
    db = null;
    auth = null;
  }
}

export { db, auth, isFirebaseConfigured };

