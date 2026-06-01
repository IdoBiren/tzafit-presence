import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  AlertTriangle,
  Flame
} from 'lucide-react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import RollCall from './components/RollCall';
import EmergencyMode from './components/EmergencyMode';
import StudentManager from './components/StudentManager';
import { 
  getStudents, 
  saveStudents, 
  getHistory, 
  saveAttendanceRecord, 
  getEmergencyState, 
  saveEmergencyState 
} from './utils/storage';

function App() {
  const [students, setStudents] = useState([]);
  const [history, setHistory] = useState([]);
  const [emergencyState, setEmergencyState] = useState({ active: false, records: {}, reason: '', triggeredAt: null });
  const [activeTab, setActiveTab] = useState('rollcall');
  const [dormFilter, setDormFilter] = useState('הכל');

  // טעינה ראשונית של כל הנתונים מ-LocalStorage
  useEffect(() => {
    setStudents(getStudents());
    setHistory(getHistory());
    setEmergencyState(getEmergencyState());
  }, []);

  // שמירת רשימת חניכים מעודכנת
  const handleSaveStudents = (updatedList) => {
    saveStudents(updatedList);
    setStudents(updatedList);

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
      saveEmergencyState(newEmergencyState);
      setEmergencyState(newEmergencyState);
    }
  };

  // שמירת סבב נוכחות חדש
  const handleSaveAttendance = (date, session, records, markedBy) => {
    const updatedHistory = saveAttendanceRecord(date, session, records, markedBy);
    setHistory(updatedHistory);
  };

  // שמירה ועדכון מצב חירום
  const handleSaveEmergencyState = (updatedState) => {
    saveEmergencyState(updatedState);
    setEmergencyState(updatedState);
    
    // אם מצב החירום הופעל עכשיו, מעבירים אוטומטית את המשתמש ללשונית חירום
    if (updatedState.active) {
      setActiveTab('emergency');
    } else {
      setActiveTab('dashboard');
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
        return <Dashboard students={students} history={history} onNavigateToTab={setActiveTab} setDormFilter={setDormFilter} />;
    }
  };

  return (
    <div className="app-container">
      {/* כותרת עליונה */}
      <Header 
        emergencyActive={emergencyState.active} 
        onToggleEmergency={handleToggleEmergency} 
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
