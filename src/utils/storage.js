// שירות ניהול נתונים ב-LocalStorage לטובת אפליקציית נוכחות פנימיית צפית

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

// יצירת היסטוריית נוכחות פיקטיבית ל-7 הימים האחרונים
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
      // 90% סיכוי שנוכח, 6% סיכוי שבבית, 4% סיכוי שלא נוכח
      const rand = Math.random();
      if (rand < 0.90) {
        morningRecords[student.id] = "present";
      } else if (rand < 0.96) {
        morningRecords[student.id] = "leave";
      } else {
        morningRecords[student.id] = "absent";
      }
    });
    
    history.push({
      date: dateString,
      session: "morning", // רישום בוקר
      records: morningRecords,
      markedBy: "מדריך תורן בוקר",
      timestamp: new Date(currentDate.setHours(8, 15, 0)).toISOString()
    });

    // נוכחות ערב
    const eveningRecords = {};
    MOCK_STUDENTS.forEach(student => {
      // בערב נוכחות גבוהה יותר בדרך כלל, או תואמת לסטטוס בבית של הבוקר
      const morningStatus = morningRecords[student.id];
      if (morningStatus === "leave") {
        eveningRecords[student.id] = "leave"; // בבית נמשך לערב
      } else {
        const rand = Math.random();
        if (rand < 0.94) {
          eveningRecords[student.id] = "present";
        } else {
          eveningRecords[student.id] = "absent";
        }
      }
    });

    history.push({
      date: dateString,
      session: "evening", // רישום ערב
      records: eveningRecords,
      markedBy: "מדריכת לילה",
      timestamp: new Date(currentDate.setHours(21, 30, 0)).toISOString()
    });
  }
  
  return history;
};

// אתחול LocalStorage עם נתוני בסיס במידה והם לא קיימים
export const initializeStorage = () => {
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

// שליפת רשימת חניכים
export const getStudents = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem("tzafit_students_v2"));
};

// עדכון רשימת חניכים (הוספה, עריכה, מחיקה)
export const saveStudents = (students) => {
  localStorage.setItem("tzafit_students_v2", JSON.stringify(students));
};

// שליפת היסטוריית נוכחות
export const getHistory = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem("tzafit_history_v2"));
};

// שמירת רשומת נוכחות חדשה או עדכון קיימת
export const saveAttendanceRecord = (date, session, records, markedBy) => {
  const history = getHistory();
  const existingIndex = history.findIndex(h => h.date === date && h.session === session);
  
  const record = {
    date,
    session,
    records,
    markedBy,
    timestamp: new Date().toISOString()
  };

  if (existingIndex > -1) {
    history[existingIndex] = record;
  } else {
    history.unshift(record); // הוספה לראש הרשימה (הכי חדש תחילה)
  }

  localStorage.setItem("tzafit_history_v2", JSON.stringify(history));
  return history;
};

// שליפת סטטוס חירום
export const getEmergencyState = () => {
  initializeStorage();
  return JSON.parse(localStorage.getItem("tzafit_emergency_v2"));
};

// שמירת סטטוס חירום
export const saveEmergencyState = (state) => {
  localStorage.setItem("tzafit_emergency_v2", JSON.stringify(state));
};
