import React from 'react';
import { BarChart3, Download, UserMinus, Phone, Mail, Award, CheckCircle } from 'lucide-react';

const Analytics = ({ students, history }) => {
  // חישוב ממוצע נוכחות כולל ברמת פנימייה
  const calculateOverallStats = () => {
    if (!history || history.length === 0) return { rate: 0, totalChecks: 0 };
    
    let totalPresent = 0;
    let totalAbsent = 0;

    history.forEach(session => {
      Object.values(session.records).forEach(status => {
        if (status === 'present') totalPresent++;
        else if (status === 'absent') totalAbsent++;
      });
    });

    const total = totalPresent + totalAbsent;
    const rate = total > 0 ? Math.round((totalPresent / total) * 100) : 100;
    return { rate, totalChecks: history.length };
  };

  const overall = calculateOverallStats();

  // הכנת נתונים לגרף - 7 הסבבים האחרונים
  const getChartData = () => {
    if (!history || history.length === 0) return [];
    
    // קבלת 7 הרשומות האחרונות, והפיכת הסדר כדי שיוצגו משמאל לימין (כרונולוגית)
    const recentSessions = [...history].slice(0, 7).reverse();

    return recentSessions.map(session => {
      let present = 0;
      let absent = 0;
      
      Object.values(session.records).forEach(status => {
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
      });

      const total = present + absent;
      const rate = total > 0 ? Math.round((present / total) * 100) : 100;

      // עיצוב תאריך וסוג
      const parts = session.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : session.date;
      let sessionLabel = 'סבב';
      if (session.session === 'morning') sessionLabel = 'פתיחת יום';
      else if (session.session === 'afternoon') sessionLabel = 'ארוחת ערב';
      else if (session.session === 'evening') sessionLabel = 'כיבוי אורות';
      else if (session.session === 'night') sessionLabel = 'לילה';

      return {
        label: `${shortDate} (${sessionLabel})`,
        rate
      };
    });
  };

  const chartData = getChartData();

  // איתור חניכים עם נוכחות נמוכה (מתחת ל-92%)
  const getChronicAbsences = () => {
    if (!history || history.length === 0) return [];

    const studentStats = students.map(student => {
      let sessionsCount = 0;
      let presentCount = 0;
      let absentCount = 0;
      let leaveCount = 0;

      history.forEach(session => {
        const status = session.records[student.id];
        if (status) {
          sessionsCount++;
          if (status === 'present') presentCount++;
          else if (status === 'absent') absentCount++;
          else if (status === 'leave') leaveCount++;
        }
      });

      // נוכחות מחושבת מתוך ימי החובה (לא כולל חופשות מאושרות)
      const activeSessions = presentCount + absentCount;
      const rate = activeSessions > 0 ? Math.round((presentCount / activeSessions) * 100) : 100;

      return {
        ...student,
        presentCount,
        absentCount,
        leaveCount,
        rate
      };
    });

    // מחזירים רק חניכים עם נוכחות מתחת ל-92% וממיינים מהנמוך לגבוה
    return studentStats
      .filter(s => s.rate < 92 && s.absentCount > 0)
      .sort((a, b) => a.rate - b.rate);
  };

  const chronicAbsences = getChronicAbsences();

  // ייצוא כל ההיסטוריה לקובץ CSV בעברית
  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      alert('אין היסטוריית נוכחות לייצוא!');
      return;
    }

    // הגדרת כותרות העמודות ב-CSV
    const headers = ['תאריך', 'סוג סבב', 'שם חניך', 'קבוצה', 'חדר', 'סטטוס נוכחות', 'נרשם על ידי', 'זמן רישום'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));

    // בניית השורות
    history.forEach(session => {
      let sessionName = 'רישום נוכחות';
      if (session.session === 'morning') sessionName = 'רישום פתיחת יום';
      else if (session.session === 'afternoon') sessionName = 'רישום ארוחת ערב';
      else if (session.session === 'evening') sessionName = 'רישום כיבוי אורות';
      else if (session.session === 'night') sessionName = 'רישום לילה';
      
      students.forEach(student => {
        const statusVal = session.records[student.id] || 'present';
        const statusHebrew = statusVal === 'present' ? 'נוכח' : statusVal === 'absent' ? 'לא נוכח' : 'בבית';
        
        const row = [
          session.date,
          sessionName,
          `"${student.name}"`,
          `"${student.dorm}"`,
          student.room,
          statusHebrew,
          `"${session.markedBy || 'צוות'}"`,
          new Date(session.timestamp).toLocaleTimeString('he-IL')
        ];
        
        csvRows.push(row.join(','));
      });
    });

    // הוספת סימן UTF-8 BOM (\uFEFF) כדי שאקסל יפתח את העברית בצורה תקינה ולא כג'יבריש
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
    <div className="analytics-dashboard">
      {/* כרטיסי מפתח עליונים של דוחות */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="card stat-card" style={{ padding: '1.75rem' }}>
          <div className="stat-info">
            <h3>ממוצע נוכחות פנימייתי</h3>
            <div className="stat-number" style={{ color: overall.rate >= 90 ? 'var(--present)' : 'var(--leave)' }}>
              {overall.rate}%
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              מבוסס על {overall.totalChecks} סבבי נוכחות שהושלמו
            </div>
          </div>
          <div className="stat-icon green" style={{ width: '56px', height: '56px' }}>
            <Award size={28} />
          </div>
        </div>

        <div className="card stat-card" style={{ padding: '1.75rem' }}>
          <div className="stat-info">
            <h3>ייצוא נתונים מרוכז</h3>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: '1.4' }}>
              הורד גיליון נתונים מלא בפורמט CSV המותאם ל-MS Excel.
            </div>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleExportCSV}
              style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Download size={16} />
              <span>ייצוא לקובץ CSV</span>
            </button>
          </div>
          <div className="stat-icon" style={{ width: '56px', height: '56px', backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Download size={28} />
          </div>
        </div>
      </div>

      {/* גרף מגמות נוכחות ודוח חריגים */}
      <div className="grid-2col" style={{ gridTemplateColumns: '1.25fr 1fr', gap: '2rem' }}>
        {/* גרף עמודות דינמי */}
        <div className="card">
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={18} />
            <span>מגמת נוכחות ב-7 הסבבים האחרונים</span>
          </h3>

          {chartData.length > 0 ? (
            <div className="chart-wrapper">
              <div className="chart-bar-container">
                {chartData.map((data, index) => (
                  <div key={index} className="chart-column">
                    <div 
                      className="chart-bar-fill" 
                      style={{ height: `${data.rate * 1.5}px` }} // קנה מידה ויזואלי מתאים
                    >
                      <div className="chart-bar-value">{data.rate}%</div>
                    </div>
                    <div className="chart-label">{data.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ height: '200px' }}>
              <div className="empty-state-icon">
                <BarChart3 size={24} />
              </div>
              <div className="empty-state-title">אין מספיק נתונים להצגת גרף</div>
              <p style={{ fontSize: '0.85rem' }}>נתוני הנוכחות יוצגו כאן לאחר ביצוע סבבים במערכת.</p>
            </div>
          )}
        </div>

        {/* טבלת חסרונות כרוניים / מעקב מדריכים */}
        <div className="card">
          <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: '#be123c', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserMinus size={18} />
            <span>חניכים עם נוכחות נמוכה (&lt;92%)</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            חניכים המופיעים כאן צברו היעדרויות מרובות ומצריכים בירור או פנייה להורים.
          </p>

          {chronicAbsences.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table" style={{ fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>קבוצה</th>
                    <th>היעדרויות</th>
                    <th>אחוז נוכחות</th>
                    <th>פעולה</th>
                  </tr>
                </thead>
                <tbody>
                  {chronicAbsences.map((student, idx) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{student.name}</td>
                      <td>{student.dorm}</td>
                      <td style={{ color: 'var(--absent)', fontWeight: 700 }}>{student.absentCount} פעמים</td>
                      <td>
                        <span className="badge red" style={{ fontWeight: 700 }}>
                          {student.rate}%
                        </span>
                      </td>
                      <td>
                        <a 
                          href={`tel:${student.parentPhone}`}
                          className="action-btn"
                          title={`התקשר ל${student.parentName} (${student.parentPhone})`}
                          style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--accent-light)', borderColor: 'transparent', color: 'var(--accent)', display: 'inline-flex' }}
                        >
                          <Phone size={12} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon" style={{ backgroundColor: 'var(--present-bg)', color: 'var(--present)' }}>
                <CheckCircle size={24} />
              </div>
              <div className="empty-state-title" style={{ color: 'var(--present)' }}>מצב מצוין!</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>אין אף חניך עם נוכחות מתחת ל-92% כעת.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
