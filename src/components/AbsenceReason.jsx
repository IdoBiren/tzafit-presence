import { useState } from 'react';

// סיבות נפוצות - לחיצה אחת שומרת. "אחר…" פותח טקסט חופשי.
const QUICK_REASONS =['חוג', 'טיפול', 'מרפאה', 'פעילות'];

// שורת סיבה לחניך שסומן "לא נמצא" (בפנימייה, אבל לא בסבב הזה).
// הסיבה רשות. note מגיע מהסבב השמור (מתעדכן מיד גם בלי רשת, בזכות המטמון
// המקומי של Firestore), ו-onSave מטפל בתג השמירה ובהודעת שגיאה.
// onDismiss (רק כשהכרטיס מוחזק במקום): "בלי סיבה" - משחרר את הכרטיס בלי לשמור.
const AbsenceReason = ({ note, onSave, onDismiss }) => {
  const [editing, setEditing] = useState(false);
  const [showOther, setShowOther] = useState(false);
  const [draft, setDraft] = useState('');

  const save = (value) => {
    setEditing(false);
    setShowOther(false);
    // כישלון: חוזרים לעריכה כדי שהמדריך יראה שהסיבה לא נשמרה (ההודעה
    // עצמה מוצגת ע"י onSave)
    onSave(value).catch(() => setEditing(true));
  };

  if (note && !editing) {
    // עטוף ב-div כדי שבטלפון התג יירד לשורה משלו ולא יידחס ליד השם
    return (
      <div className="reason-wrap">
        <button
          type="button"
          className="reason-tag"
          onClick={() => {
            const isQuick = QUICK_REASONS.includes(note);
            setEditing(true);
            setShowOther(!isQuick);
            setDraft(isQuick ? '' : note);
          }}
          title="לחץ לשינוי הסיבה"
        >
          סיבה: {note} ✎
        </button>
      </div>
    );
  }

  return (
    <div className="reason-row" role="group" aria-label="סיבה (רשות)">
      {QUICK_REASONS.map(reason => (
        <button
          key={reason}
          type="button"
          className={`reason-chip ${note === reason ? 'active' : ''}`}
          onClick={() => save(reason)}
        >
          {reason}
        </button>
      ))}
      {showOther ? (
        <input
          type="text"
          className="reason-input"
          value={draft}
          autoFocus
          maxLength={80}
          placeholder="איפה הוא/היא?"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              save(draft);
            } else if (e.key === 'Escape') {
              setShowOther(false);
            }
          }}
          onBlur={() => {
            // יציאה מהשדה שומרת רק אם נכתב משהו חדש - לא מוחקת סיבה קיימת בטעות
            if (draft.trim() && draft.trim() !== note) save(draft);
            else if (!draft.trim()) setShowOther(false);
          }}
        />
      ) : (
        <button type="button" className="reason-chip" onClick={() => { setShowOther(true); setDraft(''); }}>
          אחר…
        </button>
      )}
      {onDismiss && !editing && !note && (
        <button type="button" className="reason-chip ghost" onClick={onDismiss}>
          בלי סיבה
        </button>
      )}
      {editing && (
        <>
          {note && (
            <button type="button" className="reason-chip ghost" onClick={() => save('')}>
              הסר סיבה
            </button>
          )}
          <button type="button" className="reason-chip ghost" onClick={() => { setEditing(false); setShowOther(false); }}>
            ביטול
          </button>
        </>
      )}
    </div>
  );
};

export default AbsenceReason;
