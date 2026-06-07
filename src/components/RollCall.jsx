import React, { useState, useEffect } from 'react';
import { Check, X, PlaneTakeoff, Save, Search, User, Filter, AlertTriangle } from 'lucide-react';

const RollCall = ({ students, history, onSaveAttendance, initialDormFilter, clearInitialDormFilter, user }) => {
  const [selectedDorm, setSelectedDorm] = useState('הכל');
  const [searchQuery, setSearchQuery] = useState('');
  const [session, setSession] = useState('evening'); // ברירת מחדל רישום ערב
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedBy, setMarkedBy] = useState(user ? user.displayName : 'מדריך תורן');
  const [tempRecords, setTempRecords] = useState({});

  // עדכון שם המדריך בהתאם למשתמש המחובר
  useEffect(() => {
    if (user && user.displayName) {
      setMarkedBy(user.displayName);
    }
  }, [user]);


  // סנכרון פילטר בית מהדאשבורד במידה והשתמשו בו
  useEffect(() => {
    if (initialDormFilter) {
      setSelectedDorm(initialDormFilter);
      clearInitialDormFilter();
    }
  }, [initialDormFilter]);

  // טעינת רשומת נוכחות קיימת לתאריך ולסשן הנבחרים, או אתחול ברירת מחדל
  useEffect(() => {
    const existingRecord = history.find(h => h.date === date && h.session === session);
    
    const initialRecords = {};
    students.forEach(student => {
      if (existingRecord && existingRecord.records[student.id]) {
        initialRecords[student.id] = existingRecord.records[student.id];
      } else {
        // ללא סימון מראש - על המדריך לסמן כל אחד באופן אקטיבי
        initialRecords[student.id] = null;
      }
    });
    setTempRecords(initialRecords);
  }, [date, session, history, students]);

  const handleStatusChange = (studentId, status) => {
    setTempRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    // בדיקה שכל החניכים סומנו
    const unmarkedStudents = students.filter(s => tempRecords[s.id] === null || tempRecords[s.id] === undefined);
    if (unmarkedStudents.length > 0) {
      alert(`שגיאה: ישנם ${unmarkedStudents.length} חניכים שטרם סומנה נוכחותם! נא לסמן את כל החניכים לפני השמירה.`);
      return;
    }

    onSaveAttendance(date, session, tempRecords, markedBy);
    alert('רישום הנוכחות נשמר בהצלחה ב-LocalStorage!');
  };

  // סינון חניכים לפי בית וחיפוש
  const filteredStudents = students.filter(student => {
    const matchesDorm = selectedDorm === 'הכל' || student.dorm === selectedDorm;
    const matchesSearch = student.name.includes(searchQuery) || student.room.includes(searchQuery);
    return matchesDorm && matchesSearch;
  });

  // סדר לפי חדרים (מהקטן לגדול) לנוחות המדריך בסבב החדרים
  const sortedStudents = [...filteredStudents].sort((a, b) => a.room.localeCompare(b.room));

  // סטטיסטיקות סבב נוכחי למדריך
  const totalCount = sortedStudents.length;
  const presentCount = sortedStudents.filter(s => tempRecords[s.id] === 'present').length;
  const absentCount = sortedStudents.filter(s => tempRecords[s.id] === 'absent').length;
  const leaveCount = sortedStudents.filter(s => tempRecords[s.id] === 'leave').length;
  const markedCount = sortedStudents.filter(s => tempRecords[s.id] !== null && tempRecords[s.id] !== undefined).length;

  const getDormLabelColor = (dorm) => {
    if (dorm === 'פניקס') return '#3b82f6';
    if (dorm === 'קומביין') return '#10b981';
    if (dorm === 'סקויה') return '#d97706';
    return '#8b5cf6'; // סהרה
  };

  return (
    <div className="rollcall-wrapper">
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <form onSubmit={handleSave} className="rollcall-controls">
          <div className="filters-bar" style={{ gap: '1.25rem' }}>
            {/* בחירת תאריך */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>תאריך סבב</label>
              <input 
                type="date" 
                className="text-input" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            {/* בחירת סשן */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>סוג רישום</label>
              <div className="btn-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                <button 
                  type="button" 
                  className={`toggle-btn ${session === 'morning' ? 'active' : ''}`}
                  onClick={() => setSession('morning')}
                  style={{ flex: 1, minWidth: '70px', padding: '0.5rem 0.5rem', fontSize: '0.82rem' }}
                >
                  פתיחת יום
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${session === 'afternoon' ? 'active' : ''}`}
                  onClick={() => setSession('afternoon')}
                  style={{ flex: 1, minWidth: '70px', padding: '0.5rem 0.5rem', fontSize: '0.82rem' }}
                >
                  ארוחת ערב
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${session === 'evening' ? 'active' : ''}`}
                  onClick={() => setSession('evening')}
                  style={{ flex: 1, minWidth: '70px', padding: '0.5rem 0.5rem', fontSize: '0.82rem' }}
                >
                  כיבוי אורות
                </button>
                <button 
                  type="button" 
                  className={`toggle-btn ${session === 'night' ? 'active' : ''}`}
                  onClick={() => setSession('night')}
                  style={{ 
                    flex: 1, 
                    minWidth: '70px', 
                    padding: '0.5rem 0.5rem', 
                    fontSize: '0.82rem',
                    backgroundColor: session === 'night' ? 'var(--accent)' : 'rgba(37, 99, 235, 0.05)',
                    color: session === 'night' ? 'white' : 'var(--accent)',
                    fontWeight: 700
                  }}
                >
                  לילה (אופציונלי)
                </button>
              </div>
            </div>

          </div>

          <div>
            <button type="submit" className="btn-primary">
              <Save size={18} />
              <span>שמור רישום נוכחות</span>
            </button>
          </div>
        </form>
      </div>

      {/* סרגל סינון וחיפוש חניכים */}
      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="rollcall-filter-container" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Filter size={16} />
            <span>סנן לפי קבוצה:</span>
          </span>
          
          {/* Desktop Filter View (Button Group) */}
          <div className="btn-group desktop-only">
            {['הכל', 'פניקס', 'קומביין', 'סקויה', 'סהרה'].map((dorm) => (
              <button 
                key={dorm} 
                type="button" 
                className={`toggle-btn ${selectedDorm === dorm ? 'active' : ''}`}
                onClick={() => setSelectedDorm(dorm)}
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
              >
                {dorm}
              </button>
            ))}
          </div>

          {/* Mobile Filter View (Select Dropdown) */}
          <select
            className="select-input mobile-only"
            value={selectedDorm}
            onChange={(e) => setSelectedDorm(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            <option value="הכל">כל הקבוצות</option>
            <option value="פניקס">פניקס</option>
            <option value="קומביין">קומביין</option>
            <option value="סקויה">סקויה</option>
            <option value="סהרה">סהרה</option>
          </select>
        </div>

        {/* תיבת חיפוש */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
          <input 
            type="text" 
            className="text-input" 
            placeholder="חפש לפי שם או חדר..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingRight: '2.25rem' }}
          />
          <Search size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        </div>
      </div>

      {/* מוני התקדמות של הסינון הנוכחי */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <span>התקדמות סבב: <strong style={{ color: markedCount === totalCount ? 'var(--present)' : 'var(--accent)' }}>{markedCount} מתוך {totalCount} סומנו</strong></span>
        <span>|</span>
        <span style={{ color: 'var(--present)' }}>נוכח: <strong>{presentCount}</strong></span>
        <span>|</span>
        <span style={{ color: 'var(--absent)' }}>לא נוכח: <strong>{absentCount}</strong></span>
        <span>|</span>
        <span style={{ color: 'var(--leave)' }}>בבית: <strong>{leaveCount}</strong></span>
      </div>

      {/* גריד כרטיסי החניכים */}
      {sortedStudents.length > 0 ? (
        <div className="student-grid">
          {sortedStudents.map(student => {
            const currentStatus = tempRecords[student.id] || '';
            return (
              <div key={student.id} className={`card student-card ${currentStatus}`} style={!currentStatus ? { borderRightColor: 'var(--text-muted)' } : {}}>
                <div>
                  <div className="student-info">
                    <div className="student-avatar">
                      {student.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="student-details">
                      <div className="student-name">{student.name}</div>
                      <div className="student-meta-tags">
                        <span className="tag-dorm" style={{ color: getDormLabelColor(student.dorm), backgroundColor: `${getDormLabelColor(student.dorm)}12` }}>
                          {student.dorm}
                        </span>
                        <span className="tag-room">חדר {student.room}</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="attendance-actions">
                  <button 
                    type="button" 
                    className={`action-btn present-btn ${currentStatus === 'present' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.id, 'present')}
                  >
                    <Check size={14} />
                    <span>נוכח</span>
                  </button>
                  <button 
                    type="button" 
                    className={`action-btn absent-btn ${currentStatus === 'absent' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.id, 'absent')}
                  >
                    <X size={14} />
                    <span>חסר</span>
                  </button>
                  <button 
                    type="button" 
                    className={`action-btn leave-btn ${currentStatus === 'leave' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.id, 'leave')}
                  >
                    <PlaneTakeoff size={14} />
                    <span>בבית</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card empty-state">
          <div className="empty-state-icon">
            <User size={24} />
          </div>
          <div className="empty-state-title">לא נמצאו חניכים</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>נסה לשנות את סינון הבית או את תיבת החיפוש.</p>
        </div>
      )}
    </div>
  );
};

export default RollCall;
