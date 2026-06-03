import React from 'react';
import { AlertOctagon, ShieldAlert, LogOut } from 'lucide-react';

const Header = ({ emergencyActive, onToggleEmergency, user, onLogout }) => {
  return (
    <header className={`header-wrapper ${emergencyActive ? 'emergency-active' : ''}`}>
      <div className="header-content">
        <div className="header-brand">
          <div className="header-logo">צ</div>
          <div className="header-title">
            <h1>
              נוכחות פנימיית צפית
              <span>פנל מדריך</span>
            </h1>
          </div>
        </div>

        <div className="header-meta" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* פרטי משתמש והתנתקות */}
          {user && (
            <div style={styles.userProfile}>
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} style={styles.avatar} />
              ) : (
                <div style={styles.avatarFallback}>{user.displayName[0]}</div>
              )}
              <div style={styles.userInfo}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={styles.userName}>{user.displayName}</span>
                  <span style={{
                    ...styles.roleBadge,
                    backgroundColor: user.role === 'admin' ? '#2563eb' : '#475569',
                    color: '#ffffff'
                  }}>
                    {user.role === 'admin' ? 'מנהל' : 'מדריך'}
                  </span>
                </div>
                <button 
                  onClick={onLogout} 
                  style={styles.logoutBtn} 
                  title="התנתקות מהמערכת"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                >
                  <LogOut size={13} style={{ marginLeft: '4px' }} />
                  <span>התנתק</span>
                </button>
              </div>
            </div>
          )}

          {/* כפתור הפעלת חירום - למנהלים בלבד */}
          {user?.role === 'admin' && (
            <button 
              className={`emergency-btn ${emergencyActive ? 'active' : ''}`}
              onClick={onToggleEmergency}
              title={emergencyActive ? "לחיצה תבטל את אירוע החירום ותחזיר את האפליקציה למצב רגיל" : "לחיצה תפעיל מצב נוכחות חירום דחוף"}
            >
              {emergencyActive ? (
                <>
                  <ShieldAlert size={18} />
                  <span>ביטול מצב חירום</span>
                </>
              ) : (
                <>
                  <AlertOctagon size={18} />
                  <span>הפעל מצב חירום!</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

const styles = {
  userProfile: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginLeft: '0.5rem',
    paddingLeft: '1rem',
    borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    objectFit: 'cover'
  },
  avatarFallback: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    color: '#60a5fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '1rem',
    border: '2px solid rgba(37, 99, 235, 0.3)',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.1rem'
  },
  userName: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#f8fafc',
    maxWidth: '110px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '0.7rem',
    fontWeight: 600,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    transition: 'color 0.2s ease',
    outline: 'none',
  },
  roleBadge: {
    fontSize: '0.62rem',
    fontWeight: 800,
    padding: '0.1rem 0.35rem',
    borderRadius: '4px',
    lineHeight: 1,
    flexShrink: 0
  }
};

export default Header;

