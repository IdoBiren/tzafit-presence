import React from 'react';
import { AlertOctagon, ShieldAlert } from 'lucide-react';

const Header = ({ emergencyActive, onToggleEmergency }) => {
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

        <div className="header-meta">
          {/* כפתור הפעלת חירום */}
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
        </div>
      </div>
    </header>
  );
};

export default Header;
