// חישובי לוח הבקרה - פונקציות טהורות, בלי React ובלי Firebase, כדי שאפשר
// יהיה לבדוק אותן ב-Node מול נתוני דמה.
//
// מונחים:
//   "סבב"      = מסמך history אחד: { date, session, records: { [studentId]: status } }
//   "יום פעילות" = יום שבו הפנימייה פתוחה וסבבי החובה אמורים להתבצע

// סבבי החובה בכל יום פעילות. סבב לילה מוצג אם התבצע אך אינו חובה.
export const REQUIRED_SESSIONS = ['morning', 'afternoon', 'evening'];
export const ALL_SESSIONS = ['morning', 'afternoon', 'evening', 'night'];

export const SESSION_LABELS = {
  morning: 'פתיחת יום',
  afternoon: 'ארוחת ערב',
  evening: 'כיבוי אורות',
  night: 'לילה'
};

// ימי הפעילות הקבועים (0 = ראשון). יום אחר שבו סומן משהו נחשב "יום מיוחד"
// ונספר גם הוא; יום קבוע שבו לא סומן כלום מוצג כ"אולי סגור" ולא כהחמצה -
// כך אין צורך לנהל לוח חגים.
export const DEFAULT_ACTIVE_WEEKDAYS = [0, 1, 3];

// משמעות הסטטוסים (הערך השמור לא השתנה, רק התצוגה):
//   'present' = נוכח - ראו אותו פיזית בסבב
//   'absent'  = "לא נמצא" - בפנימייה היום, אבל לא בסבב (חוג, טיפול). *אינו היעדרות*
//   'leave'   = בבית - לא בפנימייה היום
//   null      = טרם סומן - כולל חניך שאף אחד לא יודע איפה הוא
// לכן המדד הוא "אחוז בפנימייה" = (נוכח + לא נמצא) / כל המסומנים.
export const STATUS_LABELS = { present: 'נוכח', absent: 'לא נמצא', leave: 'בבית' };

export const PERIOD_DAYS = { day: 1, week: 7, month: 30 };

// ---------- תאריכים ----------

const pad = (n) => String(n).padStart(2, '0');

// YYYY-MM-DD לפי שעון המכשיר. toISOString() נותן UTC, ובישראל בין חצות
// ל-3:00 הוא מחזיר את התאריך של אתמול.
export const toLocalISO = (dateObj) =>
  `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}`;

export const todayLocalISO = () => toLocalISO(new Date());

const parseISO = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (iso, days) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + days);
  return toLocalISO(d);
};

export const weekdayOf = (iso) => parseISO(iso).getDay();

export const formatShortDate = (iso) => {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
};

const WEEKDAY_LETTERS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
export const weekdayLetter = (iso) => WEEKDAY_LETTERS[weekdayOf(iso)];

// כל התאריכים בתקופה, מהישן לחדש
export const getPeriodDates = (period, today = todayLocalISO()) => {
  const days = PERIOD_DAYS[period] || 1;
  const dates = [];
  for (let i = days - 1; i >= 0; i--) dates.push(addDays(today, -i));
  return dates;
};

// ---------- עזרים ----------

const indexHistory = (history) => {
  const index = {};
  (history || []).forEach(h => { index[`${h.date}_${h.session}`] = h; });
  return index;
};

const hasAnyMark = (record) =>
  !!record && Object.values(record.records || {}).some(v => v !== null && v !== undefined);

// חניך נספר בסבב רק אם כבר היה רשום ביום הזה. בלי זה חניך שנוסף באמצע
// החודש היה הופך כל סבב לפני שנוסף ל"חלקי".
const isOnRosterOn = (student, date) => {
  if (!student.createdAt) return true;
  return toLocalISO(new Date(student.createdAt)) <= date;
};

const rosterOn = (students, date, group) =>
  students.filter(s => (group === undefined || s.dorm === group) && isOnRosterOn(s, date));

// סוג היום:
//   'active'       - יום עם סימונים, או היום הנוכחי כשהוא יום פעילות קבוע
//   'maybe-closed' - יום פעילות קבוע (שעבר) בלי אף סימון
//   'off'          - יום שאינו יום פעילות ובלי סימונים
export const classifyDay = (date, historyIndex, today = todayLocalISO()) => {
  const marked = ALL_SESSIONS.some(s => hasAnyMark(historyIndex[`${date}_${s}`]));
  if (marked) return 'active';
  if (!DEFAULT_ACTIVE_WEEKDAYS.includes(weekdayOf(date))) return 'off';
  return date === today ? 'active' : 'maybe-closed';
};

// מצב סבב אחד לקבוצה אחת: כמה מהחניכים הרשומים סומנו
const roundStatus = (record, roster) => {
  const total = roster.length;
  const marked = record
    ? roster.filter(s => record.records?.[s.id] !== null && record.records?.[s.id] !== undefined).length
    : 0;
  let state = 'not-started';
  if (total === 0) state = 'empty-group';
  else if (marked === total) state = 'complete';
  else if (marked > 0) state = 'partial';
  return { marked, total, state };
};

// ---------- חישובים ללוח ----------

