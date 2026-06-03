import React, { useState } from 'react';
import { LogIn, Key, CloudLightning, ShieldCheck } from 'lucide-react';
import { auth, isFirebaseConfigured } from '../utils/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

function Login({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured) return;
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      // אילוץ של בחירת חשבון בכל כניסה
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      onLogin({
        uid: user.uid,
        displayName: user.displayName || 'מדריך צפית',
        email: user.email,
        photoURL: user.photoURL || '',
        isDemo: false
      });
    } catch (err) {
      console.error("שגיאה בהתחברות באמצעות גוגל:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('ההתחברות בוטלה על ידי המשתמש.');
      } else {
        setError('שגיאה בתהליך ההתחברות. אנא נסה שוב.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin({
        uid: 'demo-user-123',
        displayName: 'מדריך תורן (דמו)',
        email: 'demo@tzafit.org.il',
        photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        isDemo: true
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div style={styles.container}>
      {/* רקע עם גרדיאנט דינמי ואפקט אורות */}
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.card}>
        {/* כותרת מוסדית מעוצבת */}
        <div style={styles.brandHeader}>
          <div style={styles.iconCircle}>
            <CloudLightning size={36} color="#2563eb" />
          </div>
          <h1 style={styles.title}>פנימיית צפית</h1>
          <p style={styles.subtitle}>מערכת ניהול נוכחות וחירום דיגיטלית</p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <div style={styles.actionContainer}>
          {isFirebaseConfigured ? (
            <button 
              onClick={handleGoogleLogin} 
              disabled={loading} 
              style={{
                ...styles.btn,
                ...styles.btnGoogle,
                ...(loading ? styles.btnDisabled : {})
              }}
            >
              {loading ? (
                <span style={styles.spinner}></span>
              ) : (
                <>
                  <svg style={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
                    <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19 0-3.41 2.78-6.19 6.19-6.19 1.488 0 2.857.531 3.93 1.423l3.076-3.075C19.043 2.128 15.82 1 12.24 1 5.92 1 1 5.92 1 12.24s4.92 11.24 11.24 11.24c6.31 0 10.74-4.43 10.74-10.74 0-.693-.062-1.373-.18-2.035H12.24z"/>
                  </svg>
                  <span>התחברות באמצעות Google</span>
                </>
              )}
            </button>
          ) : (
            <div style={styles.noCloudBanner}>
              <div style={styles.noCloudTextContainer}>
                <ShieldCheck size={18} color="#059669" style={{ marginLeft: '6px' }} />
                <span>מצב עבודה מקומי (דמו) פעיל</span>
              </div>
              <p style={styles.noCloudDesc}>האפליקציה אינה מחוברת ל-Firebase. תוכל להיכנס במצב דמו מקומי ללא סיסמה.</p>
            </div>
          )}

          {/* אפשרות להתחבר כמדריך אורח/דמו */}
          <button 
            onClick={handleDemoLogin} 
            disabled={loading} 
            style={{
              ...styles.btn,
              ...styles.btnDemo,
              ...(loading ? styles.btnDisabled : {})
            }}
          >
            {loading && !isFirebaseConfigured ? (
              <span style={styles.spinner}></span>
            ) : (
              <>
                <Key size={18} style={{ marginLeft: '8px' }} />
                <span>{isFirebaseConfigured ? 'כניסה למצב צפייה/דמו' : 'כניסה למערכת (מצב מקומי)'}</span>
              </>
            )}
          </button>
        </div>

        <div style={styles.footer}>
          <span>נוכחות צפית v2.0 • מאובטח לשימוש הצוות החינוכי</span>
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
    backgroundColor: '#0f172a', // כהה ועמוק
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
    background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 70%)',
    zIndex: 1
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-10%',
    width: '45vw',
    height: '45vw',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0) 70%)',
    zIndex: 1
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)', // כהה שקוף למחצה
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
    marginBottom: '2rem'
  },
  iconCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.2)'
  },
  title: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#f8fafc',
    margin: '0 0 0.5rem 0',
    letterSpacing: '-0.02em'
  },
  subtitle: {
    fontSize: '0.92rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.4'
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    fontSize: '0.88rem',
    marginBottom: '1.5rem',
    textAlign: 'right'
  },
  actionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    marginBottom: '2rem'
  },
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.85rem 1.5rem',
    borderRadius: '14px',
    fontSize: '0.96rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
    boxSizing: 'border-box',
    width: '100%'
  },
  btnGoogle: {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    gap: '10px'
  },
  googleIcon: {
    display: 'block'
  },
  btnDemo: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    color: '#e2e8f0',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  noCloudBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '14px',
    padding: '1rem',
    textAlign: 'right',
    boxSizing: 'border-box'
  },
  noCloudTextContainer: {
    display: 'flex',
    alignItems: 'center',
    color: '#34d399',
    fontWeight: 700,
    fontSize: '0.92rem',
    marginBottom: '0.35rem'
  },
  noCloudDesc: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  },
  footer: {
    fontSize: '0.78rem',
    color: '#64748b',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    paddingTop: '1.25rem'
  }
};

// הזרקת סגנון ספינר ואנימציה ב-CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default Login;
