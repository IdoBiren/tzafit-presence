import React from 'react';
import { ShieldAlert, LogOut, Loader2 } from 'lucide-react';

function GroupPending({ user, onLogout }) {
  return (
    <div style={styles.container}>
      {/* רקע עם גרדיאנט דינמי ואפקט אורות */}
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <div style={styles.iconCircle}>
            <ShieldAlert size={36} color="#f59e0b" />
          </div>
          <h1 style={styles.title}>ממתין להקצאת קבוצה</h1>
          <p style={styles.subtitle}>
            שלום <strong>{user?.displayName || 'מדריך'}</strong>. הרשמתך נקלטה בהצלחה במערכת נוכחות צפית!
          </p>
        </div>

        <div style={styles.infoBox}>
          <div style={styles.loaderContainer}>
            <Loader2 size={24} color="#f59e0b" style={styles.pulseSpinner} />
            <span style={styles.statusText}>סטטוס: ממתין להקצאת קבוצה על ידי המנהל</span>
          </div>
          <p style={styles.desc}>
            על מנת להגן על פרטיות החניכים והמידע בפנימייה, גישתך מוגבלת באופן זמני. מנהל המערכת צריך להקצות לך קבוצה פעילה (כגון פניקס, סקויה וכו') לפני שתוכל להיכנס.
          </p>
          <p style={styles.liveNotice}>
            אין צורך לרענן את העמוד - ברגע שהמנהל יקצה לך קבוצה, המערכת תיפתח עבורך באופן אוטומטי!
          </p>
        </div>

        <div style={styles.detailsList}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>מזהה משתמש:</span>
            <span style={styles.detailValue}>{user?.uid}</span>
          </div>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>אימייל:</span>
            <span style={styles.detailValue}>{user?.email}</span>
          </div>
        </div>

        <button onClick={onLogout} style={styles.btnLogout}>
          <LogOut size={18} style={styles.logoutIcon} />
          <span>התנתק מהמערכת</span>
        </button>

        <div style={styles.footer}>
          <span>נוכחות צפית v2.0 • אבטחת מידע ופנימיות</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#0f172a',
    fontFamily: 'Rubik, Heebo, sans-serif',
    padding: '1.5rem',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
    direction: 'rtl'
  },
  bgDecor1: {
    position: 'absolute',
    top: '-15%',
    right: '-10%',
    width: '50vw',
    height: '50vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, rgba(245,158,11,0) 70%)',
    zIndex: 1
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-10%',
    width: '45vw',
    height: '45vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, rgba(239,68,68,0) 70%)',
    zIndex: 1
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    zIndex: 10,
    boxSizing: 'border-box'
  },
  brandHeader: {
    marginBottom: '1.75rem'
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    border: '1px solid rgba(245, 158, 11, 0.2)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.1)'
  },
  title: {
    fontSize: '1.65rem',
    fontWeight: 800,
    color: '#f8fafc',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.92rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.5'
  },
  infoBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    borderRadius: '16px',
    padding: '1.25rem',
    textAlign: 'right',
    boxSizing: 'border-box',
    marginBottom: '1.5rem'
  },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#fbbf24',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '0.75rem'
  },
  pulseSpinner: {
    animation: 'spin 2s linear infinite'
  },
  statusText: {
    color: '#fbbf24'
  },
  desc: {
    margin: 0,
    fontSize: '0.84rem',
    color: '#94a3b8',
    lineHeight: '1.5',
    marginBottom: '0.75rem'
  },
  liveNotice: {
    margin: 0,
    fontSize: '0.82rem',
    color: '#34d399',
    fontWeight: 600,
    lineHeight: '1.4'
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.04)',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    marginBottom: '1.75rem',
    fontSize: '0.8rem',
    textAlign: 'right'
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  detailLabel: {
    color: '#64748b',
    fontWeight: 600
  },
  detailValue: {
    color: '#e2e8f0',
    fontFamily: 'monospace'
  },
  btnLogout: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.8rem 1.5rem',
    borderRadius: '14px',
    fontSize: '0.92rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    boxSizing: 'border-box',
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    color: '#fca5a5',
    gap: '8px'
  },
  logoutIcon: {
    transform: 'rotate(180deg)' // RTL adjustment
  },
  footer: {
    fontSize: '0.78rem',
    color: '#64748b',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '1.25rem',
    marginTop: '1.75rem'
  }
};

// הזרקת סגנון ספינר ב-CSS
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const styleId = 'grouppending-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default GroupPending;
