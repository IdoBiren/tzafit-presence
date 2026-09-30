// צבע קבוע לכל קבוצה לפי מיקום (slot) ב-settings/groups.names, לא לפי
// השם עצמו - כדי שהצבע יישאר יציב גם אחרי שינוי שם.
const DORM_PALETTE = ['#3b82f6', '#10b981', '#d97706', '#8b5cf6'];

export const getDormColor = (dorm, groupNames) => {
  const idx = (groupNames || []).indexOf(dorm);
  return DORM_PALETTE[idx] ?? DORM_PALETTE[DORM_PALETTE.length - 1];
};
