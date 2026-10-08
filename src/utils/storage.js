// שירות ניהול נתונים היברידי (Firebase Firestore / LocalStorage) - נוכחות פנימיית צפית
import { db, isFirebaseConfigured } from './firebase';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteField,
  runTransaction,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  writeBatch
} from 'firebase/firestore';

const SESSION_ORDER = { morning: 0, afternoon: 1, evening: 2, night: 3 };
const DEFAULT_GROUP_NAMES = ["פניקס", "קומביין", "סקויה", "סהרה"];

// מיון היסטוריה לפי מתי הסבב התרחש, לא לפי מתי מישהו נגע בו אחרון.
// updateSingleAttendanceRecord דורס את timestamp בכל לחיצה, ולכן עריכה של
// סבב ישן הייתה מקפיצה אותו לראש הרשימה וכל מי שקורא history[0] היה מתייחס
// אליו כמצב הנוכחי. date הוא YYYY-MM-DD, כך שהשוואה לקסיקוגרפית תקפה.
const sortHistoryChronologically = (list) =>
  [...list].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (SESSION_ORDER[b.session] ?? -1) - (SESSION_ORDER[a.session] ?? -1);
  });

const RAW_STUDENTS = [
  // פניקס (35 חניכים)
  { id: "1", name: "ליה אביר", dorm: "פניקס" },
  { id: "2", name: "ארז אברהם", dorm: "פניקס" },
  { id: "3", name: "גל אלעד", dorm: "פניקס" },
  { id: "4", name: "אלונה אשכנזי", dorm: "פניקס" },
  { id: "5", name: "יותם באום", dorm: "פניקס" },
  { id: "6", name: "עומר ברוך", dorm: "פניקס" },
  { id: "7", name: "אביגיל גורן", dorm: "פניקס" },
  { id: "8", name: "אריאל גורן", dorm: "פניקס" },
  { id: "9", name: "נעם הול", dorm: "פניקס" },
  { id: "10", name: "נבו זהבי", dorm: "פניקס" },
  { id: "11", name: "מור חלבה", dorm: "פניקס" },
  { id: "12", name: "ענבר חצור-אשדוד", dorm: "פניקס" },
  { id: "13", name: "עמית כהן", dorm: "פניקס" },
  { id: "14", name: "נטע כורש", dorm: "פניקס" },
  { id: "15", name: "עומר כפיר", dorm: "פניקס" },
  { id: "16", name: "אורי לבנה", dorm: "פניקס" },
  { id: "17", name: "אלה משה", dorm: "פניקס" },
  { id: "18", name: "נוגה פלקר", dorm: "פניקס" },
  { id: "19", name: "עלמה צייגר", dorm: "פניקס" },
  { id: "20", name: "רון קאופמן", dorm: "פניקס" },
  { id: "21", name: "דנה חיה קציר", dorm: "פניקס" },
  { id: "22", name: "אורן רמות כהן", dorm: "פניקס" },
  { id: "23", name: "דולב רפופורט", dorm: "פניקס" },
  { id: "24", name: "אייל שלזינגר", dorm: "פניקס" },
  { id: "25", name: "אוריין שרוני", dorm: "פניקס" },
  { id: "26", name: "עומרי תורגמן", dorm: "פניקס" },
  { id: "27", name: "רננה ויינשטיין", dorm: "פניקס" },
  { id: "28", name: "נבו לוי", dorm: "פניקס" },
  { id: "29", name: "יונתן בג'רנו", dorm: "פניקס" },
  { id: "30", name: "עמית אדלר", dorm: "פניקס" },
  { id: "31", name: "ארבל", dorm: "פניקס" },
  { id: "32", name: "הראל שטרן", dorm: "פניקס" },
  { id: "33", name: "עילי שריג", dorm: "פניקס" },
  { id: "34", name: "רומי כץ", dorm: "פניקס" },
  { id: "35", name: "נועם כץ", dorm: "פניקס" },

  // קומביין (31 חניכים)
  { id: "36", name: "עומר אשכנזי", dorm: "קומביין" },
  { id: "37", name: "עלמה בן שימול", dorm: "קומביין" },
  { id: "38", name: "גיל ברוג", dorm: "קומביין" },
  { id: "39", name: "זיו גולדנברג", dorm: "קומביין" },
  { id: "40", name: "נעמי גר", dorm: "קומביין" },
  { id: "41", name: "תמר הראל", dorm: "קומביין" },
  { id: "42", name: "נעמי וזה", dorm: "קומביין" },
  { id: "43", name: "נדב חן", dorm: "קומביין" },
  { id: "44", name: "יוגב טימור", dorm: "קומביין" },
  { id: "45", name: "רוני יניב", dorm: "קומביין" },
  { id: "46", name: "איתמר ישראלי", dorm: "קומביין" },
  { id: "47", name: "איתמר כספי", dorm: "קומביין" },
  { id: "48", name: "מעיין כץ", dorm: "קומביין" },
  { id: "49", name: "אריאל לפידות", dorm: "קומביין" },
  { id: "50", name: "תומר מלעי", dorm: "קומביין" },
  { id: "51", name: "שחר מנשה", dorm: "קומביין" },
  { id: "52", name: "איילה סלבין", dorm: "קומביין" },
  { id: "53", name: "רתם סלומון", dorm: "קומביין" },
  { id: "54", name: "נדב פלג", dorm: "קומביין" },
  { id: "55", name: "יובל צביאלי", dorm: "קומביין" },
  { id: "56", name: "תומר קוטלר", dorm: "קומביין" },
  { id: "57", name: "שיר-גני רובינשטיין", dorm: "קומביין" },
  { id: "58", name: "מיקה ריבק", dorm: "קומביין" },
  { id: "59", name: "אבישג ריבקין", dorm: "קומביין" },
  { id: "60", name: "שחר שיר", dorm: "קומביין" },
  { id: "61", name: "נטע סנפיר", dorm: "קומביין" },
  { id: "62", name: "אלה קוליש", dorm: "קומביין" },
  { id: "63", name: "ירדן לובטון", dorm: "קומביין" },
  { id: "64", name: "שחר בן חיים", dorm: "קומביין" },
  { id: "65", name: "זיו ברוידא", dorm: "קומביין" },
  { id: "66", name: "נגה הלחמי", dorm: "קומביין" },

  // סקויה (27 חניכים)
  { id: "67", name: "אדר קילמן", dorm: "סקויה" },
  { id: "68", name: "אלה זינטר", dorm: "סקויה" },
  { id: "69", name: "גפן שטרן", dorm: "סקויה" },
  { id: "70", name: "הילי בר", dorm: "סקויה" },
  { id: "71", name: "זהר אלון", dorm: "סקויה" },
  { id: "72", name: "זהרה בזרנו", dorm: "סקויה" },
  { id: "73", name: "טליה אושיעה", dorm: "סקויה" },
  { id: "74", name: "יעל עמיר", dorm: "סקויה" },
  { id: "75", name: "יעלה ברוג", dorm: "סקויה" },
  { id: "76", name: "ירדן אברהם", dorm: "סקויה" },
  { id: "77", name: "לי-ים זיו", dorm: "סקויה" },
  { id: "78", name: "נגה לוי", dorm: "סקויה" },
  { id: "79", name: "נועה גבעון", dorm: "סקויה" },
  { id: "80", name: "נטלי דביר", dorm: "סקויה" },
  { id: "81", name: "נעמה פרסקו", dorm: "סקויה" },
  { id: "82", name: "עומר לפידות", dorm: "סקויה" },
  { id: "83", name: "עפרה סלמונה", dorm: "סקויה" },
  { id: "84", name: "רומי לוי", dorm: "סקויה" },
  { id: "85", name: "רון פלד", dorm: "סקויה" },
  { id: "86", name: "שירה רוסו", dorm: "סקויה" },
  { id: "87", name: "שירי פייס", dorm: "סקויה" },
  { id: "88", name: "תמר דורון", dorm: "סקויה" },
  { id: "89", name: "תמר לבנה", dorm: "סקויה" },
  { id: "90", name: "עומר טנצר", dorm: "סקויה" },
  { id: "91", name: "הילה ברקול", dorm: "סקויה" },
  { id: "92", name: "שחר יעיש", dorm: "סקויה" },
  { id: "93", name: "שירה מויאל", dorm: "סקויה" },

  // סהרה (40 חניכים)
  { id: "94", name: "אופיר דיין", dorm: "סהרה" },
  { id: "95", name: "אור נחליאלי", dorm: "סהרה" },
  { id: "96", name: "אוריה רוזנפלד הורביץ", dorm: "סהרה" },
  { id: "97", name: "איתי שפירא", dorm: "סהרה" },
  { id: "98", name: "איתן חן", dorm: "סהרה" },
  { id: "99", name: "אלה סיבלמן", dorm: "סהרה" },
  { id: "100", name: "ארבל ברקאי", dorm: "סהרה" },
  { id: "101", name: "אריאל ראובן", dorm: "סהרה" },
  { id: "102", name: "בעז שאולסקי", dorm: "סהרה" },
  { id: "103", name: "גוני אלקלעי", dorm: "סהרה" },
  { id: "104", name: "גלי פלדמן", dorm: "סהרה" },
  { id: "105", name: "הילה אל נוף", dorm: "סהרה" },
  { id: "106", name: "הלל אשחר", dorm: "סהרה" },
  { id: "107", name: "טליה צורף", dorm: "סהרה" },
  { id: "108", name: "יואב לוי", dorm: "סהרה" },
  { id: "109", name: "יולי אנגל", dorm: "סהרה" },
  { id: "110", name: "יערה מושקין", dorm: "סהרה" },
  { id: "111", name: "ליהי תמיר", dorm: "סהרה" },
  { id: "112", name: "מאיה דורון", dorm: "סהרה" },
  { id: "113", name: "מיכאל אלון", dorm: "סהרה" },
  { id: "114", name: "מעיין גולדשטיין", dorm: "סהרה" },
  { id: "115", name: "מתן אזולאי", dorm: "סהרה" },
  { id: "116", name: "נטע חדד", dorm: "סהרה" },
  { id: "117", name: "נעם אלוש", dorm: "סהרה" },
  { id: "118", name: "סהר גר", dorm: "סהרה" },
  { id: "119", name: "סהר עמיתי", dorm: "סהרה" },
  { id: "120", name: "עופרי גרוסמן", dorm: "סהרה" },
  { id: "121", name: "עילי בוטלמן", dorm: "סהרה" },
  { id: "122", name: "עלמה דסקל", dorm: "סהרה" },
  { id: "123", name: "עמית ברזילאי", dorm: "סהרה" },
  { id: "124", name: "צור אלון", dorm: "סהרה" },
  { id: "125", name: "רותם זהבי", dorm: "סהרה" },
  { id: "126", name: "רותם רמות", dorm: "סהרה" },
  { id: "127", name: "שקד אדלר", dorm: "סהרה" },
  { id: "128", name: "תמר הופמן לוי", dorm: "סהרה" },
  { id: "129", name: "תמרה אשכנזי", dorm: "סהרה" },
  { id: "130", name: "שחר גוטמן", dorm: "סהרה" },
  { id: "131", name: "אורי פולק", dorm: "סהרה" },
  { id: "132", name: "נועם ונהורסט", dorm: "סהרה" },
  { id: "133", name: "יואב אהרון", dorm: "סהרה" }
];

