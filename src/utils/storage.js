// שירות ניהול נתונים היברידי (Firebase Firestore / LocalStorage) - נוכחות פנימיית צפית
import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';

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

// ----------------------------------------------------
// פונקציות עזר לייבוא נתונים ראשוני אוטומטי לענן (Auto Seeding)
// ----------------------------------------------------

const seedCloudStudents = async () => {
  console.log("מבצע הזנת חניכים ראשונית ל-Firestore...");
  const batch = writeBatch(db);
  MOCK_STUDENTS.forEach(student => {
    const docRef = doc(db, "students", student.id);
    batch.set(docRef, student);
  });
  await batch.commit();
  console.log("הזנת חניכים לענן הושלמה בהצלחה!");
};

const seedCloudHistory = async () => {
  console.log("מבצע הזנת היסטוריית נוכחות ראשונית ל-Firestore...");
  const mockHistory = generateMockHistory();
  const batch = writeBatch(db);
  mockHistory.forEach(record => {
    const docId = `${record.date}_${record.session}`;
    const docRef = doc(db, "history", docId);
    batch.set(docRef, record);
  });
  await batch.commit();
  console.log("הזנת היסטוריה לענן הושלמה בהצלחה!");
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
};

// ----------------------------------------------------
// ממשק אסינכרוני בזמן אמת לשימוש האפליקציה (Realtime Observables)
// ----------------------------------------------------

// 1. האזנה לרשימת חניכים
export const subscribeToStudents = (onUpdate) => {
  if (isFirebaseConfigured) {
    const studentsCol = collection(db, "students");
    return onSnapshot(studentsCol, async (snapshot) => {
      if (snapshot.empty) {
        // אם אין חניכים בענן, נבצע Seeding אוטומטי מהמערכת
        await seedCloudStudents();
      } else {
        const studentsList = snapshot.docs.map(d => d.data());
        // מיון חניכים לפי מזהה
        studentsList.sort((a, b) => parseInt(a.id) - parseInt(b.id));
        onUpdate(studentsList);
      }
    }, (error) => {
      console.error("שגיאה בהאזנה לחניכים בענן:", error);
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const students = JSON.parse(localStorage.getItem("tzafit_students_v8"));
    onUpdate(students);
    // החזרת פונקציית ביטול האזנה דמי (Dummy Unsubscribe)
    return () => {};
  }
};

// 2. האזנה להיסטוריית נוכחות (מסודרת מהחדש לישן)
export const subscribeToHistory = (onUpdate) => {
  if (isFirebaseConfigured) {
    const historyQuery = query(collection(db, "history"), orderBy("timestamp", "desc"));
    return onSnapshot(historyQuery, async (snapshot) => {
      if (snapshot.empty) {
        // אם אין היסטוריה בענן, נבצע Seeding אוטומטי
        await seedCloudHistory();
      } else {
        const historyList = snapshot.docs.map(d => d.data());
        onUpdate(historyList);
      }
    }, (error) => {
      console.error("שגיאה בהאזנה להיסטוריה בענן:", error);
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const history = JSON.parse(localStorage.getItem("tzafit_history_v7"));
    onUpdate(history);
    return () => {};
  }
};

// 3. האזנה למצב חירום גלובלי
export const subscribeToEmergency = (onUpdate) => {
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
    });
  } else {
    // Fallback ל-LocalStorage
    initializeLocalStorage();
    const emergencyState = JSON.parse(localStorage.getItem("tzafit_emergency_v7"));
    onUpdate(emergencyState);
    return () => {};
  }
};

// ----------------------------------------------------
// ממשק כתיבה ועדכון נתונים אסינכרוני (Database Writers)
// ----------------------------------------------------

// 4. שמירה ועדכון רשימת החניכים הכללית
export const saveStudents = async (updatedList) => {
  if (isFirebaseConfigured) {
    try {
      // שליפת כל החניכים הקיימים כרגע בענן לצורך השוואה ומחיקה
      const querySnapshot = await getDocs(collection(db, "students"));
      const cloudIds = querySnapshot.docs.map(doc => doc.id);
      
      const batch = writeBatch(db);
      
      // הוספה/עדכון של כל החניכים מהרשימה המעודכנת
      updatedList.forEach(student => {
        const docRef = doc(db, "students", student.id);
        batch.set(docRef, student);
      });
      
      // איתור ומחיקה של חניכים שהוסרו מהרשימה המקומית
      cloudIds.forEach(id => {
        if (!updatedList.some(s => s.id === id)) {
          const docRef = doc(db, "students", id);
          batch.delete(docRef);
        }
      });
      
      await batch.commit();
    } catch (error) {
      console.error("שגיאה בשמירת חניכים לענן:", error);
      throw error;
    }
  } else {
    // Fallback ל-LocalStorage
    localStorage.setItem("tzafit_students_v8", JSON.stringify(updatedList));
  }
};

// 5. שמירת סבב נוכחות חדש
export const saveAttendanceRecord = async (date, session, records, markedBy) => {
  const record = {
    date,
    session,
    records,
    markedBy,
    timestamp: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      const docId = `${date}_${session}`;
      await setDoc(doc(db, "history", docId), record);
    } catch (error) {
      console.error("שגיאה בשמירת סבב נוכחות לענן:", error);
      throw error;
    }
  } else {
    // Fallback ל-LocalStorage
    const history = JSON.parse(localStorage.getItem("tzafit_history_v7")) || [];
    const existingIndex = history.findIndex(h => h.date === date && h.session === session);
    
    if (existingIndex > -1) {
      history[existingIndex] = record;
    } else {
      history.unshift(record);
    }
    
    localStorage.setItem("tzafit_history_v7", JSON.stringify(history));
  }
};

// 5.5. עדכון נוכחות לחניך בודד בסבב ספציפי (לשמירה אוטומטית)
export const updateSingleAttendanceRecord = async (date, session, studentId, status, markedBy) => {
  const docId = `${date}_${session}`;
  
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, "history", docId);
      // שימוש ב-merge כדי לעדכן רק את החניך הספציפי בלי לדרוס שינויים של אחרים
      await setDoc(docRef, {
        date,
        session,
        markedBy,
        records: {
          [studentId]: status
        },
        timestamp: new Date().toISOString()
      }, { merge: true });
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

// 7. שליפה או יצירה של תפקיד משתמש (Role) ושלב רישום ב-Firestore
export const getOrCreateUserRole = async (uid, userDetails) => {
  if (isFirebaseConfigured) {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        let role = data.role || 'counselor';
        let group = data.group || '';
        let needsUpdate = false;

        // קידום אוטומטי של המשתמש בעל המייל המבוקש למנהל
        if (data.email && data.email.toLowerCase() === 'idobi.renboim.ido@gmail.com') {
          if (role !== 'admin') {
            role = 'admin';
            needsUpdate = true;
          }
          if (group !== 'כללי') {
            group = 'כללי';
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          await setDoc(userDocRef, { role, group }, { merge: true });
        }

        return {
          role,
          needsNameSetup: data.needsNameSetup !== undefined ? data.needsNameSetup : false,
          group
        };
      } else {
        const email = userDetails.email || '';
        const isOwner = email.toLowerCase() === 'idobi.renboim.ido@gmail.com';
        const role = isOwner ? 'admin' : 'counselor';
        const group = isOwner ? 'כללי' : ''; // מנהל מקבל 'כללי', מדריך חדש מקבל ריק (ממתין להקצאה)

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

// 12. איפוס חניכים לרשימת ברירת המחדל
export const resetStudentsToDefault = async () => {
  await saveStudents(MOCK_STUDENTS);
};


