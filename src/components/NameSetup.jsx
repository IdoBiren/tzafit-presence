import React, { useState } from 'react';
import { UserCheck, ArrowRight, User } from 'lucide-react';

function NameSetup({ user, onSave }) {
  const [name, setName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('אנא הזן שם תקין.');
      return;
    }
    if (trimmedName.length < 2) {
      setError('השם חייב להכיל לפחות 2 אותיות.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSave(trimmedName);
    } catch (err) {
      console.error("שגיאה בעדכון השם:", err);
      setError('שגיאה בשמירת השם. אנא נסה שוב.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* רקע עם גרדיאנט דינמי ואפקט אורות */}
      <div style={styles.bgDecor1}></div>
      <div style={styles.bgDecor2}></div>

      <div style={styles.card}>
        <div style={styles.brandHeader}>
          <div style={styles.iconCircle}>
            <UserCheck size={36} color="#2563eb" />
          </div>
          <h1 style={styles.title}>נעים להכיר!</h1>
          <p style={styles.subtitle}>
            רגע לפני שנכנסים לאפליקציה, בוא נגדיר כיצד תרצה ששמך יופיע בפני שאר חברי הצוות.
          </p>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="displayNameInput" style={styles.label}>שם תצוגה מבוקש:</label>
            <div style={styles.inputWrapper}>
              <User size={18} color="#94a3b8" style={styles.inputIcon} />
              <input
                id="displayNameInput"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="לדוגמה: ישראל (מדריך בוקר)"
                disabled={loading}
                style={styles.input}
                maxLength={30}
                required
              />
            </div>
            <p style={styles.hint}>
              השם שיוצג בעת רישום נוכחות, דיווחי נוכחות ובעת הפעלת מצב חירום.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btnSubmit,
              ...(loading ? styles.btnDisabled : {})
            }}
          >
            {loading ? (
              <span style={styles.spinner}></span>
            ) : (
              <>
                <span>שמור והמשך</span>
                <ArrowRight size={18} style={styles.btnIcon} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span>נוכחות צפית v2.0 • הגדרת פרופיל חדש</span>
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
    maxWidth: '450px',
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
    lineHeight: '1.5'
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
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    textAlign: 'right',
    marginBottom: '2rem'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#e2e8f0'
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  inputIcon: {
    position: 'absolute',
    right: '1rem',
    pointerEvents: 'none'
  },
  input: {
    width: '100%',
    padding: '0.85rem 2.8rem 0.85rem 1rem',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '14px',
    color: '#f8fafc',
    fontSize: '1rem',
    fontFamily: 'Rubik, Heebo, sans-serif',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box'
  },
  hint: {
    fontSize: '0.78rem',
    color: '#64748b',
    margin: '0.25rem 0 0 0',
    lineHeight: '1.4'
  },
  btnSubmit: {
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
    width: '100%',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
    gap: '8px'
  },
  btnIcon: {
    transform: 'rotate(180deg)', // כיוון חץ ימינה לתמיכה ב-RTL (המשך)
    transition: 'transform 0.2s ease'
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
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

// הזרקת סגנונות ומיקרו-אנימציות למניעת שגיאות והצגה פרימיום
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const styleId = 'namesetup-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      #displayNameInput:focus {
        border-color: #2563eb !important;
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15) !important;
        background-color: rgba(15, 23, 42, 0.8) !important;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

export default NameSetup;
