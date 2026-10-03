// כלים משותפים למניעת כשלי שמירה שקטים.
//
// Firestore אינו מחזיר שגיאה כשאין רשת - כתיבה פשוט ממתינה עד שהחיבור
// חוזר. לכן "לא נכשל" אינו אומר "נשמר", וכל מקום שכותב חייב להראות גם מצב
// של "ממתין" ולא רק הצלחה/כישלון.

export const SLOW_WRITE_MS = 8000;

// כתיבות שעוד לא אושרו ע"י השרת - נקרא ע"י אזהרת beforeunload ב-App.jsx
let pendingWrites = 0;
export const hasPendingWrites = () => pendingWrites > 0;

// עוטף כתיבה: אם לא הסתיימה תוך SLOW_WRITE_MS קורא ל-onSlow (כדי להציג
// "ממתין לרשת"). הכתיבה עצמה אינה מבוטלת - Firestore ישלים אותה כשהרשת
// תחזור - ולכן ה-promise המוחזר הוא של הכתיבה המקורית.
export const withPendingTimeout = (promise, onSlow, ms = SLOW_WRITE_MS) => {
  pendingWrites++;
  const timer = onSlow ? setTimeout(onSlow, ms) : null;
  return promise.finally(() => {
    pendingWrites--;
    if (timer) clearTimeout(timer);
  });
};

// הודעה בעברית שהמדריך יכול לפעול לפיה, לפי קוד השגיאה של Firestore
export const describeSaveError = (error) => {
  const code = error?.code || '';
  if (code === 'permission-denied') {
    return 'אין לך הרשאה לפעולה הזו. ייתכן שהקבוצה שלך עוד לא אושרה על ידי מנהל.';
  }
  if (code === 'resource-exhausted') {
    return 'מכסת השימוש היומית של המערכת נגמרה. השמירה תחזור לעבוד ב-10:00 בבוקר. דווח למנהל.';
  }
  if (code === 'not-found') {
    return 'החניך כבר לא קיים ברשימה - ייתכן שנמחק על ידי מדריך אחר.';
  }
  if (code === 'unauthenticated') {
    return 'פג תוקף ההתחברות. התחבר מחדש ונסה שוב.';
  }
  // קודים ספציפיים קודם: navigator.onLine הוא רק ניחוש של הדפדפן, ואסור
  // שיסתיר סיבה מדויקת יותר שהשרת החזיר
  if (code === 'unavailable' || code === 'deadline-exceeded' || navigator.onLine === false) {
    return 'אין חיבור לשרת. בדוק את הקליטה ונסה שוב.';
  }
  if (error?.message && !code) {
    // שגיאות שהקוד שלנו זורק (למשל בדיקת תקינות) כבר כתובות בעברית
    return error.message;
  }
  return `השמירה נכשלה${code ? ` (${code})` : ''}. נסה שוב.`;
};
