import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  AlertTriangle,
  Flame,
  CloudLightning
} from 'lucide-react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import RollCall from './components/RollCall';
import EmergencyMode from './components/EmergencyMode';
import StudentManager from './components/StudentManager';
import Login from './components/Login';
import { 
  subscribeToStudents, 
  saveStudents, 
  subscribeToHistory, 
  saveAttendanceRecord, 
  subscribeToEmergency, 
  saveEmergencyState 
} from './utils/storage';
import { auth, isFirebaseConfigured } from './utils/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

function App() {
  const [user, setUser] = useState(null);
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [emergencyState, setEmergencyState] = useState({ active: false, records: {}, reason: '', triggeredAt: null });
  const [activeTab, setActiveTab] = useState('rollcall');
  const [dormFilter, setDormFilter] = useState('הכל');
  
  // מחווני טעינה וסנכרון לענן
  const [loading, setLoading] = useState(true);
  const [dbOperating, setDbOperating] = useState(false);

  // חיבור מאזינים בזמן אמת (Realtime Subscriptions) מול ענן Firebase או LocalStorage
  useEffect(() => {
    let unsubscribeStudents = () => {};
    let unsubscribeHistory = () => {};
    let unsubscribeEmergency = () => {};

    const startSubscriptions = () => {
      // 1. האזנה לחניכים
      unsubscribeStudents = subscribeToStudents((updatedStudents) => {
        setStudents(updatedStudents);
      });

      // 2. האזנה להיסטוריית נוכחות
      unsubscribeHistory = subscribeToHistory((updatedHistory) => {
        setHistory(updatedHistory);
      });

      // 3. האזנה למצב חירום גלובלי
      unsubscribeEmergency = subscribeToEmergency((updatedEmergency) => {
        setEmergencyState(updatedEmergency);
        setLoading(false); // הפסקת מסך הטעינה הראשוני ברגע שהנתונים מגיעים
      });
    };

    if (isFirebaseConfigured) {
      // האזנה למצב התחברות של Firebase Auth
      const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'מדריך צפית',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL || '',
            isDemo: false
          });
          startSubscriptions();
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
      };
    } else {
      // מצב דמו / LocalStorage
      const cachedDemoUser = sessionStorage.getItem('tzafit_demo_user');
      if (cachedDemoUser) {
        setUser(JSON.parse(cachedDemoUser));
        startSubscriptions();
      } else {
        setUser(null);
        setLoading(false);
      }

      return () => {
        unsubscribeStudents();
        unsubscribeHistory();
        unsubscribeEmergency();
      };
    }
  }, [user?.uid]);

  // שמירת רשימת חניכים מעודכנת בענן
  const handleSaveStudents = async (updatedList) => {
    setDbOperating(true);
    try {
      await saveStudents(updatedList);
      
      // אם אנחנו באמצע מצב חירום, נוסיף מזהים חדשים לרשומת החירום כ"טרם אומת"
      if (emergencyState.active) {
        const updatedEmergencyRecords = { ...emergencyState.records };
        updatedList.forEach(s => {
          if (updatedEmergencyRecords[s.id] === undefined) {
            updatedEmergencyRecords[s.id] = false;
          }
        });
        // הסרת חניכים שנמחקו
        Object.keys(updatedEmergencyRecords).forEach(id => {
          if (!updatedList.some(s => s.id === id)) {
            delete updatedEmergencyRecords[id];
          }
        });
        const newEmergencyState = { ...emergencyState, records: updatedEmergencyRecords };
        await saveEmergencyState(newEmergencyState);
      }
    } catch (error) {
      alert("שגיאה בסנכרון השינויים לענן. השינויים יישמרו מקומית.");
    } finally {
      setDbOperating(false);
    }
  };

  // שמירת סבב נוכחות חדש בענן
  const handleSaveAttendance = async (date, session, records, markedBy) => {
    setDbOperating(true);
    try {
      await saveAttendanceRecord(date, session, records, markedBy);
      alert('רישום הנוכחות נשמר וסונכרן בהצלחה בענן!');
    } catch (error) {
      alert("שגיאה בשמירת סבב הנוכחות לענן. בדוק את החיבור לרשת.");
    } finally {
      setDbOperating(false);
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
      alert("שגיאה בעדכון מצב החירום בענן.");
    } finally {
      setDbOperating(false);
    }
  };

  // שליטה על כפתור החירום העליון בכותרת
  const handleToggleEmergency = () => {
    if (emergencyState.active) {
      // ביטול
      if (window.confirm('האם ברצונך לבטל את מצב החירום ולחזור לשגרה?')) {
        handleSaveEmergencyState({
          active: false,
          triggeredAt: null,
          reason: '',
          records: {}
        });
      }
    } else {
      // מעבר ללשונית חירום להפעלה
      setActiveTab('emergency');
    }
  };

  const clearInitialDormFilter = () => {
    setDormFilter('הכל');
  };

  // טיפול בהתחברות מוצלחת
  const handleLoginSuccess = (loggedInUser) => {
    if (loggedInUser.isDemo) {
      sessionStorage.setItem('tzafit_demo_user', JSON.stringify(loggedInUser));
    }
    setUser(loggedInUser);
  };

  // התנתקות מהמערכת
  const handleLogout = async () => {
    if (window.confirm('האם אתה בטוח שברצונך להתנתק?')) {
      if (isFirebaseConfigured) {
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
    }
  };

  // רינדור התוכן הדינמי בהתאם ללשונית שנבחרה
  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            students={students} 
            history={history} 
            onNavigateToTab={setActiveTab} 
            setDormFilter={setDormFilter} 
          />
        );
      case 'rollcall':
        return (
          <RollCall 
            students={students} 
            history={history} 
            onSaveAttendance={handleSaveAttendance} 
            initialDormFilter={dormFilter}
            clearInitialDormFilter={clearInitialDormFilter}
            user={user}
          />
        );
      case 'emergency':
        return (
          <EmergencyMode 
            students={students} 
            history={history}
            emergencyState={emergencyState} 
            onSaveEmergencyState={handleSaveEmergencyState} 
          />
        );
      case 'students':
        return (
          <StudentManager 
            students={students} 
            onSaveStudents={handleSaveStudents} 
          />
        );
      default:
        return <RollCall students={students} history={history} onSaveAttendance={handleSaveAttendance} initialDormFilter={dormFilter} clearInitialDormFilter={clearInitialDormFilter} user={user} />;
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
        onToggleEmergency={handleToggleEmergency} 
        user={user}
        onLogout={handleLogout}
      />

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

          {/* לשונית חירום ייעודית - משנה צבע למהבהב כשיש אירוע */}
          <button 
            type="button"
            className={`nav-item ${activeTab === 'emergency' ? 'active' : ''}`}
            onClick={() => setActiveTab('emergency')}
            style={emergencyState.active ? { color: '#ef4444', fontWeight: 800 } : {}}
          >
            <AlertTriangle size={18} style={emergencyState.active ? { animation: 'blink 1s infinite' } : {}} />
            <span>{emergencyState.active ? 'דיווח חירום פעיל!' : 'בדיקת חירום'}</span>
          </button>
        </div>
      </nav>

      {/* אזור תוכן ראשי */}
      <main className="main-content">
        {renderTabContent()}
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

export default App;
