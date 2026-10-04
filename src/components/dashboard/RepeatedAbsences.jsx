import { UserMinus, Phone, CheckCircle } from 'lucide-react';
import { REPEATED_ABSENCE_THRESHOLD, SESSION_LABELS, formatShortDate, weekdayLetter } from '../../utils/attendanceStats';

const TITLES = {
  day: 'חסרים היום',
  week: `חסרו ${REPEATED_ABSENCE_THRESHOLD.week}+ פעמים השבוע`,
  month: `חסרו ${REPEATED_ABSENCE_THRESHOLD.month}+ פעמים בחודש`
};

// טלפון אמיתי בלבד - "צריך להוסיף" ושדות ריקים לא מקבלים כפתור חיוג
const hasPhone = (phone) => !!phone && /\d{3,}/.test(phone);

const RepeatedAbsences = ({ absences, period }) => (
  <div className="card">
    <h3 className="dash-section-title" style={{ color: '#be123c' }}>
      <UserMinus size={18} />
      <span>{TITLES[period]}</span>
    </h3>

    {absences.length === 0 ? (
      <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
        <div className="empty-state-icon" style={{ backgroundColor: 'var(--present-bg)', color: 'var(--present)', width: '48px', height: '48px' }}>
          <CheckCircle size={20} />
        </div>
        <div className="empty-state-title" style={{ color: 'var(--present)', fontSize: '1rem' }}>
          {period === 'day' ? 'אף חניך לא סומן כחסר היום' : 'אין היעדרויות חוזרות בתקופה'}
        </div>
      </div>
    ) : (
      <ul className="ra-list">
        {absences.map(s => (
          <li key={s.id} className="ra-item">
            <div className="ra-main">
              <span className="ra-name">{s.name}</span>
              <span className="ra-meta">
                {s.dorm}
                {period === 'day'
                  ? ` · ${s.absences.map(a => SESSION_LABELS[a.session]).join(', ')}`
                  : ` · אחרונה: ${weekdayLetter(s.lastAbsence.date)} ${formatShortDate(s.lastAbsence.date)}, ${SESSION_LABELS[s.lastAbsence.session]}`}
              </span>
            </div>
            <div className="ra-side">
              {period !== 'day' && (
                <span className="badge red ra-count">{s.absentCount} היעדרויות{s.rate !== null ? ` · ${s.rate}%` : ''}</span>
              )}
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

export default RepeatedAbsences;
