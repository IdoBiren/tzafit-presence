import { useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import {
  REQUIRED_SESSIONS,
  SESSION_LABELS,
  formatShortDate,
  weekdayLetter
} from '../../utils/attendanceStats';

// השלמת סבבים - הליבה של לוח הבקרה להנהלה.
// "היום": קבוצות מול סבבי היום, לחיצה פותחת את הסבב ברישום הנוכחות.
// "שבוע"/"חודש": מפת משבצות קבוצות מול ימי פעילות, לחיצה מציגה פירוט.

const STATE_LABEL = {
  complete: 'הושלם',
  partial: 'חלקי',
  'not-started': 'טרם התחיל',
  'empty-group': 'אין חניכים'
};

const RoundCompletion = ({ completion, period, today, onOpenRound }) => {
  const [selected, setSelected] = useState(null); // { group, date }

  const title = (
    <h3 className="dash-section-title">
      <ClipboardCheck size={18} />
      <span>השלמת סבבים</span>
    </h3>
  );

  if (completion.groups.length === 0) {
    return (
      <div className="card">
        {title}
        <p className="dash-muted">רשימת הקבוצות עוד לא נטענה.</p>
      </div>
    );
  }

  // ---------- היום ----------
  if (period === 'day') {
    // סבב לילה מוצג רק אם מישהו סימן בו היום - הוא אינו סבב חובה
    const nightUsed = completion.groups.some(g => g.cells[today].sessions.night.marked > 0);
    const sessions = nightUsed ? [...REQUIRED_SESSIONS, 'night'] : REQUIRED_SESSIONS;
    const dayKind = completion.days[today];

    return (
      <div className="card">
        {title}
        <p className="dash-muted">
          {dayKind === 'off'
            ? 'היום אינו יום פעילות קבוע. אם התקיימה בו פעילות, הסבבים יופיעו כאן ברגע שיסומנו.'
            : 'לחיצה על תא פותחת את הסבב ברישום הנוכחות.'}
        </p>
        <div className="rc-table-scroll">
          <table className="rc-table">
            <thead>
              <tr>
                <th>קבוצה</th>
                {sessions.map(s => (
                  <th key={s}>{SESSION_LABELS[s]}{s === 'night' ? ' (רשות)' : ''}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completion.groups.map(g => {
                const cell = g.cells[today];
                return (
                  <tr key={g.name}>
                    <th scope="row">{g.name}</th>
                    {sessions.map(s => {
                      const st = cell.sessions[s];
                      return (
                        <td key={s}>
                          <button
                            type="button"
                            className={`rc-cell rc-${st.state}`}
                            onClick={() => onOpenRound(g.name, today, s)}
                            disabled={st.state === 'empty-group'}
                          >
                            <span className="rc-cell-state">{STATE_LABEL[st.state]}</span>
                            {st.total > 0 && <span className="rc-cell-count">{st.marked}/{st.total}</span>}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ---------- שבוע / חודש ----------
  // ימים שאינם ימי פעילות ושאין בהם סימונים לא מוצגים בכלל - חוסך רוחב
  const dates = completion.dates.filter(d => completion.days[d] !== 'off');

  const cellClass = (cell, date) => {
    if (cell.kind === 'maybe-closed') return 'rc-maybe-closed';
    if (cell.rosterSize === 0) return 'rc-empty-group';
    if (cell.requiredDone === cell.requiredTotal) return 'rc-complete';
    const anyMarked = REQUIRED_SESSIONS.some(s => cell.sessions[s].marked > 0);
    if (!anyMarked) return date === today ? 'rc-not-started' : 'rc-missed';
    return 'rc-partial';
  };

  const cellText = (cell) => {
    if (cell.kind === 'maybe-closed') return '?';
    if (cell.rosterSize === 0) return '–';
    if (cell.requiredDone === cell.requiredTotal) return '✓';
    return `${cell.requiredDone}/${cell.requiredTotal}`;
  };

  const selectedCell = selected
    ? completion.groups.find(g => g.name === selected.group)?.cells[selected.date]
    : null;

  return (
    <div className="card">
      {title}
      <p className="dash-muted">
        ✓ = כל סבבי החובה הושלמו · 2/3 = הושלמו 2 מתוך 3 · ? = יום פעילות בלי אף סימון (אולי הפנימייה הייתה סגורה). לחיצה על משבצת מציגה פירוט.
      </p>

      {dates.length === 0 ? (
        <p className="dash-muted">אין ימי פעילות בתקופה הזו.</p>
      ) : (
        <div className="rc-table-scroll">
          <table className="rc-table rc-heatmap">
            <thead>
              <tr>
                <th>קבוצה</th>
                {dates.map(d => (
                  <th key={d} className={d === today ? 'rc-today' : ''}>
                    <span className="rc-day-letter">{weekdayLetter(d)}</span>
                    <span className="rc-day-date">{formatShortDate(d)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {completion.groups.map(g => (
                <tr key={g.name}>
                  <th scope="row">{g.name}</th>
                  {dates.map(d => {
                    const cell = g.cells[d];
                    const isSelected = selected?.group === g.name && selected?.date === d;
                    return (
                      <td key={d}>
                        <button
                          type="button"
                          className={`rc-dot ${cellClass(cell, d)} ${isSelected ? 'rc-selected' : ''}`}
                          onClick={() => setSelected(isSelected ? null : { group: g.name, date: d })}
                          aria-label={`${g.name} ${formatShortDate(d)}: ${cellText(cell)}`}
                        >
                          {cellText(cell)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCell && (
        <div className="rc-detail">
          <strong>{selected.group} · יום {weekdayLetter(selected.date)} {formatShortDate(selected.date)}</strong>
          {selectedCell.kind === 'maybe-closed' && (
            <p className="dash-muted" style={{ margin: '0.25rem 0 0' }}>
              יום פעילות קבוע שבו לא סומן אף חניך באף סבב. אם הפנימייה הייתה פתוחה, הסבבים לא נרשמו.
            </p>
          )}
          <div className="rc-detail-list">
            {[...REQUIRED_SESSIONS, ...(selectedCell.sessions.night.marked > 0 ? ['night'] : [])].map(s => {
              const st = selectedCell.sessions[s];
              return (
                <button
                  key={s}
                  type="button"
                  className={`rc-cell rc-${st.state}`}
                  onClick={() => onOpenRound(selected.group, selected.date, s)}
                >
                  <span className="rc-cell-state">{SESSION_LABELS[s]}</span>
                  <span className="rc-cell-count">{STATE_LABEL[st.state]}{st.total > 0 ? ` · ${st.marked}/${st.total}` : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoundCompletion;
