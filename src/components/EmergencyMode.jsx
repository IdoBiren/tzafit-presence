import { useState } from 'react';
import { AlertOctagon, ShieldCheck, ShieldAlert, Undo, Flame, BellRing, Search, X } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const EmergencyMode = ({ students, emergencyState, onSaveEmergencyState, onSetEmergencyRecord }) => {
  const [reasonInput, setReasonInput] = useState('');
  const [pendingStart, setPendingStart] = useState(false);
  const [pendingEnd, setPendingEnd] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // הפעלת מצב חירום - כל חניך רשום נכנס לרשימה כ"טרם אומת", בלי קשר לסבב
  // הנוכחות האחרון. חניך שסומן "בבית"/"חסר" בטעות או חזר לקמפוס, וגם חניך
  // שלא סומן כלל, חייבים להיות במעקב במפקד חירום אמיתי.
  const handleStartEmergency = () => {
    const initialRecords = {};
    students.forEach(s => {
      initialRecords[s.id] = false; // טרם אומת
    });

    onSaveEmergencyState({
      active: true,
      triggeredAt: new Date().toISOString(),
      reason: reasonInput || 'בדיקת נוכחות חירום כללית',
      records: initialRecords
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setPendingStart(true);
  };

  const confirmStart = () => {
    setPendingStart(false);
    handleStartEmergency();
  };

  // סימון חניך כבטוח - נכתב רק השדה של החניך, כדי לא לדרוס סימונים
  // שמדריכים אחרים ביצעו באותו רגע
  const handleMarkSafe = (studentId) => {
    onSetEmergencyRecord(studentId, true);
  };

  // ביטול סימון בטוח (החזרה לטרם אומת)
  const handleMarkUnsafe = (studentId) => {
    onSetEmergencyRecord(studentId, false);
  };

  // ביטול מוחלט של החירום
  const handleEndEmergency = () => {
    setPendingEnd(true);
  };

  const confirmEnd = () => {
    setPendingEnd(false);
    onSaveEmergencyState({
      active: false,
      triggeredAt: null,
      reason: '',
      records: {}
    });
  };

  // אם החירום אינו פעיל, מציגים פנל להפעלה שלו
  if (!emergencyState.active) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: 'var(--absent)', 
            width: '72px', 
            height: '72px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '1rem',
            animation: 'pulse 2s infinite'
          }}>
            <AlertOctagon size={36} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.5rem', color: 'var(--primary)' }}>
            הפעלת מצב חירום מוסדי
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
            הפעלת מצב חירום תחליף באופן מיידי את מסך הבית של כלל המדריכים לרשימת בדיקה מהירה.
            כל אנשי הצוות יוכלו לסמן בזמן אמת חניכים שנמצאו בריאים ושלמים.
          </p>
        </div>

        <form onSubmit={handleFormSubmit}>
          <div className="form-group">
            <label htmlFor="reason">סיבת הפעלת החירום</label>
            <input
              id="reason"
              type="text"
              className="text-input"
              placeholder="לדוגמה: תרגיל פנימייתי, אזעקה, הפסקת חשמל ממושכת..."
              value={reasonInput}
              onChange={(e) => setReasonInput(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', backgroundColor: 'var(--absent)', display: 'flex', justifyContent: 'center', gap: '0.5rem', padding: '0.9rem', fontSize: '1.05rem' }}
          >
            <Flame size={20} />
            <span>שדרג למצב חירום עכשיו!</span>
          </button>
        </form>

        <ConfirmModal
          open={pendingStart}
          title="הפעלת מצב חירום מוסדי"
          message={`מסך הבית של כלל המדריכים יוחלף מיידית ברשימת בדיקה. סיבה: "${reasonInput || 'בדיקת נוכחות חירום כללית'}". להמשיך?`}
          confirmLabel="הפעל חירום עכשיו"
          danger
          onConfirm={confirmStart}
          onCancel={() => setPendingStart(false)}
        />
      </div>
    );
  }

  // סינון חניכים לפי בטוחים / טרם אומתו (לפי אלו שנכללים ביומן החירום), ולפי חיפוש
  const matchesSearch = (s) => s.name.includes(searchQuery) || s.room.includes(searchQuery);
  const unaccountedStudents = students.filter(s => emergencyState.records[s.id] === false && matchesSearch(s));
  const safeStudents = students.filter(s => emergencyState.records[s.id] === true && matchesSearch(s));

  // חשוב: הספירה הכוללת והאחוז נשארים על כל הרשימה, לא רק על התוצאות המסוננות
  const totalStudentsCount = Object.keys(emergencyState.records).length;
  const safeStudentsCount = safeStudents.length;
  const safePercentage = totalStudentsCount > 0 ? Math.round((safeStudentsCount / totalStudentsCount) * 100) : 0;

  return (
    <div className="emergency-layout">
      {/* תיבת התראה עליונה */}
      <div className="emergency-header">
        <h2>
          <BellRing size={24} className="active" style={{ animation: 'blink 1s infinite' }} />
          <span>מצב חירום מוסדי פעיל!</span>
        </h2>
        <p>סיבת האירוע: <strong>{emergencyState.reason}</strong></p>
        
        {/* באנר הסבר - היקף בדיקת החירום */}
        <div style={{
          fontSize: '0.85rem',
          opacity: 0.95,
          marginTop: '0.5rem',
          backgroundColor: 'rgba(255,255,255,0.15)',
          padding: '0.4rem 1rem',
          borderRadius: '6px',
          fontWeight: 500,
          display: 'inline-block',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span>בדיקת החירום מתבצעת עבור <strong>כלל {totalStudentsCount} חניכי הפנימייה</strong> הרשומים כעת במערכת.</span>
        </div>

        <span style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', marginTop: '0.5rem' }}>
          הופעל בתאריך: {new Date(emergencyState.triggeredAt).toLocaleString('he-IL')}
        </span>
      </div>

      {/* מד התקדמות אחוז בטוחים */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', fontWeight: 800, flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ color: 'var(--primary)' }}>אחוז חניכים שאומתו כבטוחים:</span>
          <span style={{ fontSize: '1.25rem', color: safePercentage === 100 ? 'var(--present)' : 'var(--absent)' }}>
            {safePercentage}% ({safeStudentsCount} מתוך {totalStudentsCount})
          </span>
        </div>
        <div style={{ backgroundColor: 'var(--border-color)', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
          <div style={{ 
            backgroundColor: safePercentage === 100 ? 'var(--present)' : '#ef4444', 
            height: '100%', 
            width: `${safePercentage}%`, 
            transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}></div>
        </div>
        
        {safePercentage === 100 && (
          <div style={{ 
            marginTop: '1rem', 
            backgroundColor: 'var(--present-bg)', 
            border: '1px solid var(--present-border)', 
            padding: '0.75rem', 
            borderRadius: 'var(--radius-sm)', 
            color: 'var(--present)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} />
            <span>כל החניכים אומתו ונמצאו בטוחים! שגיאה / סיום האירוע אפשרי כעת.</span>
          </div>
        )}
      </div>

      {/* חיפוש חניך ספציפי - חשוב במיוחד כשהרשימה ארוכה */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '320px', margin: '1rem 0' }}>
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

      {/* טורים מפוצלים: בטוחים מול טרם אומתו */}
      <div className="emergency-columns">
        {/* טור ימין: טרם אומתו (הכי חשוב!) */}
        <div className="emergency-column">
          <div className="emergency-col-title red">
            <span>טרם אומתו ({unaccountedStudents.length})</span>
            <ShieldAlert size={18} />
          </div>
          
          <div className="emergency-list">
            {unaccountedStudents.length > 0 ? (
              unaccountedStudents.map(student => (
                <div key={student.id} className="emergency-item unaccounted">
                  <div>
                    <div className="emergency-item-name">{student.name}</div>
                    <div className="emergency-item-meta">
                      {student.dorm} • חדר {student.room}
                      {student.parentPhone && ` • טלפון הורה: ${student.parentPhone}`}
                    </div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-safe-action"
                    onClick={() => handleMarkSafe(student.id)}
                  >
                    סמן כבטוח
                  </button>
                </div>
              ))
            ) : (
              <div className="card empty-state" style={{ backgroundColor: 'var(--present-bg)', borderColor: 'var(--present-border)' }}>
                <div className="empty-state-icon" style={{ backgroundColor: '#ccfbf1', color: 'var(--present)' }}>
                  <ShieldCheck size={24} />
                </div>
                <div className="empty-state-title" style={{ color: 'var(--present)' }}>אין חניכים חסרים!</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>כל חניכי הפנימייה אומתו כבטוחים ושלמים.</p>
              </div>
            )}
          </div>
        </div>

        {/* טור שמאל: אומתו בהצלחה */}
        <div className="emergency-column">
          <div className="emergency-col-title green">
            <span>אומתו ובטוחים ({safeStudents.length})</span>
            <ShieldCheck size={18} />
          </div>

          <div className="emergency-list">
            {safeStudents.length > 0 ? (
              safeStudents.map(student => (
                <div key={student.id} className="emergency-item safe">
                  <div>
                    <div className="emergency-item-name">{student.name}</div>
                    <div className="emergency-item-meta">{student.dorm} • חדר {student.room}</div>
                  </div>
                  <button 
                    type="button" 
                    className="btn-undo-action"
                    onClick={() => handleMarkUnsafe(student.id)}
                    title="החזר לרשימת הלא-מאומתים במידה וסומן בטעות"
                  >
                    <Undo size={14} style={{ marginLeft: '0.25rem' }} />
                    ביטול
                  </button>
                </div>
              ))
            ) : (
              <div className="card empty-state">
                <div className="empty-state-icon">
                  <AlertOctagon size={24} />
                </div>
                <div className="empty-state-title">טרם אומתו חניכים</div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>התחל לסמן חניכים ברשימה הנגדית כדי להעבירם לכאן.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* סגירת חירום ושחרור המערכת */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button 
          type="button" 
          className="btn-secondary"
          onClick={handleEndEmergency}
          style={{ borderColor: '#ef4444', color: '#ef4444', fontWeight: 700 }}
        >
          סיום אירוע חירום והחזרת המערכת לשגרה
        </button>
      </div>

      <ConfirmModal
        open={pendingEnd}
        title="סיום אירוע חירום"
        message="האם אתה בטוח שברצונך לסיים את אירוע החירום ולחזור לשגרה?"
        confirmLabel="סיים אירוע"
        danger
        onConfirm={confirmEnd}
        onCancel={() => setPendingEnd(false)}
      />
    </div>
  );
};

export default EmergencyMode;
