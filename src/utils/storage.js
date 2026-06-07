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

const MOCK_STUDENTS = [
  // פניקס
  { id: "1", name: "עומר כהן", dorm: "פניקס", room: "101", parentName: "ישראל כהן", parentPhone: "054-1234567", notes: "רגישות לבוטנים" },
  { id: "2", name: "נועה לוי", dorm: "פניקס", room: "101", parentName: "שרה לוי", parentPhone: "054-7654321", notes: "" },
  { id: "3", name: "דניאל מזרחי", dorm: "פניקס", room: "102", parentName: "דוד מזרחי", parentPhone: "052-1112223", notes: "" },
  { id: "4", name: "מאיה אברהם", dorm: "פניקס", room: "102", parentName: "רחל אברהם", parentPhone: "050-4445556", notes: "אישור תרופתי קבוע" },
  { id: "5", name: "גיא שפירא", dorm: "פניקס", room: "103", parentName: "אלון שפירא", parentPhone: "054-8889990", notes: "" },
  { id: "6", name: "יובל גבאי", dorm: "פניקס", room: "103", parentName: "מיכל גבאי", parentPhone: "053-7778889", notes: "" },

  // קומביין (31 חניכים)
  { id: "7", name: "עומר אשכנזי", dorm: "קומביין", room: "104", parentName: "אריאל אשכנזי", parentPhone: "054-1234001", notes: "" },
  { id: "8", name: "עלמה בן שימול", dorm: "קומביין", room: "104", parentName: "דוד בן שימול", parentPhone: "054-1234002", notes: "" },
  { id: "9", name: "גיל ברוג", dorm: "קומביין", room: "104", parentName: "איתי ברוג", parentPhone: "054-1234003", notes: "" },
  { id: "10", name: "זיו גולדנברג", dorm: "קומביין", room: "104", parentName: "מיכל גולדנברג", parentPhone: "054-1234004", notes: "" },
  { id: "11", name: "נעמי גר", dorm: "קומביין", room: "105", parentName: "יוסי גר", parentPhone: "054-1234005", notes: "" },
  { id: "12", name: "תמר הראל", dorm: "קומביין", room: "105", parentName: "עדי הראל", parentPhone: "054-1234006", notes: "" },
  { id: "13", name: "נעמי וזה", dorm: "קומביין", room: "105", parentName: "רון וזה", parentPhone: "054-1234007", notes: "" },
  { id: "14", name: "נדב חן", dorm: "קומביין", room: "105", parentName: "שמואל חן", parentPhone: "054-1234008", notes: "" },
  { id: "15", name: "יוגב טימור", dorm: "קומביין", room: "106", parentName: "ארז טימור", parentPhone: "054-1234009", notes: "" },
  { id: "16", name: "רוני יניב", dorm: "קומביין", room: "106", parentName: "רונן יניב", parentPhone: "054-1234010", notes: "" },
  { id: "17", name: "איתמר ישראלי", dorm: "קומביין", room: "106", parentName: "יאיר ישראלי", parentPhone: "054-1234011", notes: "" },
  { id: "18", name: "איתמר כספי", dorm: "קומביין", room: "106", parentName: "גלעד כספי", parentPhone: "054-1234012", notes: "" },
  { id: "19", name: "מעיין כץ", dorm: "קומביין", room: "107", parentName: "ניר כץ", parentPhone: "054-1234013", notes: "" },
  { id: "20", name: "אריאל לפידות", dorm: "קומביין", room: "107", parentName: "רפי לפידות", parentPhone: "054-1234014", notes: "" },
  { id: "21", name: "תומר מלעי", dorm: "קומביין", room: "107", parentName: "שרון מלעי", parentPhone: "054-1234015", notes: "" },
  { id: "22", name: "שחר מנשה", dorm: "קומביין", room: "107", parentName: "ברק מנשה", parentPhone: "054-1234016", notes: "" },
  { id: "23", name: "איילה סלבין", dorm: "קומביין", room: "108", parentName: "ערן סלבין", parentPhone: "054-1234017", notes: "" },
  { id: "24", name: "רתם סלומון", dorm: "קומביין", room: "108", parentName: "אמיר סלומון", parentPhone: "054-1234018", notes: "" },
  { id: "25", name: "נדב פלג", dorm: "קומביין", room: "108", parentName: "בועז פלג", parentPhone: "054-1234019", notes: "" },
  { id: "26", name: "יובל צביאלי", dorm: "קומביין", room: "108", parentName: "דניאל צביאלי", parentPhone: "054-1234020", notes: "" },
  { id: "27", name: "תומר קוטלר", dorm: "קומביין", room: "108", parentName: "משה קוטלר", parentPhone: "054-1234021", notes: "" },
  { id: "28", name: "שיר-גני רובינשטיין", dorm: "קומביין", room: "109", parentName: "אלון רובינשטיין", parentPhone: "054-1234022", notes: "" },
  { id: "29", name: "מיקה ריבק", dorm: "קומביין", room: "109", parentName: "חגי ריבק", parentPhone: "054-1234023", notes: "" },
  { id: "30", name: "אבישג ריבקין", dorm: "קומביין", room: "109", parentName: "יעקב ריבקין", parentPhone: "054-1234024", notes: "" },
  { id: "31", name: "שחר שיר", dorm: "קומביין", room: "109", parentName: "אופיר שיר", parentPhone: "054-1234025", notes: "" },
  { id: "32", name: "נטע סנפיר", dorm: "קומביין", room: "109", parentName: "דרור סנפיר", parentPhone: "054-1234026", notes: "" },
  { id: "33", name: "אלה קוליש", dorm: "קומביין", room: "110", parentName: "מארק קוליש", parentPhone: "054-1234027", notes: "" },
  { id: "34", name: "ירדן לובטון", dorm: "קומביין", room: "110", parentName: "שי לובטון", parentPhone: "054-1234028", notes: "" },
  { id: "35", name: "שחר בן חיים", dorm: "קומביין", room: "110", parentName: "גולן בן חיים", parentPhone: "054-1234029", notes: "" },
  { id: "36", name: "זיו ברוידא", dorm: "קומביין", room: "110", parentName: "שגיא ברוידא", parentPhone: "054-1234030", notes: "" },
  { id: "37", name: "נגה הלחמי", dorm: "קומביין", room: "110", parentName: "מתן הלחמי", parentPhone: "054-1234031", notes: "" },

  // סקויה (27 חניכים)
  { id: "38", name: "אדר קילמן", dorm: "סקויה", room: "201", parentName: "אריאל קילמן", parentPhone: "054-1234101", notes: "" },
  { id: "39", name: "אלה זינטר", dorm: "סקויה", room: "201", parentName: "דוד זינטר", parentPhone: "054-1234102", notes: "" },
  { id: "40", name: "גפן שטרן", dorm: "סקויה", room: "201", parentName: "איתי שטרן", parentPhone: "054-1234103", notes: "" },
  { id: "41", name: "הילי בר", dorm: "סקויה", room: "201", parentName: "מיכל בר", parentPhone: "054-1234104", notes: "" },
  { id: "42", name: "זהר אלון", dorm: "סקויה", room: "202", parentName: "יוסי אלון", parentPhone: "054-1234105", notes: "" },
  { id: "43", name: "זהרה בזרנו", dorm: "סקויה", room: "202", parentName: "עדי בזרנו", parentPhone: "054-1234106", notes: "" },
  { id: "44", name: "טליה אושיעה", dorm: "סקויה", room: "202", parentName: "רון אושיעה", parentPhone: "054-1234107", notes: "" },
  { id: "45", name: "יעל עמיר", dorm: "סקויה", room: "202", parentName: "שמואל עמיר", parentPhone: "054-1234108", notes: "" },
  { id: "46", name: "יעלה ברוג", dorm: "סקויה", room: "203", parentName: "ארז ברוג", parentPhone: "054-1234109", notes: "" },
  { id: "47", name: "ירדן אברהם", dorm: "סקויה", room: "203", parentName: "רונן אברהם", parentPhone: "054-1234110", notes: "" },
  { id: "48", name: "לי-ים זיו", dorm: "סקויה", room: "203", parentName: "יאיר זיו", parentPhone: "054-1234111", notes: "" },
  { id: "49", name: "נגה לוי", dorm: "סקויה", room: "203", parentName: "גלעד לוי", parentPhone: "054-1234112", notes: "" },
  { id: "50", name: "נועה גבעון", dorm: "סקויה", room: "204", parentName: "ניר גבעון", parentPhone: "054-1234113", notes: "" },
  { id: "51", name: "נטלי דביר", dorm: "סקויה", room: "204", parentName: "רפי דביר", parentPhone: "054-1234114", notes: "" },
  { id: "52", name: "נעמה פרסקו", dorm: "סקויה", room: "204", parentName: "שרון פרסקו", parentPhone: "054-1234115", notes: "" },
  { id: "53", name: "עומר לפידות", dorm: "סקויה", room: "204", parentName: "ברק לפידות", parentPhone: "054-1234116", notes: "" },
  { id: "54", name: "עפרה סלמונה", dorm: "סקויה", room: "205", parentName: "ערן סלמונה", parentPhone: "054-1234117", notes: "" },
  { id: "55", name: "רומי לוי", dorm: "סקויה", room: "205", parentName: "אמיר לוי", parentPhone: "054-1234118", notes: "" },
  { id: "56", name: "רון פלד", dorm: "סקויה", room: "205", parentName: "בועז פלד", parentPhone: "054-1234119", notes: "" },
  { id: "57", name: "שירה רוסו", dorm: "סקויה", room: "205", parentName: "דניאל רוסו", parentPhone: "054-1234120", notes: "" },
  { id: "58", name: "שירי פייס", dorm: "סקויה", room: "206", parentName: "משה פייס", parentPhone: "054-1234121", notes: "" },
  { id: "59", name: "תמר דורון", dorm: "סקויה", room: "206", parentName: "אלון דורון", parentPhone: "054-1234122", notes: "" },
  { id: "60", name: "תמר לבנה", dorm: "סקויה", room: "206", parentName: "חגי לבנה", parentPhone: "054-1234123", notes: "" },
  { id: "61", name: "עומר טנצר", dorm: "סקויה", room: "206", parentName: "יעקב טנצר", parentPhone: "054-1234124", notes: "" },
  { id: "62", name: "הילה ברקול", dorm: "סקויה", room: "207", parentName: "דרור ברקול", parentPhone: "054-1234125", notes: "" },
  { id: "63", name: "שחר יעיש", dorm: "סקויה", room: "207", parentName: "מארק יעיש", parentPhone: "054-1234126", notes: "" },
  { id: "64", name: "שירה מויאל", dorm: "סקויה", room: "207", parentName: "שגיא מויאל", parentPhone: "054-1234127", notes: "" },

  // סהרה (6 חניכים)
  { id: "65", name: "אביב אוחנה", dorm: "סהרה", room: "302", parentName: "שמעון אוחנה", parentPhone: "052-6655443", notes: "" },
  { id: "66", name: "יסמין שלם", dorm: "סהרה", room: "302", parentName: "גלית שלם", parentPhone: "050-2211334", notes: "" },
  { id: "67", name: "רום סגל", dorm: "סהרה", room: "303", parentName: "ברוך סגל", parentPhone: "054-7766554", notes: "" },
  { id: "68", name: "שירה כץ", dorm: "סהרה", room: "303", parentName: "דפנה כץ", parentPhone: "052-8877665", notes: "" },
  { id: "69", name: "ניב גלזר", dorm: "סהרה", room: "304", parentName: "אריאל גלזר", parentPhone: "053-9900887", notes: "" },
  { id: "70", name: "יעל אטיאס", dorm: "סהרה", room: "304", parentName: "מזל אטיאס", parentPhone: "050-9988112", notes: "אישור רפואי לפטור ספורט" }
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
  if (!localStorage.getItem("tzafit_students_v5")) {
    localStorage.setItem("tzafit_students_v5", JSON.stringify(MOCK_STUDENTS));
  }
  if (!localStorage.getItem("tzafit_history_v5")) {
    const mockHistory = generateMockHistory();
    localStorage.setItem("tzafit_history_v5", JSON.stringify(mockHistory));
  }
  if (!localStorage.getItem("tzafit_emergency_v5")) {
    localStorage.setItem("tzafit_emergency_v5", JSON.stringify({ active: false, triggeredAt: null, records: {}, reason: "" }));
  }
  if (!localStorage.getItem("tzafit_users_v5")) {
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
    localStorage.setItem("tzafit_users_v5", JSON.stringify(mockUsers));
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
    const students = JSON.parse(localStorage.getItem("tzafit_students_v5"));
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
    const history = JSON.parse(localStorage.getItem("tzafit_history_v5"));
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
    const emergencyState = JSON.parse(localStorage.getItem("tzafit_emergency_v5"));
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
    localStorage.setItem("tzafit_students_v5", JSON.stringify(updatedList));
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
    const history = JSON.parse(localStorage.getItem("tzafit_history_v5")) || [];
    const existingIndex = history.findIndex(h => h.date === date && h.session === session);
    
    if (existingIndex > -1) {
      history[existingIndex] = record;
    } else {
      history.unshift(record);
    }
    
    localStorage.setItem("tzafit_history_v5", JSON.stringify(history));
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
    localStorage.setItem("tzafit_emergency_v5", JSON.stringify(state));
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
    const usersList = JSON.parse(localStorage.getItem("tzafit_users_v5")) || [];
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
    localStorage.setItem("tzafit_users_v5", JSON.stringify(usersList));
    
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
      const users = JSON.parse(localStorage.getItem("tzafit_users_v5")) || [];
      users.sort((a, b) => {
        if (!a.group && b.group) return -1;
        if (a.group && !b.group) return 1;
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
      onUpdate(users);
    };
    loadUsers();
    
    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_users_v5") {
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
    const usersList = JSON.parse(localStorage.getItem("tzafit_users_v5")) || [];
    const updatedUsers = usersList.filter(u => u.uid !== uid);
    localStorage.setItem("tzafit_users_v5", JSON.stringify(updatedUsers));
    
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
      const users = JSON.parse(localStorage.getItem("tzafit_users_v5")) || [];
      const user = users.find(u => u.uid === uid);
      if (user) {
        onUpdate(user);
      }
    };
    loadUser();
    
    const handleStorageChange = (e) => {
      if (!e.key || e.key === "tzafit_users_v5") {
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


