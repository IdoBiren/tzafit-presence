import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, User, Save, Trash2, CheckCircle, Clock } from 'lucide-react';
import { subscribeToUsers, updateUserProfile, deleteUserRecord } from '../utils/storage';

function StaffManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // מעקב אחר מצב עריכה מקומי של שדות לכל משתמש
  const [editStates, setEditStates] = useState({});
  const [savingUids, setSavingUids] = useState({});
  const [successUids, setSuccessUids] = useState({});

  useEffect(() => {
    const unsubscribe = subscribeToUsers((loadedUsers) => {
      setUsers(loadedUsers);
      setLoading(false);
      
      // אתחול מצבי עריכה מקומיים מהערכים שנטענו
      const initialStates = {};
      loadedUsers.forEach(u => {
        initialStates[u.uid] = {
          role: u.role || 'counselor',
          group: u.group || ''
        };
      });
      setEditStates(prev => {
        // שמירת שינויים שכבר הוקלדו ולא נשמרו עדיין
        const merged = { ...initialStates };
        Object.keys(prev).forEach(uid => {
          if (prev[uid] && initialStates[uid]) {
            merged[uid] = prev[uid];
          }
        });
        return merged;
      });
    });

    return () => unsubscribe();
  }, []);

  const handleFieldChange = (uid, field, value) => {
    setEditStates(prev => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [field]: value
      }
    }));
  };

  const handleSaveChanges = async (uid) => {
    const edits = editStates[uid];
    if (!edits) return;

    setSavingUids(prev => ({ ...prev, [uid]: true }));
    try {
      await updateUserProfile(uid, {
        role: edits.role,
        group: edits.group
      });
      
      // חיווי הצלחה זמני
      setSuccessUids(prev => ({ ...prev, [uid]: true }));
      setTimeout(() => {
        setSuccessUids(prev => ({ ...prev, [uid]: false }));
      }, 3000);
    } catch (err) {
      console.error("שגיאה בעדכון משתמש:", err);
      alert("שגיאה בשמירת השינויים. אנא נסה שוב.");
    } finally {
      setSavingUids(prev => ({ ...prev, [uid]: false }));
    }
  };

  const handleDeleteUser = async (uid, name) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את המשתמש "${name}" מהמערכת? פעולה זו תחסום את גישת המשתמש לאלתר.`)) {
      try {
        await deleteUserRecord(uid);
      } catch (err) {
        console.error("שגיאה במחיקת משתמש:", err);
        alert("שגיאה במחיקת המשתמש.");
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <span style={styles.spinner}></span>
        <p>טוען את רשימת אנשי הצוות...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>ניהול צוות והרשאות</h2>
        <p style={styles.subtitle}>
          מכאן תוכל לאשר משתמשים חדשים, להקצות להם קבוצות עבודה (פנימיות) ולשנות את תפקידם במערכת.
        </p>
      </div>

      {users.length === 0 ? (
        <div style={styles.emptyState}>
          <User size={48} color="#94a3b8" />
          <p>אין משתמשים רשומים במערכת.</p>
        </div>
      ) : (
        <div style={styles.listContainer}>
          {users.map(u => {
            const currentEdits = editStates[u.uid] || { role: u.role, group: u.group };
            const isPending = !u.group;
            const isSaving = savingUids[u.uid];
            const isSuccess = successUids[u.uid];
            
            return (
              <div 
                key={u.uid} 
                style={{
                  ...styles.userCard,
                  ...(isPending ? styles.pendingCard : {})
                }}
              >
                {/* חלק 1: פרטי משתמש */}
                <div style={styles.userInfoSection}>
                  <div style={styles.avatarWrapper}>
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} style={styles.avatarImg} />
                    ) : (
                      <div style={styles.avatarPlaceholder}>
                        <User size={20} color="#64748b" />
                      </div>
                    )}
                  </div>
                  <div style={styles.userDetails}>
                    <div style={styles.userNameRow}>
                      <span style={styles.userName}>{u.displayName || 'משתמש חדש'}</span>
                      {isPending && (
                        <span style={styles.pendingBadge}>
                          <Clock size={12} style={{ marginLeft: '4px' }} />
                          <span>ממתין להקצאה</span>
                        </span>
                      )}
                    </div>
                    <span style={styles.userEmail}>{u.email}</span>
                    <span style={styles.userId}>מזהה: {u.uid}</span>
                  </div>
                </div>

                {/* חלק 2: בקרה והרשאות */}
                <div style={styles.controlsSection}>
                  {/* בחירת תפקיד */}
                  <div style={styles.controlGroup}>
                    <label style={styles.controlLabel}>תפקיד מערכת:</label>
                    <div style={styles.selectWrapper}>
                      {currentEdits.role === 'admin' ? (
                        <ShieldAlert size={16} color="#3b82f6" style={styles.selectIcon} />
                      ) : (
                        <Shield size={16} color="#64748b" style={styles.selectIcon} />
                      )}
                      <select
                        value={currentEdits.role}
                        onChange={(e) => handleFieldChange(u.uid, 'role', e.target.value)}
                        style={styles.selectInput}
                        disabled={isSaving}
                      >
                        <option value="counselor">מדריך (Counselor)</option>
                        <option value="admin">מנהל (Admin)</option>
                      </select>
                    </div>
                  </div>

                  {/* בחירת קבוצה */}
                  <div style={styles.controlGroup}>
                    <label style={styles.controlLabel}>קבוצה משויכת (פנימייה):</label>
                    <select
                      value={currentEdits.group}
                      onChange={(e) => handleFieldChange(u.uid, 'group', e.target.value)}
                      style={{
                        ...styles.selectInputDirect,
                        borderColor: isPending ? '#f59e0b' : 'rgba(226, 232, 240, 0.8)'
                      }}
                      disabled={isSaving}
                    >
                      <option value="">-- בחר קבוצה (ממתין להקצאה) --</option>
                      <option value="כללי">כללי (כל הקבוצות / מנהל)</option>
                      <option value="קסיופיה">קסיופיה</option>
                      <option value="קומביין">קומביין</option>
                      <option value="מונסון">מונסון</option>
                      <option value="אוטופיה">אוטופיה</option>
                    </select>
                  </div>
                </div>

                {/* חלק 3: פעולות */}
                <div style={styles.actionsSection}>
                  <button
                    onClick={() => handleSaveChanges(u.uid)}
                    disabled={isSaving || (currentEdits.role === u.role && currentEdits.group === u.group)}
                    style={{
                      ...styles.btnSave,
                      ...(isSuccess ? styles.btnSaveSuccess : {}),
                      ...((currentEdits.role === u.role && currentEdits.group === u.group) ? styles.btnDisabled : {})
                    }}
                  >
                    {isSaving ? (
                      <span style={styles.buttonSpinner}></span>
                    ) : isSuccess ? (
                      <>
                        <CheckCircle size={16} />
                        <span>נשמר!</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>שמור</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteUser(u.uid, u.displayName)}
                    disabled={isSaving}
                    style={styles.btnDelete}
                    title="מחק משתמש לצמיתות"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '1.5rem',
    direction: 'rtl',
    fontFamily: 'Rubik, Heebo, sans-serif',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '4rem 2rem',
    gap: '1rem',
    color: '#64748b'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block'
  },
  header: {
    marginBottom: '2rem',
    textAlign: 'right'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#1e293b',
    margin: '0 0 0.5rem 0'
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    gap: '1rem'
  },
  listContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  userCard: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '1.25rem',
    gap: '1.25rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
    transition: 'all 0.2s ease',
    textAlign: 'right'
  },
  pendingCard: {
    border: '1.5px dashed #f59e0b',
    backgroundColor: '#fffdf5'
  },
  userInfoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flex: '1 1 300px'
  },
  avatarWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem'
  },
  userNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  userName: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#1e293b'
  },
  pendingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    color: '#d97706',
    fontSize: '0.74rem',
    fontWeight: 700,
    padding: '0.2rem 0.6rem',
    borderRadius: '20px'
  },
  userEmail: {
    fontSize: '0.84rem',
    color: '#64748b'
  },
  userId: {
    fontSize: '0.74rem',
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  controlsSection: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    flex: '2 1 400px'
  },
  controlGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: '1 1 180px'
  },
  controlLabel: {
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#475569'
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  },
  selectIcon: {
    position: 'absolute',
    right: '0.75rem',
    pointerEvents: 'none'
  },
  selectInput: {
    width: '100%',
    padding: '0.55rem 2.2rem 0.55rem 0.75rem',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    fontSize: '0.88rem',
    fontFamily: 'Rubik, Heebo, sans-serif',
    outline: 'none',
    color: '#334155',
    cursor: 'pointer'
  },
  selectInputDirect: {
    width: '100%',
    padding: '0.55rem 0.75rem',
    border: '1px solid rgba(226, 232, 240, 0.8)',
    borderRadius: '10px',
    backgroundColor: '#ffffff',
    fontSize: '0.88rem',
    fontFamily: 'Rubik, Heebo, sans-serif',
    outline: 'none',
    color: '#334155',
    cursor: 'pointer'
  },
  actionsSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto',
    flexShrink: 0
  },
  btnSave: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '0.6rem 1.25rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '0.88rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.1)'
  },
  btnSaveSuccess: {
    backgroundColor: '#10b981',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.1)'
  },
  btnDelete: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    border: '1px solid #fee2e2',
    backgroundColor: '#fef2f2',
    color: '#ef4444',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  btnDisabled: {
    backgroundColor: '#f1f5f9',
    color: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none'
  }
};

// הזרקת סגנון ספינר ב-CSS
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const styleId = 'staffmanager-styles';
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

export default StaffManager;