const MOCK_STUDENTS = RAW_STUDENTS.map(student => ({
  ...student,
  room: "צריך להוסיף",
  parentName: "צריך להוסיף",
  parentPhone: "צריך להוסיף",
  notes: "אין"
}));

// יצירת היסטוריית נוכחות פיקטיבית ל-7 הימים האחרונים (עבור Seeding)
const generateMockHistory = () => {
  const history = [];
  const today = new Date();
  
  for (let i = 7; i >= 1; i--) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() - i);
    const dateString = currentDate.toISOString().split('T')[0];
    
    // נוכחות בוקר
    const morningRecords = {};
    MOCK_STUDENTS.forEach(student => {
      const rand = Math.random();
      if (rand < 0.90) morningRecords[student.id] = "present";
      else if (rand < 0.96) morningRecords[student.id] = "leave";
      else morningRecords[student.id] = "absent";
    });
    
    history.push({
      date: dateString,
      session: "morning",
      records: morningRecords,
      markedBy: "מדריך תורן פתיחת יום",
      timestamp: new Date(currentDate.setHours(8, 15, 0)).toISOString()
    });

    // נוכחות ערב
    const eveningRecords = {};
    MOCK_STUDENTS.forEach(student => {
      const morningStatus = morningRecords[student.id];
      if (morningStatus === "leave") {
        eveningRecords[student.id] = "leave";
      } else {
        const rand = Math.random();
        if (rand < 0.94) eveningRecords[student.id] = "present";
        else eveningRecords[student.id] = "absent";
      }
    });

    history.push({
      date: dateString,
      session: "evening",
      records: eveningRecords,
      markedBy: "מדריכת כיבוי אורות",
      timestamp: new Date(currentDate.setHours(21, 30, 0)).toISOString()
    });
  }
  
  return history;
};

