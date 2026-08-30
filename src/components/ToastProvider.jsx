import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timeouts = useRef(new Map());

  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    clearTimeout(timeouts.current.get(id));
    timeouts.current.delete(id);
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    timeouts.current.set(id, setTimeout(() => dismissToast(id), duration));
    return id;
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.type}`}>
            {t.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{t.message}</span>
            <button type="button" className="toast-close" onClick={() => dismissToast(t.id)} aria-label="סגור הודעה">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// שיתוף hook לצד ה-provider בקובץ אחד - הרגל React נפוץ. פוגע רק ב-Fast
// Refresh בזמן פיתוח (עריכה בקובץ הזה תגרום לרענון מלא במקום החלפה חמה),
// לא בהתנהגות בפרודקשן.
// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};