// השלמת סבבים: לכל קבוצה ולכל יום בתקופה - מצב כל סבב
// מחזיר { dates, days: { [date]: kind }, groups: [{ name, cells: { [date]: { kind, sessions, requiredDone, requiredTotal } } }] }
export const computeRoundCompletion = ({ students, history, groupNames, period, today = todayLocalISO() }) => {
  const index = indexHistory(history);
  const dates = getPeriodDates(period, today);
  const days = {};
  dates.forEach(date => { days[date] = classifyDay(date, index, today); });

  const groups = (groupNames || []).map(name => {
    const cells = {};
    dates.forEach(date => {
      const roster = rosterOn(students, date, name);
      const sessions = {};
      ALL_SESSIONS.forEach(session => {
        sessions[session] = roundStatus(index[`${date}_${session}`], roster);
      });
      const requiredDone = REQUIRED_SESSIONS.filter(s => sessions[s].state === 'complete').length;
      cells[date] = { kind: days[date], sessions, requiredDone, requiredTotal: REQUIRED_SESSIONS.length, rosterSize: roster.length };
    });
    return { name, cells };
  });

  return { dates, days, groups };
};

// ספירת סטטוסים בתקופה, רק לחניכים שהיו רשומים באותו יום
const countStatuses = (students, index, dates, filter = () => true) => {
  const counts = { present: 0, absent: 0, leave: 0 };
  // אילו חניכים (ייחודיים) קיבלו כל סטטוס - "3 חניכים בבית" ולא "9 סימונים"
  const studentsBy = { present: new Set(), absent: new Set(), leave: new Set() };
  dates.forEach(date => {
    ALL_SESSIONS.forEach(session => {
      const record = index[`${date}_${session}`];
      if (!record) return;
      rosterOn(students, date).filter(filter).forEach(s => {
        const status = record.records?.[s.id];
        if (status in counts) {
          counts[status]++;
          studentsBy[status].add(s.id);
        }
      });
    });
  });
  return { ...counts, studentsBy };
};

// אחוז בפנימייה: (נוכח + לא נמצא) מתוך כל המסומנים. null כשאין סימונים.
const inSchoolRate = ({ present, absent, leave }) => {
  const total = present + absent + leave;
  return total > 0 ? Math.round(((present + absent) / total) * 100) : null;
};

// ארבעת המספרים העליונים לתקופה
export const computeKpis = ({ students, history, groupNames, period, today = todayLocalISO() }) => {
  const index = indexHistory(history);
  const completion = computeRoundCompletion({ students, history, groupNames, period, today });
  const counts = countStatuses(students, index, completion.dates);

  // סבב חובה של קבוצה ביום פעילות = יחידה אחת. קבוצה ריקה ויום "אולי סגור" לא נספרים.
  let roundsDone = 0;
  let roundsExpected = 0;
  completion.groups.forEach(g => {
    completion.dates.forEach(date => {
      const cell = g.cells[date];
      if (cell.kind !== 'active' || cell.rosterSize === 0) return;
      roundsExpected += cell.requiredTotal;
      roundsDone += cell.requiredDone;
    });
  });

  return {
    inSchoolRate: inSchoolRate(counts),
    present: counts.present,
    notFound: counts.absent,
    leave: counts.leave,
    notFoundStudents: counts.studentsBy.absent.size,
    homeStudents: counts.studentsBy.leave.size,
    roundsDone,
    roundsExpected
  };
};

// אחוז בפנימייה יומי לכל קבוצה ולכל הפנימייה - רק ימים שבהם התבצע רישום
export const computeDailyTrend = ({ students, history, groupNames, period, today = todayLocalISO() }) => {
  const index = indexHistory(history);

  return getPeriodDates(period, today)
    .filter(date => ALL_SESSIONS.some(s => hasAnyMark(index[`${date}_${s}`])))
    .map(date => {
      const point = {
        date,
        label: `${weekdayLetter(date)} ${formatShortDate(date)}`,
        overall: inSchoolRate(countStatuses(students, index, [date]))
      };
      (groupNames || []).forEach(g => {
        point[g] = inSchoolRate(countStatuses(students, index, [date], s => s.dorm === g));
      });
      return point;
    });
};

// חניכים שסומנו "לא נמצא" בתקופה, עם הסיבות. מידע בלבד - לא היעדרות.
// ממוינים ממי שלא נמצא הכי הרבה פעמים; reasons מקובצות ("חוג" x4),
// ופעמים בלי סיבה נספרות בנפרד - שם כדאי לברר.
export const computeNotFound = ({ students, history, period, today = todayLocalISO() }) => {
  const index = indexHistory(history);
  const dates = getPeriodDates(period, today);

  return students
    .map(student => {
      const occurrences = []; // [{ date, session, note }]
      dates.forEach(date => {
        if (!isOnRosterOn(student, date)) return;
        ALL_SESSIONS.forEach(session => {
          const record = index[`${date}_${session}`];
          if (record?.records?.[student.id] === 'absent') {
            occurrences.push({ date, session, note: record.notes?.[student.id] || '' });
          }
        });
      });
      const reasonCounts = {};
      let withoutReason = 0;
      occurrences.forEach(o => {
        if (o.note) reasonCounts[o.note] = (reasonCounts[o.note] || 0) + 1;
        else withoutReason++;
      });
      const reasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);
      return {
        ...student,
        count: occurrences.length,
        occurrences,
        reasons,
        withoutReason,
        last: occurrences[occurrences.length - 1] || null
      };
    })
    .filter(s => s.count > 0)
    .sort((a, b) => b.count - a.count || b.withoutReason - a.withoutReason);
};