const initializeLocalStorage = () => {
  if (!localStorage.getItem("tzafit_students_v8")) {
    localStorage.setItem("tzafit_students_v8", JSON.stringify(MOCK_STUDENTS));
  }
  if (!localStorage.getItem("tzafit_history_v7")) {
    const mockHistory = generateMockHistory();
    localStorage.setItem("tzafit_history_v7", JSON.stringify(mockHistory));
  }
  if (!localStorage.getItem("tzafit_emergency_v7")) {
    localStorage.setItem("tzafit_emergency_v7", JSON.stringify({ active: false, triggeredAt: null, records: {}, reason: "" }));
  }
  if (!localStorage.getItem("tzafit_users_v7")) {
    const mockUsers = [
      {
        uid: "demo-admin-123",
        displayName: "מנהל תורן (דמו)",
        email: "admin@tzafit.org.il",
        photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
        role: "admin",
        group: "כללי",
        needsNameSetup: false
      },
      {
        uid: "demo-counselor-123",
        displayName: "מדריך תורן (דמו)",
        email: "counselor@tzafit.org.il",
        photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        role: "counselor",
        group: "",
        needsNameSetup: false
      }
    ];
    localStorage.setItem("tzafit_users_v7", JSON.stringify(mockUsers));
  }
  if (!localStorage.getItem("tzafit_groups_v1")) {
    localStorage.setItem("tzafit_groups_v1", JSON.stringify(DEFAULT_GROUP_NAMES));
  }
};

