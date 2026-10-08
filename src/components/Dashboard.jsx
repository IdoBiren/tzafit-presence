import { useState } from 'react';
import { Download, CalendarDays, History, Percent, ClipboardCheck, MapPinOff, Home } from 'lucide-react';
import { fetchAllHistory } from '../utils/storage';
import {
  SESSION_LABELS,
  todayLocalISO,
  formatShortDate,
  computeKpis,
  computeRoundCompletion,
  computeDailyTrend,
  computeNotFound,
  STATUS_LABELS
} from '../utils/attendanceStats';
import RoundCompletion from './dashboard/RoundCompletion';
import AttendanceTrend from './dashboard/AttendanceTrend';
import NotFoundList from './dashboard/NotFoundList';

const PERIODS = [
  { id: 'day', label: 'היום' },
  { id: 'week', label: 'שבוע' },
  { id: 'month', label: 'חודש' }
];

const PERIOD_SUFFIX = { day: 'היום', week: '7 ימים אחרונים', month: '30 ימים אחרונים' };

// לוח בקרה להנהלה: השלמת סבבים, היעדרויות חוזרות ומגמות, לפי תקופה.
// כל החישובים ב-utils/attendanceStats.js, על ההיסטוריה של 30 הימים שכבר
// נטענת - בלי קריאות נוספות מ-Firebase.
const Dashboard = ({ students, history, onOpenRound, groupNames }) => {
  const [period, setPeriod] = useState('day');
  const [exporting, setExporting] = useState(false);

  const today = todayLocalISO();
  const args = { students, history, groupNames, period, today };
  const kpis = computeKpis(args);
  const completion = computeRoundCompletion(args);
  const trend = period === 'day' ? [] : computeDailyTrend(args);
  const notFound = computeNotFound(args);

  // מתי נרשם משהו לאחרונה - כדי שיהיה ברור עד מתי הנתונים מעודכנים
  const lastUpdate = (history || []).reduce((max, h) => (h.timestamp && h.timestamp > max ? h.timestamp : max), '');

  const getSessionName = (session) => `רישום ${SESSION_LABELS[session] || 'נוכחות'}`;
  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  // 6. ייצוא כל ההיסטוריה לקובץ CSV בעברית
  // ה-prop history מכיל רק את החלון האחרון (HISTORY_WINDOW_DAYS), ולכן הייצוא
  // שולף את כל ההיסטוריה בנפרד - פעם אחת, רק כשלוחצים על הכפתור.
  const handleExportCSV = async () => {
    setExporting(true);
    let fullHistory;
    try {
      fullHistory = await fetchAllHistory();
    } catch (error) {
      console.error("שגיאה בשליפת ההיסטוריה לייצוא:", error);
      alert('שגיאה בשליפת ההיסטוריה מהענן. נסה שוב.');
      return;
    } finally {
      setExporting(false);
    }

    if (fullHistory.length === 0) {
      alert('אין היסטוריית נוכחות לייצוא!');
      return;
    }

    const headers = ['תאריך', 'סוג סבב', 'שם חניך', 'קבוצה', 'חדר', 'סטטוס נוכחות', 'סיבה', 'נרשם על ידי', 'זמן רישום'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));

    fullHistory.forEach(session => {
      let sessionName = 'רישום נוכחות';
      if (session.session === 'morning') sessionName = 'רישום פתיחת יום';
      else if (session.session === 'afternoon') sessionName = 'רישום ארוחת ערב';
      else if (session.session === 'evening') sessionName = 'רישום כיבוי אורות';
      else if (session.session === 'night') sessionName = 'רישום לילה';
      
      students.forEach(student => {
        // חניך שאף אחד לא סימן אינו "נוכח" - דיווח כזה מסוכן בדוח נוכחות
        const statusVal = session.records[student.id] || null;
        const statusHebrew = STATUS_LABELS[statusVal] || 'טרם סומן';
        // סיבת "לא נמצא" (חוג, טיפול...) - טקסט חופשי, ולכן במירכאות עם escape
        const note = (session.notes?.[student.id] || '').replace(/"/g, '""');
        
        const row = [
          session.date,
          sessionName,
          `"${student.name}"`,
          `"${student.dorm}"`,
          student.room,
          statusHebrew,
          `"${note}"`,
          `"${session.markedBy || 'צוות'}"`,
          new Date(session.timestamp).toLocaleTimeString('he-IL')
        ];
        
        csvRows.push(row.join(','));
      });
    });

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `tzafit_attendance_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-wrapper">
      {/* כותרת: מתג תקופה + ייצוא */}
      <div className="dash-header">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
            לוח בקרה ודוחות נוכחות
          </h2>
          <p className="dash-muted" style={{ margin: '0.25rem 0 0' }}>
            {lastUpdate
              ? `רישום אחרון: ${formatShortDate(lastUpdate.slice(0, 10))} בשעה ${new Date(lastUpdate).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`
              : 'עוד לא נרשמה נוכחות ב-30 הימים האחרונים'}
          </p>
        </div>
        <div className="dash-header-actions">
          <div className="btn-group dash-period" role="tablist" aria-label="תקופה">
            {PERIODS.map(p => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={period === p.id}
                className={`toggle-btn ${period === p.id ? 'active' : ''}`}
                onClick={() => setPeriod(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={exporting}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            <Download size={16} />
            <span>{exporting ? 'מכין קובץ...' : 'ייצוא CSV'}</span>
          </button>
        </div>
      </div>

      {/* ארבעה מספרים לתקופה */}
      {/* "לא נמצא" אינו היעדרות (בפנימייה, אבל בחוג/טיפול) - לכן המדד הוא
          אחוז בפנימייה ולא אחוז נוכחות, ובלי אדום */}
      <div className="stats-grid dash-kpis">
        <div className="card stat-card">
          <div className="stat-info">
            <h3>בפנימייה · {PERIOD_SUFFIX[period]}</h3>
            <div className="stat-number" style={{ color: kpis.inSchoolRate === null ? 'var(--text-muted)' : 'var(--primary)' }}>
              {kpis.inSchoolRate === null ? '—' : `${kpis.inSchoolRate}%`}
            </div>
          </div>
          <div className="stat-icon green"><Percent size={22} /></div>
        </div>
        <div className="card stat-card">
          <div className="stat-info">
            <h3>חניכים שלא נמצאו בסבב</h3>
            <div className="stat-number" style={{ color: kpis.notFoundStudents > 0 ? 'var(--notfound)' : 'var(--text-muted)' }}>{kpis.notFoundStudents}</div>
          </div>
          <div className="stat-icon"><MapPinOff size={22} /></div>
        </div>
        <div className="card stat-card">
          <div className="stat-info">
            <h3>סבבי חובה שהושלמו</h3>
            <div className="stat-number" style={{ color: kpis.roundsExpected > 0 && kpis.roundsDone === kpis.roundsExpected ? 'var(--present)' : 'var(--primary)' }}>
              {kpis.roundsDone}<span className="dash-of"> / {kpis.roundsExpected}</span>
            </div>
          </div>
          <div className="stat-icon"><ClipboardCheck size={22} /></div>
        </div>
        <div className="card stat-card">
          <div className="stat-info">
            <h3>חניכים בבית</h3>
            <div className="stat-number" style={{ color: kpis.homeStudents > 0 ? 'var(--leave)' : 'var(--text-muted)' }}>{kpis.homeStudents}</div>
          </div>
          <div className="stat-icon amber"><Home size={22} /></div>
        </div>
      </div>

      <div className="dash-sections">
        <RoundCompletion completion={completion} period={period} today={today} onOpenRound={onOpenRound} />
        {period !== 'day' && <AttendanceTrend trend={trend} groupNames={groupNames} />}
        <NotFoundList students={notFound} period={period} />

      {/* כרטיס פעילויות אחרונות בצוות */}
      <div className="card">
        <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} />
          <span>פעילויות אחרונות בצוות</span>
        </h3>
        
        {history && history.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {history.slice(0, 4).map((log, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '0.65rem', 
                paddingBottom: idx < 3 ? '0.85rem' : '0',
                borderBottom: idx < 3 ? '1px solid var(--border-color)' : 'none'
              }}>
                <div style={{ 
                  backgroundColor: 'var(--bg-app)', 
                  padding: '0.4rem', 
                  borderRadius: '50%',
                  color: 'var(--text-muted)',
                  flexShrink: 0
                }}>
                  <CalendarDays size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {getSessionName(log.session)}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {formatDate(log.date)}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    בוצע על ידי: {log.markedBy || 'צוות פנימייה'}
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span className="attendance-tag present" style={{ fontSize: '0.65rem', padding: '0.05rem 0.25rem' }}>
                      נוכחים: {Object.values(log.records).filter(r => r === 'present').length}
                    </span>
                    <span className="attendance-tag absent" style={{ fontSize: '0.65rem', padding: '0.05rem 0.25rem' }}>
                      לא נמצאו: {Object.values(log.records).filter(r => r === 'absent').length}
                    </span>
                    <span className="attendance-tag leave" style={{ fontSize: '0.65rem', padding: '0.05rem 0.25rem' }}>
                      בבית: {Object.values(log.records).filter(r => r === 'leave').length}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem 1rem' }}>
            <div className="empty-state-icon">
              <History size={20} />
            </div>
            <div className="empty-state-title">אין היסטוריית רישום</div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>טרם בוצעו סבבי נוכחות במערכת.</p>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default Dashboard;
