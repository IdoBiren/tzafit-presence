import React, { useState } from 'react';
import { AlertOctagon, ShieldCheck, ShieldAlert, Undo, Flame, BellRing } from 'lucide-react';

const EmergencyMode = ({ students, history, emergencyState, onSaveEmergencyState }) => {
  const [reasonInput, setReasonInput] = useState('');

  // הפעלת מצב חירום (במידה ולא פעיל עדיין)
  const handleStartEmergency = (e) => {
    e.preventDefault();
    const latestRecord = history && history.length > 0 ? history[0] : null;
    const initialRecords = {};
    
    students.forEach(s => {
      if (latestRecord) {
        // רשום רק את מי שהיה נוכח בסבב האחרון
        if (latestRecord.records[s.id] === 'present') {
          initialRecords[s.id] = false; // טרם אומת
        }
      } else {
        // ברירת מחדל אם אין היסטוריה
        initialRecords[s.id] = false;
      }
    });

    onSaveEmergencyState({
      active: true,
      triggeredAt: new Date().toISOString(),
      reason: reasonInput || 'בדיקת נוכחות חירום כללית',
      records: initialRecords
    });
  };

  // סימון חניך כבטוח
  const handleMarkSafe = (studentId) => {
    const updatedRecords = { ...emergencyState.records, [studentId]: true };
    onSaveEmergencyState({
      ...emergencyState,
      records: updatedRecords
    });
  };

  // ביטול סימון בטוח (החזרה לטרם אומת)
  const handleMarkUnsafe = (studentId) => {
    const updatedRecords = { ...emergencyState.records, [studentId]: false };
    onSaveEmergencyState({
      ...emergencyState,
      records: updatedRecords
    });
  };

  // ביטול מוחלט של החירום
  const handleEndEmergency = () => {
    if (window.confirm('האם אתה בטוח שברצונך לסיים את אירוע החירום ולחזור לשגרה?')) {
      onSaveEmergencyState({
        active: false,
        triggeredAt: null,
        reason: '',
        records: {}
      });
    }
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

        <form onSubmit={handleStartEmergency}>
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
      </div>
    );
  }

  // סינון חניכים לפי בטוחים / טרם אומתו (לפי אלו שנכללים ביומן החירום)
  const unaccountedStudents = students.filter(s => emergencyState.records[s.id] === false);
  const safeStudents = students.filter(s => emergencyState.records[s.id] === true);

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
        
        {/* באנר הסבר על סינון נוכחות אחרונה */}
        {(() => {
          const latestRecord = history && history.length > 0 ? history[0] : null;
          let sessionName = '';
          if (latestRecord) {
            if (latestRecord.session === 'morning') sessionName = 'רישום פתיחת יום';
            else if (latestRecord.session === 'afternoon') sessionName = 'רישום ארוחת ערב';
            else if (latestRecord.session === 'evening') sessionName = 'רישום כיבוי אורות';
            else if (latestRecord.session === 'night') sessionName = 'רישום לילה';
          }
          const recordDate = latestRecord ? latestRecord.date.split('-').reverse().join('/') : '';
          
          return (
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
              {latestRecord ? (
                <span>בדיקת החירום מתבצעת עבור <strong>{totalStudentsCount} חניכים</strong> שהיו נוכחים ב<strong>{sessionName}</strong> מתאריך {recordDate}.</span>
              ) : (
                <span>בדיקת החירום מתבצעת עבור כלל חניכי הפנימייה (לא נמצא סבב נוכחות קודם).</span>
              )}
            </div>
          );
        })()}

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
    </div>
  );
};

export default EmergencyMode;
