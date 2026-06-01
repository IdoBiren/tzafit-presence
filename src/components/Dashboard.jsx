import React from 'react';
import { 
  Users, 
  UserCheck, 
  UserX, 
  PlaneTakeoff, 
  ChevronLeft, 
  CalendarDays, 
  History, 
  BarChart3, 
  Download, 
  UserMinus, 
  Phone, 
  CheckCircle, 
  Award 
} from 'lucide-react';

const Dashboard = ({ students, history, onNavigateToTab, setDormFilter }) => {
  // קבלת הרשומה האחרונה ביותר לחישוב נוכחות עדכני
  const latestRecord = history && history.length > 0 ? history[0] : null;
  
  // 1. חישוב מונים כלליים לשגרה הנוכחית
  const totalStudents = students.length;
  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;

  if (latestRecord) {
    students.forEach(student => {
      const status = latestRecord.records[student.id];
      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'leave') leaveCount++;
      else absentCount++; // ברירת מחדל
    });
  } else {
    absentCount = totalStudents;
  }

  // 2. חישוב ממוצע נוכחות פנימייתי כולל
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

  // 3. חלוקת קבוצות וחישוב נתונים לכל קבוצה
  const groups = ["קסיופיה", "גלפגוס", "מונסון", "אוטופיה"];
  
  const groupData = groups.map(groupName => {
    const groupStudents = students.filter(s => s.dorm === groupName);
    const total = groupStudents.length;
    let present = 0;
    let absent = 0;
    let leave = 0;

    if (latestRecord) {
      groupStudents.forEach(s => {
        const status = latestRecord.records[s.id];
        if (status === 'present') present++;
        else if (status === 'absent') absent++;
        else if (status === 'leave') leave++;
        else absent++;
      });
    } else {
      absent = total;
    }

    const presenceRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      name: groupName,
      total,
      present,
      absent,
      leave,
      presenceRate
    };
  });

  const handleDormClick = (groupName) => {
    setDormFilter(groupName);
    onNavigateToTab('rollcall');
  };

  const getSessionName = (session) => {
    if (session === 'morning') return 'רישום בוקר';
    if (session === 'afternoon') return 'רישום צהריים';
    if (session === 'evening') return 'רישום ערב';
    if (session === 'night') return 'רישום לילה';
    return 'רישום נוכחות';
  };

  const formatDate = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // 4. הכנת נתונים לגרף מגמות נוכחות - 7 הסבבים האחרונים
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

      const parts = session.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : session.date;
      let sessionLabel = 'סבב';
      if (session.session === 'morning') sessionLabel = 'בוקר';
      else if (session.session === 'afternoon') sessionLabel = 'צהריים';
      else if (session.session === 'evening') sessionLabel = 'ערב';
      else if (session.session === 'night') sessionLabel = 'לילה';

      return {
        label: `${shortDate} (${sessionLabel})`,
        rate
      };
    });
  };

  const chartData = getChartData();

  // 5. איתור חניכים עם נוכחות נמוכה (מתחת ל-92%)
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

    return studentStats
      .filter(s => s.rate < 92 && s.absentCount > 0)
      .sort((a, b) => a.rate - b.rate);
  };

  const chronicAbsences = getChronicAbsences();

  // 6. ייצוא כל ההיסטוריה לקובץ CSV בעברית
  const handleExportCSV = () => {
    if (!history || history.length === 0) {
      alert('אין היסטוריית נוכחות לייצוא!');
      return;
    }

    const headers = ['תאריך', 'סוג סבב', 'שם חניך', 'קבוצה', 'חדר', 'סטטוס נוכחות', 'נרשם על ידי', 'זמן רישום'];
    
    const csvRows = [];
    csvRows.push(headers.join(','));

    history.forEach(session => {
      let sessionName = 'רישום נוכחות';
      if (session.session === 'morning') sessionName = 'רישום בוקר';
      else if (session.session === 'afternoon') sessionName = 'רישום צהריים';
      else if (session.session === 'evening') sessionName = 'רישום ערב';
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
      {/* שורת כותרת דאשבורד מאוחדת */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>
          לוח בקרה ודוחות נוכחות
        </h2>
        <button 
          type="button" 
          className="btn-primary" 
          onClick={handleExportCSV}
          style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Download size={16} />
          <span>ייצוא דוחות ל-CSV</span>
        </button>
      </div>

      {/* כרטיסי מונים עליונים מאוחדים (5 כרטיסים) */}
      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-info">
            <h3>סה"כ חניכים</h3>
            <div className="stat-number">{totalStudents}</div>
          </div>
          <div className="stat-icon">
            <Users size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>נוכחים</h3>
            <div className="stat-number" style={{ color: 'var(--present)' }}>{presentCount}</div>
          </div>
          <div className="stat-icon green">
            <UserCheck size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>לא נוכחים</h3>
            <div className="stat-number" style={{ color: 'var(--absent)' }}>{absentCount}</div>
          </div>
          <div className="stat-icon red">
            <UserX size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>בבית</h3>
            <div className="stat-number" style={{ color: 'var(--leave)' }}>{leaveCount}</div>
          </div>
          <div className="stat-icon amber">
            <PlaneTakeoff size={22} />
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-info">
            <h3>ממוצע נוכחות</h3>
            <div className="stat-number" style={{ color: overall.rate >= 90 ? 'var(--present)' : 'var(--leave)' }}>
              {overall.rate}%
            </div>
          </div>
          <div className="stat-icon" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent)' }}>
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* גריד 2 טורים המאחד את לוח הבקרה והדוחות */}
      <div className="grid-2col">
        
        {/* טור ימין: מצב קבוצות + גרף מגמות */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* כרטיס מצב הקבוצות */}
          <div className="card">
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1.25rem' }}>
              מצב הקבוצות בפנימייה
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {groupData.map((group, index) => (
                <div key={index} className="group-status-card">
                  <div className="group-status-info">
                    <h4 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>{group.name}</h4>
                    <div className="group-status-stats">
                      <span>חניכים: <strong>{group.total}</strong></span>
                      <span style={{ color: 'var(--present)' }}>נוכחים: <strong>{group.present}</strong></span>
                      <span style={{ color: 'var(--absent)' }}>חסרים: <strong>{group.absent}</strong></span>
                      <span style={{ color: 'var(--leave)' }}>בבית: <strong>{group.leave}</strong></span>
                    </div>
                  </div>
                  
                  <div className="group-status-actions">
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>אחוז נוכחות</div>
                      <div style={{ 
                        fontSize: '1.3rem', 
                        fontWeight: 800, 
                        color: group.presenceRate >= 90 ? 'var(--present)' : group.presenceRate >= 80 ? 'var(--leave)' : 'var(--absent)' 
                      }}>
                        {group.presenceRate}%
                      </div>
                    </div>
                    
                    <button 
                      className="action-btn" 
                      onClick={() => handleDormClick(group.name)}
                      style={{ 
                        backgroundColor: 'var(--accent-light)', 
                        color: 'var(--accent)', 
                        borderColor: 'transparent',
                        padding: '0.4rem 0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.15rem'
                      }}
                    >
                      <span>לרישום</span>
                      <ChevronLeft size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* כרטיס גרף מגמות נוכחות */}
          <div className="card">
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={18} />
              <span>מגמת נוכחות ב-7 הסבבים האחרונים</span>
            </h3>

            {chartData.length > 0 ? (
              <div className="chart-wrapper" style={{ height: '220px' }}>
                <div className="chart-bar-container" style={{ height: '170px' }}>
                  {chartData.map((data, index) => (
                    <div key={index} className="chart-column">
                      <div 
                        className="chart-bar-fill" 
                        style={{ height: `${data.rate * 1.2}px`, width: '32px' }} // התאמה לגובה החדש
                      >
                        <div className="chart-bar-value" style={{ fontSize: '0.75rem', top: '-20px' }}>{data.rate}%</div>
                      </div>
                      <div className="chart-label" style={{ fontSize: '0.75rem' }}>{data.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ height: '180px' }}>
                <div className="empty-state-icon">
                  <BarChart3 size={22} />
                </div>
                <div className="empty-state-title">אין מספיק נתונים להצגת גרף</div>
                <p style={{ fontSize: '0.8rem' }}>נתוני הנוכחות יוצגו כאן לאחר ביצוע סבבים במערכת.</p>
              </div>
            )}
          </div>

        </div>

        {/* טור שמאל: פעילויות אחרונות + נוכחות נמוכה */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* כרטיס חניכים עם נוכחות נמוכה */}
          <div className="card">
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#be123c', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserMinus size={18} />
              <span>נוכחות נמוכה (&lt;92%)</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              חניכים המופיעים כאן צברו היעדרויות מרובות ומצריכים בירור או פנייה להורים.
            </p>

            {chronicAbsences.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.5rem' }}>שם</th>
                      <th style={{ padding: '0.5rem' }}>קבוצה</th>
                      <th style={{ padding: '0.5rem' }}>חיסור</th>
                      <th style={{ padding: '0.5rem' }}>נוכחות</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left' }}>קשר</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chronicAbsences.map((student) => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)', padding: '0.5rem' }}>{student.name}</td>
                        <td style={{ padding: '0.5rem' }}>{student.dorm}</td>
                        <td style={{ color: 'var(--absent)', fontWeight: 700, padding: '0.5rem' }}>{student.absentCount} סבבים</td>
                        <td style={{ padding: '0.5rem' }}>
                          <span className="badge red" style={{ fontWeight: 700, padding: '0.1rem 0.4rem', fontSize: '0.75rem' }}>
                            {student.rate}%
                          </span>
                        </td>
                        <td style={{ padding: '0.5rem', textAlign: 'left' }}>
                          <a 
                            href={`tel:${student.parentPhone}`}
                            className="action-btn"
                            title={`התקשר ל${student.parentName} (${student.parentPhone})`}
                            style={{ padding: '0.2rem 0.35rem', backgroundColor: 'var(--accent-light)', borderColor: 'transparent', color: 'var(--accent)', display: 'inline-flex' }}
                          >
                            <Phone size={11} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '1.5rem 1rem' }}>
                <div className="empty-state-icon" style={{ backgroundColor: 'var(--present-bg)', color: 'var(--present)', width: '48px', height: '48px' }}>
                  <CheckCircle size={20} />
                </div>
                <div className="empty-state-title" style={{ color: 'var(--present)', fontSize: '1rem' }}>מצב מצוין!</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>אין אף חניך עם נוכחות נמוכה כעת.</p>
              </div>
            )}
          </div>

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
                          חסרים: {Object.values(log.records).filter(r => r === 'absent').length}
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
    </div>
  );
};

export default Dashboard;
