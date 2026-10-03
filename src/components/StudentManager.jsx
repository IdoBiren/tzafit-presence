import { useState } from 'react';
import { UserPlus, Edit2, Trash2, X, Save, UserCheck, Download } from 'lucide-react';
import { getDormColor } from '../utils/dormColors';
import { describeSaveError, withPendingTimeout } from '../utils/saveErrors';
import { useToast } from './ToastProvider';
import ConfirmModal from './ConfirmModal';

const StudentManager = ({ students, onAddStudent, onUpdateStudent, onDeleteStudent, user, groupNames }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDorm, setSelectedDorm] = useState(() => {
    if (user && user.group && user.group !== 'כללי') {
      return user.group;
    }
    return 'הכל';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // ערכי טופס
  const [formName, setFormName] = useState('');
  const [formDorm, setFormDorm] = useState(groupNames?.[0] || '');
  const [formRoom, setFormRoom] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // מצב שמירה: החלון נסגר רק אחרי שהשרת אישר. בכישלון הוא נשאר פתוח עם
  // מה שהוקלד ועם השגיאה בתוכו - לא alert שנעלם, ולא סגירה שקטה.
  const [isSaving, setIsSaving] = useState(false);
  const [saveSlow, setSaveSlow] = useState(false);
  const [formError, setFormError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(''); // 'קבוצה|שם' שכבר הוזהר עליו
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }

  // אם הקבוצה שנבחרה כבר לא קיימת (שונה שם שלה), חוזרים לתצוגת הכל
  // במקום להישאר על מסך ריק בשקט.
  if (selectedDorm !== 'הכל' && groupNames?.length && !groupNames.includes(selectedDorm)) {
    setSelectedDorm('הכל');
  }

  // פתיחת מודל להוספת חניך חדש
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormDorm(groupNames?.[0] || '');
    setFormRoom('');
    setFormParentName('');
    setFormParentPhone('');
    setFormNotes('');
    setFormError('');
    setDuplicateWarning('');
    setIsModalOpen(true);
  };

  // פתיחת מודל לעריכת חניך קיים
  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormDorm(student.dorm);
    setFormRoom(student.room);
    setFormParentName(student.parentName || '');
    setFormParentPhone(student.parentPhone || '');
    setFormNotes(student.notes || '');
    setFormError('');
    setDuplicateWarning('');
    setIsModalOpen(true);
  };

  // מחיקת חניך - אישור ב-ConfirmModal, ותוצאה (הצלחה/כישלון) ב-toast
  const handleDeleteStudent = (studentId, studentName) => {
    setPendingDelete({ id: studentId, name: studentName });
  };

  const confirmDelete = async () => {
    const { id, name } = pendingDelete;
    setPendingDelete(null);
    try {
      await withPendingTimeout(onDeleteStudent(id), () => {
        showToast(`מחיקת ${name} ממתינה לרשת - היא תושלם כשהחיבור יחזור.`, 'info', 6000);
      });
      showToast(`${name} נמחק/ה מהרשימה.`, 'success');
    } catch (error) {
      showToast(`מחיקת ${name} נכשלה: ${describeSaveError(error)}`, 'error', 8000);
    }
  };

  const closeModal = () => {
    if (isSaving) return; // לא סוגרים באמצע שמירה - אחרת התוצאה לא תוצג לאף אחד
    setIsModalOpen(false);
  };

  // שמירת הטופס (הוספה או עריכה)
  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    const name = formName.trim();
    const room = formRoom.trim();
    if (!name || !room) {
      setFormError('נא למלא שם מלא ומספר חדר.');
      return;
    }
    // חניך בלי קבוצה תקינה לא מופיע באף סינון - נעלם מהרשימות בשקט
    if (!formDorm || !(groupNames || []).includes(formDorm)) {
      setFormError('נא לבחור קבוצה. אם הרשימה ריקה, רשימת הקבוצות עוד לא נטענה - רענן את הדף.');
      return;
    }
    // שם זהה באותה קבוצה הוא כמעט תמיד הוספה כפולה בטעות - מבקשים אישור
    const duplicate = students.some(s =>
      s.id !== editingStudent?.id && s.dorm === formDorm && s.name.trim() === name
    );
    const duplicateKey = `${formDorm}|${name}`;
    if (duplicate && duplicateWarning !== duplicateKey) {
      setDuplicateWarning(duplicateKey);
      setFormError(`כבר קיים/ת חניך/ה בשם "${name}" בקבוצה ${formDorm}. לחץ שוב על שמירה כדי להוסיף בכל זאת.`);
      return;
    }

    const fields = {
      name,
      dorm: formDorm,
      room,
      parentName: formParentName.trim(),
      parentPhone: formParentPhone.trim(),
      notes: formNotes.trim()
    };

    setIsSaving(true);
    setSaveSlow(false);
    try {
      const write = editingStudent
        ? onUpdateStudent(editingStudent.id, fields)
        : onAddStudent(fields);
      await withPendingTimeout(write, () => setSaveSlow(true));
      showToast(editingStudent ? `הפרטים של ${name} עודכנו.` : `${name} נוסף/ה לרשימה.`, 'success');
      setIsModalOpen(false);
    } catch (error) {
      setFormError(`השמירה נכשלה: ${describeSaveError(error)}`);
    } finally {
      setIsSaving(false);
      setSaveSlow(false);
    }
  };

  // ייצוא רשימת החניכים המלאה (כולל פרטי הורים והערות) ל-CSV - גיבוי לפני
  // מחיקה או החלפת שנתון. ייצוא הנוכחות בלוח הבקרה אינו כולל את השדות האלה.
  const handleExportStudentsCSV = () => {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const headers = ['מזהה', 'שם מלא', 'קבוצה', 'חדר', 'שם הורה', 'טלפון הורה', 'הערות'];
    const rows = students.map(s =>
      [s.id, s.name, s.dorm, s.room, s.parentName, s.parentPhone, s.notes].map(escape).join(',')
    );
    const csvContent = '﻿' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `tzafit_students_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // סינון חניכים לפי בית וחיפוש
  const filteredStudents = students.filter(student => {
    const matchesDorm = selectedDorm === 'הכל' || student.dorm === selectedDorm;
    const matchesSearch = student.name.includes(searchQuery) || student.room.includes(searchQuery);
    return matchesDorm && matchesSearch;
  });

  return (
    <div className="student-manager-wrapper">
      {/* סרגל כלי ניהול עליון */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
          {/* תיבת חיפוש */}
          <input 
            type="text" 
            className="text-input" 
            placeholder="חפש חניך..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', maxWidth: '240px' }}
          />

          {/* סינון לפי קבוצה */}
          <select 
            className="select-input"
            value={selectedDorm}
            onChange={(e) => setSelectedDorm(e.target.value)}
          >
            <option value="הכל">כל הקבוצות</option>
            {(groupNames || []).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* כפתורים */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleExportStudentsCSV}
            disabled={students.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0.5rem 0.85rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}
          >
            <Download size={16} />
            <span>ייצוא רשימת חניכים</span>
          </button>

          <button type="button" className="btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={18} />
            <span>הוסף חניך חדש</span>
          </button>
        </div>
      </div>

      {/* רשימת החניכים - טבלה למחשב וכרטיסים לטלפון */}
      <div className="student-list-container" style={{ width: '100%' }}>
        {filteredStudents.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="card desktop-only" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>שם מלא</th>
                      <th>קבוצה</th>
                      <th>מספר חדר</th>
                      <th>שם הורה</th>
                      <th>טלפון חירום</th>
                      <th style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary)' }}>{student.name}</td>
                        <td>{student.dorm}</td>
                        <td style={{ fontWeight: 500 }}>חדר {student.room}</td>
                        <td>{student.parentName || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                        <td>{student.parentPhone || <span style={{ color: 'var(--text-muted)' }}>-</span>}</td>
                        <td style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="action-btn"
                              onClick={() => handleOpenEditModal(student)}
                              title="ערוך פרטי חניך"
                              style={{ padding: '0.4rem', color: 'var(--accent)', backgroundColor: 'var(--accent-light)', borderColor: 'transparent' }}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="action-btn"
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              title="מחק חניך מהמערכת"
                              style={{ padding: '0.4rem', color: 'var(--absent)', backgroundColor: 'var(--absent-bg)', borderColor: 'transparent' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-only student-mobile-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredStudents.map(student => {
                const dormColor = getDormColor(student.dorm, groupNames);

                return (
                  <div key={student.id} className="card student-mobile-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>{student.name}</div>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span className="tag-dorm" style={{ color: dormColor, backgroundColor: `${dormColor}12`, padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                          {student.dorm}
                        </span>
                        <span className="tag-room" style={{ backgroundColor: 'rgba(0,0,0,0.05)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                          חדר {student.room}
                        </span>
                      </div>
                    </div>

                    {(student.parentName || student.parentPhone) && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', borderTop: '1px dashed var(--border-color)', paddingTop: '0.5rem' }}>
                        {student.parentName && <div><strong>שם הורה:</strong> {student.parentName}</div>}
                        {student.parentPhone && (
                          <div>
                            <strong>טלפון חירום:</strong>{' '}
                            <a href={`tel:${student.parentPhone}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>
                              {student.parentPhone}
                            </a>
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.65rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="action-btn"
                        onClick={() => handleOpenEditModal(student)}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--accent)', backgroundColor: 'var(--accent-light)', borderColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Edit2 size={12} />
                        <span>ערוך</span>
                      </button>
                      <button 
                        className="action-btn"
                        onClick={() => handleDeleteStudent(student.id, student.name)}
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: 'var(--absent)', backgroundColor: 'var(--absent-bg)', borderColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                      >
                        <Trash2 size={12} />
                        <span>מחק</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card empty-state">
            <div className="empty-state-icon">
              <UserCheck size={24} />
            </div>
            <div className="empty-state-title">לא נמצאו חניכים במאגר</div>
            <p style={{ fontSize: '0.85rem' }}>נסה לשנות את הפילטרים או הוסף חניך חדש לחלוטין.</p>
          </div>
        )}
      </div>

      {/* מודל להוספה / עריכה */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button 
              type="button" 
              className="action-btn" 
              onClick={closeModal}
              disabled={isSaving}
              style={{ position: 'absolute', left: '1rem', top: '1rem', padding: '0.25rem', border: 'none', background: 'none', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>

            <h3 className="modal-title">
              {editingStudent ? `עריכת פרטי החניך: ${editingStudent.name}` : 'הוספת חניך חדש לרישום'}
            </h3>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="student-name">שם מלא *</label>
                <input 
                  id="student-name"
                  type="text" 
                  className="text-input"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="לדוגמה: עומר כהן"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="student-dorm">קבוצה *</label>
                  <select 
                    id="student-dorm"
                    className="select-input"
                    value={formDorm}
                    onChange={(e) => setFormDorm(e.target.value)}
                    required
                  >
                    {!formDorm && <option value="">-- בחר קבוצה --</option>}
                    {(groupNames || []).map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="student-room">מספר חדר *</label>
                  <input 
                    id="student-room"
                    type="text" 
                    className="text-input"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="לדוגמה: 101"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="parent-name">שם הורה / אפוטרופוס</label>
                <input 
                  id="parent-name"
                  type="text" 
                  className="text-input"
                  value={formParentName}
                  onChange={(e) => setFormParentName(e.target.value)}
                  placeholder="שם ההורה המלא..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="parent-phone">טלפון הורה (חירום)</label>
                <input 
                  id="parent-phone"
                  type="tel" 
                  className="text-input"
                  value={formParentPhone}
                  onChange={(e) => setFormParentPhone(e.target.value)}
                  placeholder="לדוגמה: 054-1234567"
                />
              </div>

              {saveSlow && (
                <div role="status" style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  ממתין לרשת... אל תסגור את האפליקציה. אם אין קליטה, השמירה תיכשל ותוכל לנסות שוב.
                </div>
              )}
              {formError && (
                <div role="alert" style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                  {formError}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={closeModal}
                  disabled={isSaving}
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={isSaving}
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  <Save size={16} />
                  <span>{isSaving ? 'שומר...' : 'שמור פרטים'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        title="מחיקת חניך"
        message={pendingDelete ? `האם אתה בטוח שברצונך למחוק את "${pendingDelete.name}" מהפנימייה? פעולה זו תסיר אותו/ה לצמיתות.` : ''}
        confirmLabel="מחק"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
};

export default StudentManager;
