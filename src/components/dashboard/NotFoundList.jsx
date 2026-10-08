import { MapPinOff, Phone } from 'lucide-react';
import { SESSION_LABELS, formatShortDate, weekdayLetter } from '../../utils/attendanceStats';

const TITLES = {
  day: 'לא נמצאו בסבבים היום',
  week: 'לא נמצאו בסבבים השבוע',
  month: 'לא נמצאו בסבבים החודש'
};

// טלפון אמיתי בלבד - "צריך להוסיף" ושדות ריקים לא מקבלים כפתור חיוג
const hasPhone = (phone) => !!phone && /\d{3,}/.test(phone);

// "לא נמצא" = בפנימייה אבל לא בסבב (חוג, טיפול). זו רשימת מידע, לא רשימת
// היעדרויות - לכן בלי אדום. מה שכדאי לברר הוא "בלי סיבה", שמודגש בנפרד.
const NotFoundList = ({ students, period }) => (
  <div className="card">
    <h3 className="dash-section-title" style={{ color: 'var(--notfound)' }}>
      <MapPinOff size={18} />
      <span>{TITLES[period]}</span>
    </h3>
    <p className="dash-muted">חניכים שהיו בפנימייה אבל לא בסבב, ואיפה הם היו לפי מה שנכתב.</p>

    {students.length === 0 ? (
      <p className="dash-muted" style={{ padding: '1rem 0', textAlign: 'center' }}>
        אף חניך לא סומן "לא נמצא" בתקופה הזו.
      </p>
    ) : (
      <ul className="ra-list">
        {students.map(s => (
          <li key={s.id} className="ra-item">
            <div className="ra-main">
              <span className="ra-name">{s.name}</span>
              <span className="ra-meta">
                {s.dorm}
                {period === 'day'
                  ? ` · ${s.occurrences.map(o => `${SESSION_LABELS[o.session]}: ${o.note || 'בלי סיבה'}`).join(' · ')}`
                  : ` · אחרון: ${weekdayLetter(s.last.date)} ${formatShortDate(s.last.date)}`}
              </span>
              {period !== 'day' && (
                <span className="nf-reasons">
                  {s.reasons.map(r => (
                    <span key={r.reason} className="nf-reason">{r.reason} ×{r.count}</span>
                  ))}
                  {s.withoutReason > 0 && (
                    <span className="nf-reason nf-no-reason">בלי סיבה ×{s.withoutReason}</span>
                  )}
                </span>
              )}
            </div>
            <div className="ra-side">
              {period !== 'day' && <span className="nf-count">{s.count} פעמים</span>}
              {hasPhone(s.parentPhone) && (
                <a
                  href={`tel:${s.parentPhone}`}
                  className="ra-call"
                  title={`התקשר ל${s.parentName || 'הורה'} (${s.parentPhone})`}
                  aria-label={`התקשר להורה של ${s.name}`}
                >
                  <Phone size={15} />
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default NotFoundList;
