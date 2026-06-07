import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, X, Save, AlertTriangle, UserCheck } from 'lucide-react';

const StudentManager = ({ students, onSaveStudents }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDorm, setSelectedDorm] = useState('הכל');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // ערכי טופס
  const [formName, setFormName] = useState('');
  const [formDorm, setFormDorm] = useState('קסיופיה');
  const [formRoom, setFormRoom] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentPhone, setFormParentPhone] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // פתיחת מודל להוספת חניך חדש
  const handleOpenAddModal = () => {
    setEditingStudent(null);
    setFormName('');
    setFormDorm('קסיופיה');
    setFormRoom('');
    setFormParentName('');
    setFormParentPhone('');
    setFormNotes('');
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
    setIsModalOpen(true);
  };

  // מחיקת חניך
  const handleDeleteStudent = (studentId, studentName) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את החניך "${studentName}" מהפנימייה? פעולה זו תסיר אותו לצמיתות.`)) {
      const updatedList = students.filter(s => s.id !== studentId);
      onSaveStudents(updatedList);
    }
  };

  // שמירת הטופס (הוספה או עריכה)
  const handleSave = (e) => {
    e.preventDefault();
    
    if (!formName.trim() || !formRoom.trim()) {
      alert('נא למלא את כל שדות החובה!');
      return;
    }

    let updatedList = [];

    if (editingStudent) {
      // עריכה
      updatedList = students.map(s => {
        if (s.id === editingStudent.id) {
          return {
            ...s,
            name: formName.trim(),
            dorm: formDorm,
            room: formRoom.trim(),
            parentName: formParentName.trim(),
            parentPhone: formParentPhone.trim(),
            notes: formNotes.trim()
          };
        }
        return s;
      });
    } else {
      // הוספה - יצירת מזהה ייחודי חדש
      const newId = (Math.max(...students.map(s => parseInt(s.id) || 0)) + 1).toString();
      const newStudent = {
        id: newId,
        name: formName.trim(),
        dorm: formDorm,
        room: formRoom.trim(),
        parentName: formParentName.trim(),
        parentPhone: formParentPhone.trim(),
        notes: formNotes.trim()
      };
      updatedList = [...students, newStudent];
    }

    onSaveStudents(updatedList);
    setIsModalOpen(false);
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
            <option value="קסיופיה">קסיופיה</option>
            <option value="קומביין">קומביין</option>
            <option value="מונסון">מונסון</option>
            <option value="אוטופיה">אוטופיה</option>
          </select>
        </div>

        {/* כפתור הוספה */}
        <button type="button" className="btn-primary" onClick={handleOpenAddModal}>
          <UserPlus size={18} />
          <span>הוסף חניך חדש</span>
        </button>
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
                const getDormColor = (dormName) => {
                  if (dormName === 'קסיופיה') return '#3b82f6';
                  if (dormName === 'קומביין') return '#10b981';
                  if (dormName === 'מונסון') return '#d97706';
                  return '#8b5cf6'; // אוטופיה
                };
                const dormColor = getDormColor(student.dorm);
                
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
              onClick={() => setIsModalOpen(false)}
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
                  >
                    <option value="קסיופיה">קסיופיה</option>
                    <option value="קומביין">קומביין</option>
                    <option value="מונסון">מונסון</option>
                    <option value="אוטופיה">אוטופיה</option>
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

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.5rem 1.25rem' }}
                >
                  ביטול
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  style={{ padding: '0.5rem 1.5rem' }}
                >
                  <Save size={16} />
                  <span>שמור פרטים</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
