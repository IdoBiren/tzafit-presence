import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  AlertTriangle,
  Flame,
  CloudLightning,
  UserCheck
} from 'lucide-react';
import Header from './components/Header';
import RollCall from './components/RollCall';
import Login from './components/Login';
import NameSetup from './components/NameSetup';
import GroupPending from './components/GroupPending';
import { ToastProvider, useToast } from './components/ToastProvider';

// נטענים על פי דרישה בלבד - כל אחד מהם הוא טאב משני, לא מסך הנחיתה
// (rollcall) שרוב המדריכים פותחים ראשון. Dashboard סוחב את recharts, תלות
// כבדה יחסית שבשימוש רק שם, כך שהפיצול הזה הוא שמוריד הכי הרבה ממשקל
// הטעינה הראשונית.
const Dashboard = lazy(() => import('./components/Dashboard'));
const EmergencyMode = lazy(() => import('./components/EmergencyMode'));
const StudentManager = lazy(() => import('./components/StudentManager'));
const StaffManager = lazy(() => import('./components/StaffManager'));
import { 
  subscribeToStudents, 
  addStudent,
  updateStudent,
  deleteStudent,
  subscribeToHistory,
  updateSingleAttendanceRecord,
  updateAttendanceNote,
  subscribeToEmergency, 
  saveEmergencyState,
  updateEmergencyRecords,
  getOrCreateUserRole,
  updateUserProfile,
  subscribeToUserProfile,
  subscribeToGroupNames
} from './utils/storage';
import { auth, isFirebaseConfigured } from './utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { describeSaveError, hasPendingWrites } from './utils/saveErrors';

// מוצג לרגע קצר בלבד בזמן שטאב הנטען לפי דרישה מגיע - לא מסך טעינה מלא,
// כי מעטפת האפליקציה (כותרת, ניווט) כבר מוצגת
const TabLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem 1rem',
    color: 'var(--text-muted)',
    fontWeight: 700
  }}>
    טוען...
  </div>
);