// ----------------------------------------------------
// ממשק אסינכרוני בזמן אמת לשימוש האפליקציה (Realtime Observables)
// ----------------------------------------------------

// 1. האזנה לרשימת חניכים
export const subscribeToStudents = (onUpdate, onError) => {
  if (isFirebaseConfigured) {
    const studentsCol = collection(db, "students");
    return onSnapshot(studentsCol, async (snapshot) => {
      // אין זריעה אוטומטית: רשימה ריקה היא מצב לגיטימי (למשל תחילת שנתון),
      // וזריעה הייתה מחזירה מיד את רשימת ברירת המחדל אחרי מחיקה מכוונת.
      const studentsList = snapshot.docs.map(d => d.data());
      // מיון חניכים לפי מזהה
      studentsList.sort((a, b) => parseInt(a.id) - parseInt(b.id));
      onUpdate(studentsList);
    }, (error) => {
      console.error("שגיאה בהאזנה לחניכים בענן:", error);
      onError?.(error);
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const loadStudents = () => {
      onUpdate(JSON.parse(localStorage.getItem("tzafit_students_v8")) || []);
    };
    loadStudents();

    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_students_v8") {
        loadStudents();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};

// כמה ימים אחורה האפליקציה מאזינה להיסטוריה. כל פתיחה של האפליקציה קוראת
// את כל המסמכים בחלון, ובמסלול החינמי של Firebase יש 50K קריאות ביום -
// האזנה לכל ההיסטוריה הייתה גדלה בלי סוף עד שהאפליקציה נחסמת.
export const HISTORY_WINDOW_DAYS = 30;

// התאריך המוקדם ביותר בחלון, בפורמט YYYY-MM-DD (כמו שדה date במסמכים)
export const getHistoryCutoffDate = () => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - HISTORY_WINDOW_DAYS);
  return cutoff.toISOString().split('T')[0];
};

// 2. האזנה להיסטוריית נוכחות של החלון האחרון (מסודרת מהחדש לישן)
export const subscribeToHistory = (onUpdate, onError) => {
  if (isFirebaseConfigured) {
    const historyQuery = query(collection(db, "history"), where("date", ">=", getHistoryCutoffDate()));
    return onSnapshot(historyQuery, async (snapshot) => {
      // אין זריעה אוטומטית של היסטוריה: היא הייתה כותבת נוכחות אקראית
      // ומזויפת לפרודקשן בכל פעם שהאוסף מתרוקן.
      const historyList = snapshot.docs.map(d => d.data());
      onUpdate(sortHistoryChronologically(historyList));
    }, (error) => {
      console.error("שגיאה בהאזנה להיסטוריה בענן:", error);
      onError?.(error);
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const loadHistory = () => {
      const cutoff = getHistoryCutoffDate();
      const history = JSON.parse(localStorage.getItem("tzafit_history_v7")) || [];
      onUpdate(sortHistoryChronologically(history.filter(h => h.date >= cutoff)));
    };
    loadHistory();

    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_history_v7") {
        loadHistory();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};

// 2א. שליפה חד-פעמית של כל ההיסטוריה (לייצוא CSV בלבד - לא האזנה, כדי
// שהקריאות יחויבו רק כשמישהו באמת מייצא)
export const fetchAllHistory = async () => {
  if (isFirebaseConfigured) {
    const snapshot = await getDocs(collection(db, "history"));
    return sortHistoryChronologically(snapshot.docs.map(d => d.data()));
  }
  initializeLocalStorage();
  return sortHistoryChronologically(JSON.parse(localStorage.getItem("tzafit_history_v7")) || []);
};

// 3. האזנה למצב חירום גלובלי
export const subscribeToEmergency = (onUpdate, onError) => {
  if (isFirebaseConfigured) {
    const emergencyDoc = doc(db, "emergency", "state");
    return onSnapshot(emergencyDoc, async (snapshot) => {
      if (!snapshot.exists()) {
        // אתחול מסמך החירום בענן אם לא קיים
        const initialState = { active: false, triggeredAt: null, records: {}, reason: "" };
        await setDoc(emergencyDoc, initialState);
      } else {
        onUpdate(snapshot.data());
      }
    }, (error) => {
      console.error("שגיאה בהאזנה למצב חירום בענן:", error);
      onError?.(error);
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const loadEmergency = () => {
      onUpdate(JSON.parse(localStorage.getItem("tzafit_emergency_v7")));
    };
    loadEmergency();

    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_emergency_v7") {
        loadEmergency();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};

// ----------------------------------------------------
// ממשק כתיבה ועדכון נתונים אסינכרוני (Database Writers)
// ----------------------------------------------------

// 4. הוספה, עריכה ומחיקה של חניך בודד
// כל פעולה נוגעת רק במסמך של החניך שלה. בעבר נשמרה כל הרשימה מהעותק
// המקומי ונמחק מהענן כל חניך שלא הופיע בה - כך ששני מדריכים שהוסיפו חניך
// באותו זמן מחקו זה לזה את החניך בשקט.

// מזהה = המקסימום הידוע + 1. ה-transaction מוודא שהמסמך לא קיים לפני
// היצירה; אם מישהו תפס את המספר באותו רגע, מנסים את הבא.
export const addStudent = async (studentData, knownStudents) => {
  let candidate = Math.max(0, ...knownStudents.map(s => parseInt(s.id) || 0)) + 1;

  if (isFirebaseConfigured) {
    for (let attempt = 0; attempt < 10; attempt++, candidate++) {
      const id = candidate.toString();
      const docRef = doc(db, "students", id);
      const created = await runTransaction(db, async (tx) => {
        const existing = await tx.get(docRef);
        if (existing.exists()) return false;
        // createdAt: לוח הבקרה לא סופר חניך בסבבים שלפני שנוסף
        tx.set(docRef, { ...studentData, id, createdAt: new Date().toISOString() });
        return true;
      });
      if (created) return id;
    }
    throw new Error('לא נמצא מזהה פנוי לחניך החדש. רענן את הדף ונסה שוב.');
  } else {
    // Fallback ל-LocalStorage
    const students = JSON.parse(localStorage.getItem("tzafit_students_v8")) || [];
    while (students.some(s => s.id === candidate.toString())) candidate++;
    const id = candidate.toString();
    localStorage.setItem("tzafit_students_v8", JSON.stringify([...students, { ...studentData, id, createdAt: new Date().toISOString() }]));
    window.dispatchEvent(new Event('storage'));
    return id;
  }
};

export const updateStudent = async (studentId, fields) => {
  if (isFirebaseConfigured) {
    // updateDoc ולא setDoc: אם החניך נמחק בינתיים ע"י מדריך אחר, העריכה
    // נכשלת עם שגיאה במקום ליצור אותו מחדש בשקט
    await updateDoc(doc(db, "students", studentId), fields);
  } else {
    const students = JSON.parse(localStorage.getItem("tzafit_students_v8")) || [];
    if (!students.some(s => s.id === studentId)) {
      throw new Error('החניך כבר לא קיים ברשימה - ייתכן שנמחק על ידי מדריך אחר.');
    }
    localStorage.setItem("tzafit_students_v8", JSON.stringify(
      students.map(s => s.id === studentId ? { ...s, ...fields } : s)
    ));
    window.dispatchEvent(new Event('storage'));
  }
};

export const deleteStudent = async (studentId) => {
  if (isFirebaseConfigured) {
    await deleteDoc(doc(db, "students", studentId));
  } else {
    const students = JSON.parse(localStorage.getItem("tzafit_students_v8")) || [];
    localStorage.setItem("tzafit_students_v8", JSON.stringify(students.filter(s => s.id !== studentId)));
    window.dispatchEvent(new Event('storage'));
  }
};

// 5. עדכון נוכחות לחניך בודד בסבב ספציפי (לשמירה אוטומטית)
export const updateSingleAttendanceRecord = async (date, session, studentId, status, markedBy) => {
  const docId = `${date}_${session}`;
  
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "history", docId);
      // שימוש ב-merge כדי לעדכן רק את החניך הספציפי בלי לדרוס שינויים של אחרים
      const update = {
        date,
        session,
        markedBy,
        records: {
          [studentId]: status
        },
        timestamp: new Date().toISOString()
      };
      // סיבת "לא נמצא" שייכת רק לסטטוס הזה - מעבר לסטטוס אחר מוחק אותה
      // באותה כתיבה, כדי שלא תישאר סיבה יתומה ליד "נוכח"
      if (status !== 'absent') {
        update.notes = { [studentId]: deleteField() };
      }
      await setDoc(docRef, update, { merge: true });
    } catch (error) {
      console.error("שגיאה בעדכון נוכחות לחניך בודד בענן:", error);
      throw error;
    }
  } else {
    // Fallback ל-LocalStorage
    const history = JSON.parse(localStorage.getItem("tzafit_history_v7")) || [];
    let existingIndex = history.findIndex(h => h.date === date && h.session === session);
    
    if (existingIndex > -1) {
      history[existingIndex].records[studentId] = status;
      history[existingIndex].timestamp = new Date().toISOString();
      history[existingIndex].markedBy = markedBy;
      if (status !== 'absent' && history[existingIndex].notes) {
        delete history[existingIndex].notes[studentId];
      }
    } else {
      const newRecord = {
        date,
        session,
        records: { [studentId]: status },
        markedBy,
        timestamp: new Date().toISOString()
      };
      history.unshift(newRecord);
    }
    localStorage.setItem("tzafit_history_v7", JSON.stringify(history));
    window.dispatchEvent(new Event('storage'));
  }
};

// 5א. סיבה לסטטוס "לא נמצא" (חוג, טיפול...) - שדה notes.<id> במסמך הסבב,
// ליד records ולא בתוכו, כדי שמבנה records שלוח הבקרה והייצוא קוראים לא ישתנה.
// הערה ריקה מוחקת את השדה.
export const updateAttendanceNote = async (date, session, studentId, note) => {
  const trimmed = (note || '').trim();

  if (isFirebaseConfigured) {
    await setDoc(doc(db, "history", `${date}_${session}`), {
      notes: { [studentId]: trimmed ? trimmed : deleteField() }
    }, { merge: true });
  } else {
    const history = JSON.parse(localStorage.getItem("tzafit_history_v7")) || [];
    const record = history.find(h => h.date === date && h.session === session);
    if (!record) {
      throw new Error('הסבב עוד לא נשמר - סמן קודם את החניך ונסה שוב.');
    }
    record.notes = { ...(record.notes || {}) };
    if (trimmed) record.notes[studentId] = trimmed;
    else delete record.notes[studentId];
    localStorage.setItem("tzafit_history_v7", JSON.stringify(history));
    window.dispatchEvent(new Event('storage'));
  }
};

// 6. שמירת מצב חירום גלובלי
export const saveEmergencyState = async (state) => {
  if (isFirebaseConfigured) {
    try {
      await setDoc(doc(db, "emergency", "state"), state);
    } catch (error) {
      console.error("שגיאה בעדכון מצב חירום לענן:", error);
      throw error;
    }
  } else {
    // Fallback ל-LocalStorage
    localStorage.setItem("tzafit_emergency_v7", JSON.stringify(state));
  }
};

// 6א. עדכון שדות בודדים ב-records של מצב החירום (סימון בטוח / הוספת והסרת חניכים)
// saveEmergencyState כותב את כל המסמך מהעותק המקומי של הלקוח, ולכן שני
// מדריכים שמסמנים באותו רגע היו דורסים זה את סימוני זה. כאן כל שינוי נוגע
// רק בשדה records.<id> שלו - כמו updateSingleAttendanceRecord בנוכחות.
// changes: { [studentId]: true | false | null } - null מסיר את החניך מהרשימה.
export const updateEmergencyRecords = async (changes) => {
  if (isFirebaseConfigured) {
    try {
      const fieldUpdates = {};
      Object.entries(changes).forEach(([studentId, value]) => {
        fieldUpdates[`records.${studentId}`] = value === null ? deleteField() : value;
      });
      await updateDoc(doc(db, "emergency", "state"), fieldUpdates);
    } catch (error) {
      console.error("שגיאה בעדכון רשומת חירום בענן:", error);
      throw error;
    }
  } else {
    // Fallback ל-LocalStorage
    const state = JSON.parse(localStorage.getItem("tzafit_emergency_v7")) || { active: false, triggeredAt: null, records: {}, reason: "" };
    const records = { ...state.records };
    Object.entries(changes).forEach(([studentId, value]) => {
      if (value === null) delete records[studentId];
      else records[studentId] = value;
    });
    localStorage.setItem("tzafit_emergency_v7", JSON.stringify({ ...state, records }));
    window.dispatchEvent(new Event('storage'));
  }
};

// 7. שליפה או יצירה של תפקיד משתמש (Role) ושלב רישום ב-Firestore
export const getOrCreateUserRole = async (uid, userDetails) => {
  if (isFirebaseConfigured) {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        const role = data.role || 'counselor';
        const group = data.group || '';

        // התפקיד והקבוצה נקראים מהמסמך ואינם נקבעים כאן. הלקוח אינו
        // מוסמך לשנות אותם - firestore.rules חוסם זאת - והקצאה נעשית
        // על ידי אדמין במסך ניהול הצוות.
        return {
          role,
          needsNameSetup: data.needsNameSetup !== undefined ? data.needsNameSetup : false,
          group
        };
      } else {
        const email = userDetails.email || '';
        // כל נרשם חדש נוצר כמדריך בלי קבוצה וממתין לאישור אדמין.
        // firestore.rules מתיר יצירה עצמית רק בערכים האלה בדיוק, כך
        // שגם לקוח שהשתנה לא יכול להעניק לעצמו תפקיד.
        const role = 'counselor';
        const group = '';

        const newUser = {
          uid,
          displayName: userDetails.displayName || '',
          email,
          photoURL: userDetails.photoURL || '',
          role,
          group,
          needsNameSetup: true,
          createdAt: new Date().toISOString()
        };
        await setDoc(userDocRef, newUser);
        return { role, needsNameSetup: true, group };
      }
    } catch (error) {
      console.error("שגיאה בשליפת/יצירת תפקיד המשתמש מהענן:", error);
      return { role: 'counselor', needsNameSetup: false, group: '' }; // נסיגה בטוחה
    }
  } else {
    // דמו מקומי - נחזיר את מה שסופק או מדריך כברירת מחדל
    const role = userDetails.role || 'counselor';
    return {
      role,
      needsNameSetup: userDetails.needsNameSetup !== undefined ? userDetails.needsNameSetup : false,
      group: userDetails.group !== undefined ? userDetails.group : (role === 'admin' ? 'כללי' : '')
    };
  }
};

// 8. עדכון פרטי משתמש (שם תצוגה, ביטול דגל הגדרת שם, ועדכון קבוצה/תפקיד)
export const updateUserProfile = async (uid, updates) => {
  if (isFirebaseConfigured) {
    try {
      const userDocRef = doc(db, "users", uid);
      await setDoc(userDocRef, updates, { merge: true });
    } catch (error) {
      console.error("שגיאה בעדכון פרופיל המשתמש בענן:", error);
      throw error;
    }
  } else {
    // במצב דמו מקומי - נעדכן את ה-sessionStorage של המשתמש הנוכחי אם זה הוא
    const cachedDemoUser = sessionStorage.getItem('tzafit_demo_user');
    if (cachedDemoUser) {
      const user = JSON.parse(cachedDemoUser);
      if (user.uid === uid) {
        const updatedUser = { ...user, ...updates };
        sessionStorage.setItem('tzafit_demo_user', JSON.stringify(updatedUser));
      }
    }
    
    // נעדכן גם ברשימת המשתמשים הכללית ב-localStorage
    initializeLocalStorage();
    const usersList = JSON.parse(localStorage.getItem("tzafit_users_v7")) || [];
    const userIndex = usersList.findIndex(u => u.uid === uid);
    if (userIndex > -1) {
      usersList[userIndex] = { ...usersList[userIndex], ...updates };
    } else {
      // אם המשתמש לא קיים ברשימת המדריכים בדמו, נוסיף אותו
      const cachedUser = cachedDemoUser ? JSON.parse(cachedDemoUser) : {};
      const newUser = {
        uid,
        displayName: updates.displayName || cachedUser.displayName || 'משתמש חדש',
        email: updates.email || cachedUser.email || 'new@tzafit.org.il',
        photoURL: updates.photoURL || cachedUser.photoURL || '',
        role: updates.role || cachedUser.role || 'counselor',
        group: updates.group !== undefined ? updates.group : '',
        needsNameSetup: updates.needsNameSetup !== undefined ? updates.needsNameSetup : false,
        ...updates
      };
      usersList.push(newUser);
    }
    localStorage.setItem("tzafit_users_v7", JSON.stringify(usersList));
    
    // שליחת אירוע לעדכון רכיבים באותו חלון
    window.dispatchEvent(new Event('storage'));
  }
};

// 9. האזנה לרשימת משתמשים (עבור מנהל המערכת)
export const subscribeToUsers = (onUpdate) => {
  if (isFirebaseConfigured) {
    const usersCol = collection(db, "users");
    return onSnapshot(usersCol, (snapshot) => {
      const usersList = snapshot.docs.map(d => d.data());
      // מיון: משתמשים ללא קבוצה יופיעו ראשונים
      usersList.sort((a, b) => {
        if (!a.group && b.group) return -1;
        if (a.group && !b.group) return 1;
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
      onUpdate(usersList);
    }, (error) => {
      console.error("שגיאה בהאזנה למשתמשים בענן:", error);
    });
  } else {
    initializeLocalStorage();
    const loadUsers = () => {
      const users = JSON.parse(localStorage.getItem("tzafit_users_v7")) || [];
      users.sort((a, b) => {
        if (!a.group && b.group) return -1;
        if (a.group && !b.group) return 1;
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
      onUpdate(users);
    };
    loadUsers();
    
    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_users_v7") {
        loadUsers();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};

// 10. מחיקת משתמש מהמערכת
export const deleteUserRecord = async (uid) => {
  if (isFirebaseConfigured) {
    try {
      const userDocRef = doc(db, "users", uid);
      await deleteDoc(userDocRef);
    } catch (error) {
      console.error("שגיאה במחיקת משתמש מהענן:", error);
      throw error;
    }
  } else {
    initializeLocalStorage();
    const usersList = JSON.parse(localStorage.getItem("tzafit_users_v7")) || [];
    const updatedUsers = usersList.filter(u => u.uid !== uid);
    localStorage.setItem("tzafit_users_v7", JSON.stringify(updatedUsers));
    
    window.dispatchEvent(new Event('storage'));
  }
};

// 11. האזנה לפרופיל משתמש בודד בזמן אמת (עבור המשתמש המחובר)
export const subscribeToUserProfile = (uid, onUpdate) => {
  if (isFirebaseConfigured) {
    const userDocRef = doc(db, "users", uid);
    return onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data());
      }
    }, (error) => {
      console.error("שגיאה בהאזנה לפרופיל המשתמש בענן:", error);
    });
  } else {
    // מצב דמו - האזנה לשינויים ב-localStorage
    const loadUser = () => {
      const users = JSON.parse(localStorage.getItem("tzafit_users_v7")) || [];
      const user = users.find(u => u.uid === uid);
      if (user) {
        onUpdate(user);
      }
    };
    loadUser();
    
    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_users_v7") {
        loadUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};

// 13. האזנה לרשימת שמות הקבוצות (settings/groups)
export const subscribeToGroupNames = (onUpdate, onError) => {
  if (isFirebaseConfigured) {
    const groupsDoc = doc(db, "settings", "groups");
    return onSnapshot(groupsDoc, async (snapshot) => {
      if (!snapshot.exists()) {
        // אתחול מסמך הקבוצות בענן אם לא קיים
        await setDoc(groupsDoc, { names: DEFAULT_GROUP_NAMES });
      } else {
        onUpdate(snapshot.data().names || DEFAULT_GROUP_NAMES);
      }
    }, (error) => {
      console.error("שגיאה בהאזנה לשמות הקבוצות בענן:", error);
      onError?.(error);
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const loadGroups = () => {
      const names = JSON.parse(localStorage.getItem("tzafit_groups_v1")) || DEFAULT_GROUP_NAMES;
      onUpdate(names);
    };
    loadGroups();

    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_groups_v1") {
        loadGroups();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }
};

// 14. שינוי שם קבוצה קיימת בכל המקומות בו-זמנית (batch אטומי)
export const renameGroup = async (oldName, newName) => {
  const trimmedNewName = newName.trim();

  if (isFirebaseConfigured) {
    try {
      const groupsDocRef = doc(db, "settings", "groups");
      const groupsSnap = await getDoc(groupsDocRef);
      const currentNames = groupsSnap.exists() ? (groupsSnap.data().names || DEFAULT_GROUP_NAMES) : DEFAULT_GROUP_NAMES;
      const idx = currentNames.indexOf(oldName);
      if (idx === -1) throw new Error(`הקבוצה "${oldName}" לא נמצאה ברשימה הנוכחית.`);

      const updatedNames = [...currentNames];
      updatedNames[idx] = trimmedNewName; // עדכון במקום - אותו אינדקס, כדי שהצבע יישאר יציב

      const studentsSnap = await getDocs(query(collection(db, "students"), where("dorm", "==", oldName)));
      const usersSnap = await getDocs(query(collection(db, "users"), where("group", "==", oldName)));

      const batch = writeBatch(db);
      batch.set(groupsDocRef, { names: updatedNames });
      studentsSnap.docs.forEach(d => batch.update(d.ref, { dorm: trimmedNewName }));
      usersSnap.docs.forEach(d => batch.update(d.ref, { group: trimmedNewName }));

      await batch.commit();
    } catch (error) {
      console.error("שגיאה בשינוי שם הקבוצה בענן:", error);
      throw error;
    }
  } else {
    // Fallback ל-LocalStorage - אין batch אטומי אמיתי, אבל גם אין תרחיש
    // מרובה-משתמשים אמיתי במצב דמו, אז עדכון רציף מספיק.
    initializeLocalStorage();
    const currentNames = JSON.parse(localStorage.getItem("tzafit_groups_v1")) || DEFAULT_GROUP_NAMES;
    const idx = currentNames.indexOf(oldName);
    if (idx === -1) throw new Error(`הקבוצה "${oldName}" לא נמצאה ברשימה הנוכחית.`);
    const updatedNames = [...currentNames];
    updatedNames[idx] = trimmedNewName;
    localStorage.setItem("tzafit_groups_v1", JSON.stringify(updatedNames));

    const students = JSON.parse(localStorage.getItem("tzafit_students_v8")) || [];
    localStorage.setItem("tzafit_students_v8", JSON.stringify(
      students.map(s => s.dorm === oldName ? { ...s, dorm: trimmedNewName } : s)
    ));

    const users = JSON.parse(localStorage.getItem("tzafit_users_v7")) || [];
    localStorage.setItem("tzafit_users_v7", JSON.stringify(
      users.map(u => u.group === oldName ? { ...u, group: trimmedNewName } : u)
    ));

    window.dispatchEvent(new Event('storage'));
  }
};


