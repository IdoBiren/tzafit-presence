const ConfirmModal = ({ open, title, message, confirmLabel = 'אישור', cancelLabel = 'ביטול', danger, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '420px' }}>
        <h3 className="modal-title">{title}</h3>
        <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</p>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            type="button"
            className="btn-primary"
            style={danger ? { backgroundColor: 'var(--absent)' } : undefined}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