function AppContent() {
  const { showToast } = useToast();
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [emergencyState, setEmergencyState] = useState({ active: false, records: {}, reason: '', triggeredAt: null });
  const [activeTab, setActiveTab] = useState('rollcall');
  const [visitedTabs, setVisitedTabs] = useState(() => new Set(['rollcall']));
  // יעד לרישום הנוכחות כשלוחצים על סבב בלוח הבקרה: { dorm, date, session }
  const [rollCallTarget, setRollCallTarget] = useState(null);
  const [groupNames, setGroupNames] = useState([]);
  // שגיאות האזנה פעילות, לפי מקור. בלי זה מאזין שנכשל משאיר על המסך
  // נתונים ישנים שנראים עדכניים.
  const [listenerErrors, setListenerErrors] = useState({});
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);

  // מחווני טעינה וסנכרון לענן
  const [loading, setLoading] = useState(true);
  const [dbOperating, setDbOperating] = useState(false);

  // חיבור מאזינים בזמן אמת (Realtime Subscriptions) מול ענן Firebase או LocalStorage
  useEffect(() => {
    let unsubscribeStudents = () => {};
    let unsubscribeHistory = () => {};
    let unsubscribeEmergency = () => {};
    let unsubscribeUserProfile = () => {};
    let unsubscribeGroupNames = () => {};

    // כל עדכון מוצלח מנקה את השגיאה של אותו מקור
    const reportListenerError = (source) => (error) => {
      setListenerErrors(prev => ({ ...prev, [source]: describeSaveError(error) }));
    };
    const clearListenerError = (source) => {
      setListenerErrors(prev => {
        if (!prev[source]) return prev;
        const next = { ...prev };
        delete next[source];
        return next;
      });
    };

    const startSubscriptions = () => {
      // 1. האזנה לחניכים
      unsubscribeStudents = subscribeToStudents((updatedStudents) => {
        setStudents(updatedStudents);
        clearListenerError('students');
      }, reportListenerError('students'));

      // 2. האזנה להיסטוריית נוכחות
      unsubscribeHistory = subscribeToHistory((updatedHistory) => {
        setHistory(updatedHistory);
        clearListenerError('history');
      }, reportListenerError('history'));

      // 3. האזנה למצב חירום גלובלי
      unsubscribeEmergency = subscribeToEmergency((updatedEmergency) => {
        setEmergencyState(updatedEmergency);
        clearListenerError('emergency');
        setLoading(false); // הפסקת מסך הטעינה הראשוני ברגע שהנתונים מגיעים
      }, (error) => {
        reportListenerError('emergency')(error);
        setLoading(false); // אחרת מסך הטעינה נתקע לנצח בלי הסבר
      });

      // 4. האזנה לשמות הקבוצות
      unsubscribeGroupNames = subscribeToGroupNames((updatedGroupNames) => {
        setGroupNames(updatedGroupNames);
        clearListenerError('groups');
      }, reportListenerError('groups'));
    };

    if (isFirebaseConfigured && auth) {
      // האזנה למצב התחברות של Firebase Auth
      const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          setLoading(true);
          try {
            // וידוא יצירת הפרופיל ב-Firestore
            await getOrCreateUserRole(firebaseUser.uid, {
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL
            });
            
            // האזנה לפרופיל המשתמש המחובר בזמן אמת לעדכוני קבוצה/תפקיד
            unsubscribeUserProfile = subscribeToUserProfile(firebaseUser.uid, (profileData) => {
              setUser({
                uid: firebaseUser.uid,
                displayName: profileData.displayName || firebaseUser.displayName || 'מדריך צפית',
                email: profileData.email || firebaseUser.email,
                photoURL: profileData.photoURL || firebaseUser.photoURL || '',
                role: profileData.role || 'counselor',
                group: profileData.group || '',
                needsNameSetup: profileData.needsNameSetup !== undefined ? profileData.needsNameSetup : false,
                isDemo: false
              });
              setLoading(false);
            });

            startSubscriptions();
          } catch (err) {
            console.error("שגיאה בקריאת פרטי הרשאות משתמש:", err);
            setUser(null);
            setLoading(false);
          }
        } else {
          setUser(null);
          setLoading(false);
        }
      });

      return () => {
        unsubscribeAuth();
        unsubscribeStudents();
        unsubscribeHistory();
        unsubscribeEmergency();
        unsubscribeUserProfile();
        unsubscribeGroupNames();
      };
    } else {
      // מצב דמו / LocalStorage
      const cachedDemoUser = sessionStorage.getItem('tzafit_demo_user');
      if (cachedDemoUser) {
        const parsedUser = JSON.parse(cachedDemoUser);
        
        // האזנה לפרופיל המשתמש בדמו למקרה שהמנהל מקצה קבוצה בדמו
        unsubscribeUserProfile = subscribeToUserProfile(parsedUser.uid, (profileData) => {
          setUser({
            uid: parsedUser.uid,
            displayName: profileData.displayName || parsedUser.displayName,
            email: profileData.email || parsedUser.email,
            photoURL: profileData.photoURL || parsedUser.photoURL,
            role: profileData.role || parsedUser.role,
            group: profileData.group !== undefined ? profileData.group : parsedUser.group,
            needsNameSetup: profileData.needsNameSetup !== undefined ? profileData.needsNameSetup : parsedUser.needsNameSetup,
            isDemo: true
          });
          setLoading(false);
        });

        startSubscriptions();
      } else {
        // user כבר null כברירת מחדל, ו-handleLogin/handleLogout מעדכנים אותו
        // ישירות - הענף הזה רץ רק כשאין משתמש דמו שמור. loading בכל זאת חייב
        // לרדת ל-false פה כדי לסיים את מסך הטעינה הראשוני ולהציג את הכניסה,
        // וזו קריאה אמיתית התלויה בבדיקת sessionStorage (מקור חיצוני).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(false);
      }

      return () => {
        unsubscribeStudents();
        unsubscribeHistory();
        unsubscribeEmergency();
        unsubscribeUserProfile();
        unsubscribeGroupNames();
      };
    }
  }, [user?.uid]);

  // מצב רשת ואזהרה לפני סגירה כשיש כתיבות שעוד לא אושרו ע"י השרת.
  // המטמון הקבוע (firebase.js) שומר אותן בטלפון, אבל בדפדפן שחוסם
  // IndexedDB הן היו נעלמות בסגירה - האזהרה היא רשת הביטחון.
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleBeforeUnload = (e) => {
      if (hasPendingWrites()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // הוספה/עריכה/מחיקה של חניך. השגיאות נזרקות הלאה כדי ש-StudentManager
  // ישאיר את החלון פתוח ויציג אותן - לא alert שאפשר לפספס.
  // אם יש חירום פעיל, החניך נוסף/מוסר גם מרשימת החירום (שדה בודד בלבד, כדי
  // לא לדרוס סימוני "בטוח" של מדריכים אחרים).
  const syncEmergencyRecord = async (studentId, value) => {
    if (!emergencyState.active) return;
    try {
      await updateEmergencyRecords({ [studentId]: value });
    } catch (error) {
      // החניך עצמו כבר נשמר - מדווחים בנפרד על רשימת החירום
      showToast(`החניך נשמר, אך עדכון רשימת החירום נכשל: ${describeSaveError(error)}`, 'error', 8000);
    }
  };

  const handleAddStudent = async (studentData) => {
    const newId = await addStudent(studentData, students);
    await syncEmergencyRecord(newId, false);
    return newId;
  };

  const handleUpdateStudent = async (studentId, fields) => {
    await updateStudent(studentId, fields);
  };

  const handleDeleteStudent = async (studentId) => {
    await deleteStudent(studentId);
    await syncEmergencyRecord(studentId, null);
  };

  // עדכון נוכחות של חניך בודד (שמירה אוטומטית / זמן אמת)
  const handleUpdateSingleAttendance = async (date, session, studentId, status, markedBy) => {
    try {
      await updateSingleAttendanceRecord(date, session, studentId, status, markedBy);
    } catch (error) {
      console.error("שגיאה בעדכון נוכחות אוטומטי:", error);
      throw error; // RollCall מציג תג שגיאה ספציפי לחניך ומבטל את הסימון האופטימי
    }
  };

  // שמירה ועדכון מצב חירום גלובלי בענן
  const handleSaveEmergencyState = async (updatedState) => {
    setDbOperating(true);
    try {
      await saveEmergencyState(updatedState);
      
      // אם מצב החירום הופעל עכשיו, מעבירים אוטומטית את המשתמש ללשונית חירום
      if (updatedState.active) {
        setActiveTab('emergency');
      } else {
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error("שגיאה בעדכון מצב חירום:", error);
      showToast('שגיאה בעדכון מצב החירום בענן. נסה שוב.', 'error');
    } finally {
      setDbOperating(false);
    }
  };

  // סימון חניך בודד כבטוח / טרם אומת במצב חירום - כותב רק את השדה שלו
  const handleSetEmergencyRecord = async (studentId, isSafe) => {
    try {
      await updateEmergencyRecords({ [studentId]: isSafe });
    } catch (error) {
      console.error("שגיאה בעדכון סימון חירום:", error);
      showToast('שגיאה בשמירת הסימון בענן. נסה שוב.', 'error');
    }
  };

  const handleOpenRound = (dorm, date, session) => {
    setRollCallTarget({ dorm, date, session });
    setActiveTab('rollcall');
  };

  const clearRollCallTarget = () => {
    setRollCallTarget(null);
  };

  // טיפול בהתחברות מוצלחת
  const handleLoginSuccess = (loggedInUser) => {
    if (loggedInUser.isDemo) {
      sessionStorage.setItem('tzafit_demo_user', JSON.stringify(loggedInUser));
    }
    setUser(loggedInUser);
  };

  // טיפול בעדכון שם משתמש ראשוני
  const handleUpdateName = async (newName) => {
    try {
      await updateUserProfile(user.uid, {
        displayName: newName,
        needsNameSetup: false
      });
      setUser(prev => ({
        ...prev,
        displayName: newName,
        needsNameSetup: false
      }));
    } catch (error) {
      console.error("שגיאה בעדכון השם:", error);
      throw error;
    }
  };

  // התנתקות מהמערכת
  const handleLogout = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
      if (isFirebaseConfigured && auth) {
        try {
          await signOut(auth);
        } catch (error) {
          console.error("שגיאה בתהליך ההתנתקות:", error);
        }
      } else {
        sessionStorage.removeItem('tzafit_demo_user');
      }
      setUser(null);
      setLoading(false);
      setActiveTab('rollcall');
      setVisitedTabs(new Set(['rollcall']));
    }
  };

  // מסך טעינה והתחברות ראשונית יוקרתי
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#f1f5f9',
        fontFamily: 'Rubik, Heebo, sans-serif',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          borderRadius: '50%', 
          backgroundColor: '#eff6ff',
          color: '#2563eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          animation: 'pulse 1.8s infinite ease-in-out',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
        }}>
          <CloudLightning size={36} style={{ animation: 'bounce 2s infinite' }} />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1e293b', marginBottom: '0.5rem' }}>מתחבר למסד הנתונים...</h2>
        <p style={{ color: '#64748b', fontSize: '0.92rem', maxWidth: '380px', lineHeight: '1.5' }}>
          אנו מסנכרנים את נתוני פנימיית צפית ומחברים את המכשיר שלך לענן בזמן אמת.
        </p>
      </div>
    );
  }

  // אם המשתמש אינו מחובר, נציג את דף ההתחברות היוקרתי
  if (!user) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  // אם המשתמש מחובר אך טרם הגדיר שם תצוגה מותאם אישית
  if (user.needsNameSetup) {
    return <NameSetup user={user} onSave={handleUpdateName} />;
  }

  // אם המשתמש מחובר (מדריך) אך טרם הוקצתה לו קבוצת עבודה על ידי המנהל
  if (user.role !== 'admin' && !user.group) {
    return <GroupPending user={user} onLogout={handleLogout} />;
  }

  // אילו טאבים מותר למשתמש הנוכחי בכלל לראות
  const isTabAllowed = (tab) => {
    if (tab === 'staff') return user?.role === 'admin';
    if (tab === 'emergency') return user?.role === 'admin' || emergencyState.active;
    return true;
  };

  // טאב שביקרו בו נשאר מורכב (מוסתר ב-CSS כשלא פעיל) כדי לא לאבד מצב מקומי
  // בכל מעבר - מחושב בזמן רינדור, אותה תבנית שכבר קיימת ב-RollCall (dormSyncKey)
  const desiredVisited = new Set([...visitedTabs, activeTab].filter(isTabAllowed));
  const visitedChanged = desiredVisited.size !== visitedTabs.size ||
    [...desiredVisited].some(t => !visitedTabs.has(t));
  if (visitedChanged) {
    setVisitedTabs(desiredVisited);
  }
  if (!isTabAllowed(activeTab)) {
    setActiveTab('rollcall');
  }

  return (
    <div className="app-container">
      {/* מחוון סנכרון חי לענן (dbOperating) צף ויוקרתי */}
      {dbOperating && (
        <div style={{ 
          position: 'fixed', 
          top: '1.25rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          backgroundColor: '#0f172a', 
          color: 'white', 
          padding: '0.5rem 1.25rem', 
          borderRadius: '30px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', 
          zIndex: 9999, 
          fontSize: '0.82rem', 
          fontWeight: 700, 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.6rem',
          animation: 'pulse 1.2s infinite ease-in-out',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
          <span>מסנכרן שינויים לענן בזמן אמת...</span>
        </div>
      )}

      {/* כותרת עליונה */}
      <Header 
        emergencyActive={emergencyState.active} 
        user={user}
        onLogout={handleLogout}
      />

      {/* באנר רשת: סימונים לא אובדים, אבל המדריך צריך לדעת שהם עוד לא בשרת */}
      {!isOnline && (
        <div className="status-banner status-banner-offline" role="status">
          אין חיבור לאינטרנט. סימונים נשמרים בטלפון ויישלחו כשהחיבור יחזור - אל תתנתק מהמערכת.
        </div>
      )}

      {/* באנר מאזין שנכשל: הנתונים על המסך אולי לא עדכניים */}
      {Object.keys(listenerErrors).length > 0 && (
        <div className="status-banner status-banner-error" role="alert">
          הנתונים לא מתעדכנים: {[...new Set(Object.values(listenerErrors))].join(' ')} רענן את הדף.
        </div>
      )}

      {/* באנר חירום עליון מהבהב במידה וחירום פעיל אך המשתמש בלשונית אחרת */}
      {emergencyState.active && activeTab !== 'emergency' && (
        <div 
          onClick={() => setActiveTab('emergency')}
          style={{ 
            backgroundColor: '#ef4444', 
            color: 'white', 
            textAlign: 'center', 
            padding: '0.75rem 1rem', 
            fontSize: '1rem', 
            fontWeight: 800, 
            cursor: 'pointer',
            animation: 'blink 1.5s infinite',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)'
          }}
        >
          <Flame size={18} />
          <span>מצב חירום מוסדי פעיל! לחץ כאן למעבר מיידי ליומן נוכחות החירום.</span>
        </div>
      )}

      {/* סרגל ניווט תחתון/אמצעי */}
      <nav className="navbar-wrapper">
        <div className="navbar-content">
          <button 
            type="button"
            className={`nav-item ${activeTab === 'rollcall' ? 'active' : ''}`}
            onClick={() => setActiveTab('rollcall')}
          >
            <ClipboardList size={18} />
            <span>רישום נוכחות</span>
          </button>

          <button 
            type="button"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>לוח בקרה ודוחות</span>
          </button>

          <button 
            type="button"
            className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
            onClick={() => setActiveTab('students')}
          >
            <Users size={18} />
            <span>ניהול חניכים</span>
          </button>

          {user?.role === 'admin' && (
            <button 
              type="button"
              className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              <UserCheck size={18} />
              <span>ניהול צוות</span>
            </button>
          )}

          {/* לשונית חירום ייעודית - משנה צבע למהבהב כשיש אירוע */}
          {(user?.role === 'admin' || emergencyState.active) && (
            <button 
              type="button"
              className={`nav-item ${activeTab === 'emergency' ? 'active' : ''}`}
              onClick={() => setActiveTab('emergency')}
              style={emergencyState.active ? { color: '#ef4444', fontWeight: 800 } : {}}
            >
              <AlertTriangle size={18} style={emergencyState.active ? { animation: 'blink 1s infinite' } : {}} />
              <span>{emergencyState.active ? 'דיווח חירום פעיל!' : 'בדיקת חירום'}</span>
            </button>
          )}
        </div>
      </nav>

      {/* אזור תוכן ראשי */}
      <main className="main-content">
        <Suspense fallback={<TabLoadingFallback />}>
          <div style={{ display: activeTab === 'rollcall' ? 'block' : 'none' }}>
            <RollCall
              students={students}
              history={history}
              onUpdateSingleAttendance={handleUpdateSingleAttendance}
              onUpdateAttendanceNote={updateAttendanceNote}
              initialTarget={rollCallTarget}
              clearInitialTarget={clearRollCallTarget}
              user={user}
              groupNames={groupNames}
            />
          </div>
          {desiredVisited.has('dashboard') && (
            <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
              <Dashboard
                students={students}
                history={history}
                onOpenRound={handleOpenRound}
                groupNames={groupNames}
              />
            </div>
          )}
          {desiredVisited.has('students') && (
            <div style={{ display: activeTab === 'students' ? 'block' : 'none' }}>
              <StudentManager
                students={students}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                user={user}
                groupNames={groupNames}
              />
            </div>
          )}
          {desiredVisited.has('staff') && (
            <div style={{ display: activeTab === 'staff' ? 'block' : 'none' }}>
              <StaffManager groupNames={groupNames} />
            </div>
          )}
          {desiredVisited.has('emergency') && (
            <div style={{ display: activeTab === 'emergency' ? 'block' : 'none' }}>
              <EmergencyMode
                students={students}
                emergencyState={emergencyState}
                onSaveEmergencyState={handleSaveEmergencyState}
                onSetEmergencyRecord={handleSetEmergencyRecord}
              />
            </div>
          )}
        </Suspense>
      </main>

      {/* כותרת תחתונה עדינה */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '1.5rem', 
        fontSize: '0.8rem', 
        color: 'var(--text-muted)', 
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'white',
        marginTop: '3rem'
      }}>
        מערכת נוכחות פנימיית צפית © {new Date().getFullYear()} • פותח לטובת צוותי ההדרכה והפנימיות
      </footer>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
