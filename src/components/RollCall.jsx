import { useState, useEffect, useRef } from 'react';
import { Check, X, Home, Search, User, Filter, MapPinOff } from 'lucide-react';
import { useToast } from './ToastProvider';
import { getDormColor } from '../utils/dormColors';
import { getHistoryCutoffDate } from '../utils/storage';
import { todayLocalISO } from '../utils/attendanceStats';
import { describeSaveError, withPendingTimeout } from '../utils/saveErrors';
import AbsenceReason from './AbsenceReason';

const RollCall = ({ students, history, onUpdateSingleAttendance, onUpdateAttendanceNote, initialTarget, clearInitialTarget, user, groupNames }) => {
  const { showToast } = useToast();
  const [selectedDorm, setSelectedDorm] = useState(() => {
    if (initialTarget?.dorm) {
      return initialTarget.dorm;
    }
    if (user && user.group && user.group !== 'כללי') {
      return user.group;
    }
    return 'הכל';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('unmarked');
  const [session, setSession] = useState(initialTarget?.session || 'evening'); // ברירת מחדל רישום ערב
  // תאריך מקומי ולא toISOString(): ב-UTC, בין חצות ל-3:00 יוצא התאריך של אתמול
  const [date, setDate] = useState(initialTarget?.date || todayLocalISO());
  // שם המדריך נגזר ישירות מהמשתמש המחובר - אין קלט ידני לעריכתו (הוסר בעבר),
  // ולכן אין צורך במצב מקומי או ב-effect בשביל זה, רק בערך נגזר.
  const markedBy = user?.displayName || 'מדריך תורן';
  const [tempRecords, setTempRecords] = useState({});
  const [studentSaveStatus, setStudentSaveStatus] = useState({}); // id -> 'saving' | 'pending' | 'error'
  // מספר סידורי של הכתיבה האחרונה לכל חניך: כשמדריך לוחץ שוב לפני שהכתיבה
  // הקודמת הסתיימה, רק תוצאת הכתיבה האחרונה קובעת את התג ואת הסימון
  const latestWriteRef = useRef({});

  // בחירת קבוצת המדריך כברירת מחדל, ומעבר לתצוגת הכל אם הקבוצה שנבחרה
  // שונה שם. מתעדכן בזמן רינדור (ולא ב-effect) כשאחד הערכים משתנה, כדי
  // ש-selectedDorm יתעדכן באותו רינדור בלי הבזק של הערך הקודם - ראו:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const dormSyncKey = `${user?.group || ''}|${(groupNames || []).join(',')}`;
  const [appliedDormSyncKey, setAppliedDormSyncKey] = useState(dormSyncKey);
  if (dormSyncKey !== appliedDormSyncKey) {
    setAppliedDormSyncKey(dormSyncKey);
    if (user && user.group && user.group !== 'כללי') {
      setSelectedDorm(user.group);
    } else if (selectedDorm !== 'הכל' && groupNames && groupNames.length && !groupNames.includes(selectedDorm)) {
      // הקבוצה שנבחרה כבר לא קיימת (שונה שם שלה) - חוזרים לתצוגת הכל
      // במקום להישאר על מסך ריק בשקט.
      setSelectedDorm('הכל');
    }
  }

  // מעבר מלוח הבקרה לסבב מסוים: קבוצה, תאריך וסבב. נבדק לפי זהות האובייקט,
  // כך שכשההורה מנקה את היעד (null) הבחירה של המשתמש לא נדרסת.
  const [appliedTarget, setAppliedTarget] = useState(initialTarget);
  if (initialTarget && initialTarget !== appliedTarget) {
    setAppliedTarget(initialTarget);
    if (initialTarget.dorm) setSelectedDorm(initialTarget.dorm);
    if (initialTarget.date) setDate(initialTarget.date);
    if (initialTarget.session) setSession(initialTarget.session);
  }

  // הודעה ללוח הבקרה שהיעד נצרך - קריאה להורה, לא state מקומי, ולכן
  // חייבת להישאר ב-effect אמיתי.
  useEffect(() => {
    if (initialTarget) {
      clearInitialTarget();
    }
  }, [initialTarget, clearInitialTarget]);

  // טעינת רשומת נוכחות קיימת לתאריך ולסשן הנבחרים, או אתחול ברירת מחדל.
  // זו טעינת נתונים חיצוניים (רשומה שמורה) לתוך עותק מקומי הניתן לעריכה -
  // סנכרון עם מקור חיצוני, לא state נגזר טהור, ולכן ה-effect עצמו נכון כאן.
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTempRecords(initialRecords);
  }, [date, session, history, students]);

  const handleStatusChange = async (studentId, status) => {
    // אם לוחצים שוב על אותו כפתור מסומן - מורידים את הסימון (מחזירים ל-null)
    const currentStatus = tempRecords[studentId];
    const newStatus = currentStatus === status ? null : status;

    setTempRecords(prev => ({ ...prev, [studentId]: newStatus })); // סימון אופטימי, updater טהור
    setStudentSaveStatus(prev => ({ ...prev, [studentId]: 'saving' }));

    if (!onUpdateSingleAttendance) return;

    const writeId = (latestWriteRef.current[studentId] || 0) + 1;
    latestWriteRef.current[studentId] = writeId;
    const isLatest = () => latestWriteRef.current[studentId] === writeId;

    try {
      // בלי קליטה Firestore לא נכשל אלא ממתין - אחרי כמה שניות מחליפים את
      // ⋯ בתג בולט "ממתין לרשת", כדי שאף אחד לא יניח שהסימון כבר בשרת
      await withPendingTimeout(
        onUpdateSingleAttendance(date, session, studentId, newStatus, markedBy),
        () => {
          if (isLatest()) setStudentSaveStatus(prev => ({ ...prev, [studentId]: 'pending' }));
        }
      );
      if (!isLatest()) return;
      setStudentSaveStatus(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } catch (error) {
      if (!isLatest()) return;
      setStudentSaveStatus(prev => ({ ...prev, [studentId]: 'error' }));
      setTempRecords(prev => ({ ...prev, [studentId]: currentStatus })); // ביטול הסימון האופטימי
      const student = students.find(s => s.id === studentId);
      showToast(`שמירת הנוכחות של ${student?.name || 'חניך'} נכשלה: ${describeSaveError(error)}`, 'error', 8000);
    }
  };


  // סיבות "לא נמצא" של הסבב המוצג, ישירות מהסבב השמור (מתעדכן מיד גם בלי
  // רשת בזכות המטמון המקומי)
  const roundNotes = history.find(h => h.date === date && h.session === session)?.notes || {};

  // שמירת סיבה - אותו מנגנון תגים כמו סימון נוכחות (שומר / ממתין לרשת /
  // שגיאה), כדי שגם סיבה לא תיכשל בשקט. זורק הלאה כדי ש-AbsenceReason
  // יחזור למצב עריכה.
  const handleNoteSave = async (studentId, note) => {
    const writeId = (latestWriteRef.current[studentId] || 0) + 1;
    latestWriteRef.current[studentId] = writeId;
    const isLatest = () => latestWriteRef.current[studentId] === writeId;
    setStudentSaveStatus(prev => ({ ...prev, [studentId]: 'saving' }));

    try {
      await withPendingTimeout(
        onUpdateAttendanceNote(date, session, studentId, note),
        () => {
          if (isLatest()) setStudentSaveStatus(prev => ({ ...prev, [studentId]: 'pending' }));
        }
      );
      if (!isLatest()) return;
      setStudentSaveStatus(prev => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
    } catch (error) {
      if (isLatest()) setStudentSaveStatus(prev => ({ ...prev, [studentId]: 'error' }));
      const student = students.find(s => s.id === studentId);
      showToast(`שמירת הסיבה של ${student?.name || 'חניך'} נכשלה: ${describeSaveError(error)}`, 'error', 8000);
      throw error;
    }
  };

  // סינון חניכים לפי בית וחיפוש
  const filteredStudents = students.filter(student => {
    const matchesDorm = selectedDorm === 'הכל' || student.dorm === selectedDorm;
    const matchesSearch = student.name.includes(searchQuery) || student.room.includes(searchQuery);
    return matchesDorm && matchesSearch;
  });

  // סדר חניכים בהתאם לאפשרות המיון שנבחרה (ברירת מחדל: טרם סומנו)
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'unmarked') {
      const aMarked = tempRecords[a.id] !== null && tempRecords[a.id] !== undefined;
      const bMarked = tempRecords[b.id] !== null && tempRecords[b.id] !== undefined;
      
      // מי שלא סומן מופיע ראשון
      if (aMarked && !bMarked) return 1;
      if (!aMarked && bMarked) return -1;
      
      // מיון משני לפי חדר
      return a.room.localeCompare(b.room);
    }
    
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'he');
    }
    
    // ברירת מחדל: לפי חדרים
    return a.room.localeCompare(b.room);
  });

  // סטטיסטיקות סבב נוכחי למדריך
  const totalCount = sortedStudents.length;
  const presentCount = sortedStudents.filter(s => tempRecords[s.id] === 'present').length;
  const absentCount = sortedStudents.filter(s => tempRecords[s.id] === 'absent').length;
  const leaveCount = sortedStudents.filter(s => tempRecords[s.id] === 'leave').length;
  const pendingCount = Object.values(studentSaveStatus).filter(st => st === 'pending').length;
  const markedCount = sortedStudents.filter(s => tempRecords[s.id] !== null && tempRecords[s.id] !== undefined).length;

  return (
    <div className="rollcall-wrapper">
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="rollcall-controls">
          <div className="filters-bar" style={{ gap: '1.25rem' }}>
            {/* בחירת תאריך */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>תאריך סבב</label>
              <input 
                type="date" 
                className="text-input" 
                value={date} 
                min={getHistoryCutoffDate()}
                onChange={(e) => setDate(e.target.value)} 
                required 
              />
            </div>

            {/* בחירת סשן */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>סוג רישום</label>
              <div className="btn-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  className={`toggle-btn ${session === 'morning' ? 'active' : ''}`}
                  onClick={() => setSession('morning')}
                  style={{ flex: 1, minWidth: '70px', minHeight: '44px', padding: '0.65rem 0.6rem', fontSize: '0.82rem' }}
                >
                  פתיחת יום
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${session === 'afternoon' ? 'active' : ''}`}
                  onClick={() => setSession('afternoon')}
                  style={{ flex: 1, minWidth: '70px', minHeight: '44px', padding: '0.65rem 0.6rem', fontSize: '0.82rem' }}
                >
                  ארוחת ערב
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${session === 'evening' ? 'active' : ''}`}
                  onClick={() => setSession('evening')}
                  style={{ flex: 1, minWidth: '70px', minHeight: '44px', padding: '0.65rem 0.6rem', fontSize: '0.82rem' }}
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
                    minHeight: '44px',
                    padding: '0.65rem 0.6rem',
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
        </div>
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
            {['הכל', ...(groupNames || [])].map((dorm) => (
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
            {(groupNames || []).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* מיון חניכים */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span>מיין לפי:</span>
          </span>
          <select
            className="select-input"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white', cursor: 'pointer' }}
          >
            <option value="unmarked">טרם סומנו (ראשונים)</option>
            <option value="name">שם מלא (א-ב)</option>
            <option value="room">מספר חדר</option>
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
            style={{ width: '100%', paddingRight: '2.25rem', paddingLeft: searchQuery ? '2rem' : undefined }}
          />
          <Search size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="נקה חיפוש"
              style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.25rem' }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* מוני התקדמות של הסינון הנוכחי */}
      <div className="rollcall-progress-sticky">
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          <span>התקדמות סבב: <strong style={{ color: markedCount === totalCount ? 'var(--present)' : 'var(--accent)' }}>{markedCount} מתוך {totalCount} סומנו</strong></span>
          <span>|</span>
          <span style={{ color: 'var(--present)' }}>נוכח: <strong>{presentCount}</strong></span>
          <span>|</span>
          <span style={{ color: 'var(--notfound)' }}>לא נמצאו: <strong>{absentCount}</strong></span>
          <span>|</span>
          <span style={{ color: 'var(--leave)' }}>בבית: <strong>{leaveCount}</strong></span>
        </div>
        {pendingCount > 0 && (
          <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#b45309' }}>
            {pendingCount} סימונים ממתינים לרשת - הם שמורים בטלפון ויישלחו כשהחיבור יחזור.
          </div>
        )}
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
                      <div className="student-name">
                        {student.name}
                        {studentSaveStatus[student.id] === 'saving' && (
                          <span className="save-badge saving" title="שומר...">⋯</span>
                        )}
                        {studentSaveStatus[student.id] === 'pending' && (
                          <span className="save-badge pending" title="הסימון שמור בטלפון וממתין לחיבור">ממתין לרשת</span>
                        )}
                        {studentSaveStatus[student.id] === 'error' && (
                          <span className="save-badge error" title="השמירה נכשלה - לחץ שוב">⚠</span>
                        )}
                      </div>
                      <div className="student-meta-tags">
                        <span className="tag-dorm" style={{ color: getDormColor(student.dorm, groupNames), backgroundColor: `${getDormColor(student.dorm, groupNames)}12` }}>
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
                    {/* בטלפון מוצג רק האייקון - ✕ נראה כמו "נעדר", וזה לא המצב */}
                    <MapPinOff size={14} />
                    <span>לא נמצא</span>
                  </button>
                  <button 
                    type="button" 
                    className={`action-btn leave-btn ${currentStatus === 'leave' ? 'active' : ''}`}
                    onClick={() => handleStatusChange(student.id, 'leave')}
                  >
                    <Home size={14} />
                    <span>בבית</span>
                  </button>
                </div>

                {/* "לא נמצא" = בפנימייה אבל לא בסבב; הסיבה (חוג, טיפול...) רשות */}
                {currentStatus === 'absent' && (
                  <AbsenceReason
                    note={roundNotes[student.id]}
                    onSave={(note) => handleNoteSave(student.id, note)}
                  />
                )}
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
