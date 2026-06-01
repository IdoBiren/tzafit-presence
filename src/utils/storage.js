// שירות ניהול נתונים היברידי (Firebase Firestore / LocalStorage) - נוכחות פנימיית צפית
import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';

const MOCK_STUDENTS = [
  // קסיופיה
  { id: "1", name: "עומר כהן", dorm: "קסיופיה", room: "101", parentName: "ישראל כהן", parentPhone: "054-1234567", notes: "רגישות לבוטנים" },
  { id: "2", name: "נועה לוי", dorm: "קסיופיה", room: "101", parentName: "שרה לוי", parentPhone: "054-7654321", notes: "" },
  { id: "3", name: "דניאל מזרחי", dorm: "קסיופיה", room: "102", parentName: "דוד מזרחי", parentPhone: "052-1112223", notes: "" },
  { id: "4", name: "מאיה אברהם", dorm: "קסיופיה", room: "102", parentName: "רחל אברהם", parentPhone: "050-4445556", notes: "אישור תרופתי קבוע" },
  { id: "5", name: "גיא שפירא", dorm: "קסיופיה", room: "103", parentName: "אלון שפירא", parentPhone: "054-8889990", notes: "" },
  { id: "6", name: "יובל גבאי", dorm: "קסיופיה", room: "103", parentName: "מיכל גבאי", parentPhone: "053-7778889", notes: "" },

  // גלפגוס
  { id: "7", name: "איתי פרץ", dorm: "גלפגוס", room: "104", parentName: "רונן פרץ", parentPhone: "052-3334445", notes: "" },
  { id: "8", name: "עדי ברק", dorm: "גלפגוס", room: "104", parentName: "אורית ברק", parentPhone: "054-2223334", notes: "" },
  { id: "9", name: "שחר אשכנזי", dorm: "גלפגוס", room: "201", parentName: "עמוס אשכנזי", parentPhone: "050-1234599", notes: "" },
  { id: "10", name: "רוני קליין", dorm: "גלפגוס", room: "201", parentName: "עידית קליין", parentPhone: "052-9876543", notes: "צמחונית" },
  { id: "11", name: "אורן חסון", dorm: "גלפגוס", room: "202", parentName: "יוסף חסון", parentPhone: "054-4455667", notes: "" },
  { id: "12", name: "מיכל חדד", dorm: "גלפגוס", room: "202", parentName: "תמי חדד", parentPhone: "053-2233445", notes: "" },

  // מונסון
  { id: "13", name: "תומר ביטון", dorm: "מונסון", room: "203", parentName: "משה ביטון", parentPhone: "052-8899001", notes: "" },
  { id: "14", name: "נטע אלבז", dorm: "מונסון", room: "203", parentName: "סיגלית אלבז", parentPhone: "050-6677889", notes: "קוצר נשימה במאמץ" },
  { id: "15", name: "עידן גולן", dorm: "מונסון", room: "204", parentName: "יצחק גולן", parentPhone: "054-1122334", notes: "" },
  { id: "16", name: "ליאור פרידמן", dorm: "מונסון", room: "204", parentName: "חנה פרידמן", parentPhone: "052-4455661", notes: "" },
  { id: "17", name: "אלון מור", dorm: "מונסון", room: "301", parentName: "אהרון מור", parentPhone: "054-9988776", notes: "" },
  { id: "18", name: "טל אהרוני", dorm: "מונסון", room: "301", parentName: "רונית אהרוני", parentPhone: "053-5544332", notes: "" },

  // אוטופיה
  { id: "19", name: "אביב אוחנה", dorm: "אוטופיה", room: "302", parentName: "שמעון אוחנה", parentPhone: "052-6655443", notes: "" },
  { id: "20", name: "יסמין שלם", dorm: "אוטופיה", room: "302", parentName: "גלית שלם", parentPhone: "050-2211334", notes: "" },
  { id: "21", name: "רום סגל", dorm: "אוטופיה", room: "303", parentName: "ברוך סגל", parentPhone: "054-7766554", notes: "" },
  { id: "22", name: "שירה כץ", dorm: "אוטופיה", room: "303", parentName: "דפנה כץ", parentPhone: "052-8877665", notes: "" },
  { id: "23", name: "ניב גלזר", dorm: "אוטופיה", room: "304", parentName: "אריאל גלזר", parentPhone: "053-9900887", notes: "" },
  { id: "24", name: "יעל אטיאס", dorm: "אוטופיה", room: "304", parentName: "מזל אטיאס", parentPhone: "050-9988112", notes: "אישור רפואי לפטור ספורט" }
];

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
      markedBy: "מדריך תורן בוקר",
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
      markedBy: "מדריכת לילה",
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
  if (!localStorage.getItem("tzafit_students_v2")) {
    localStorage.setItem("tzafit_students_v2", JSON.stringify(MOCK_STUDENTS));
  }
  if (!localStorage.getItem("tzafit_history_v2")) {
    const mockHistory = generateMockHistory();
    localStorage.setItem("tzafit_history_v2", JSON.stringify(mockHistory));
  }
  if (!localStorage.getItem("tzafit_emergency_v2")) {
    localStorage.setItem("tzafit_emergency_v2", JSON.stringify({ active: false, triggeredAt: null, records: {}, reason: "" }));
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
    const students = JSON.parse(localStorage.getItem("tzafit_students_v2"));
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
    const history = JSON.parse(localStorage.getItem("tzafit_history_v2"));
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
    const emergencyState = JSON.parse(localStorage.getItem("tzafit_emergency_v2"));
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
    localStorage.setItem("tzafit_students_v2", JSON.stringify(updatedList));
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
    const history = JSON.parse(localStorage.getItem("tzafit_history_v2")) || [];
    const existingIndex = history.findIndex(h => h.date === date && h.session === session);
    
    if (existingIndex > -1) {
      history[existingIndex] = record;
    } else {
      history.unshift(record);
    }
    
    localStorage.setItem("tzafit_history_v2", JSON.stringify(history));
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
    localStorage.setItem("tzafit_emergency_v2", JSON.stringify(state));
  }
};
