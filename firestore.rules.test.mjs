// בדיקת התנהגות firestore.rules מול אמולטור אמיתי - לא רק בדיקת תחביר.
// מריצים עם: npm run test:rules
// דורש JDK מותקן (האמולטור הוא תהליך Java).
//
// כל שורה היא deny או allow צפוי, כמפורט בטבלת האימות בתוכנית.
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import { readFileSync } from 'node:fs';
import {
  doc,
  setDoc,
  updateDoc,
  getDocs,
  collection,
} from 'firebase/firestore';

const PROJECT_ID = 'tzafit-presence-rules-test';

let failures = 0;
let passed = 0;

const check = async (label, promise, expect) => {
  let ok;
  try {
    if (expect === 'allow') {
      await assertSucceeds(promise);
      ok = true;
    } else {
      await assertFails(promise);
      ok = true;
    }
  } catch (err) {
    ok = false;
  }
  if (ok) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failures++;
    console.log(`  FAIL  ${label}  (expected ${expect})`);
  }
};

const run = async () => {
  const testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });

  // --- קו בסיס: משתמשים ומסמכי היסטוריה/חירום קיימים, כמו שהאפליקציה מצפה ---
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users', 'admin-uid'), {
      uid: 'admin-uid', role: 'admin', group: 'כללי', displayName: 'מנהל',
    });
    await setDoc(doc(db, 'users', 'counselor-uid'), {
      uid: 'counselor-uid', role: 'counselor', group: 'פניקס', displayName: 'מדריך',
    });
    await setDoc(doc(db, 'users', 'other-counselor-uid'), {
      uid: 'other-counselor-uid', role: 'counselor', group: 'קומביין', displayName: 'מדריך אחר',
    });
    await setDoc(doc(db, 'users', 'pending-uid'), {
      uid: 'pending-uid', role: 'counselor', group: '', displayName: 'ממתין',
    });
    await setDoc(doc(db, 'history', '2026-08-27_evening'), {
      date: '2026-08-27', session: 'evening', records: {}, markedBy: 'seed', timestamp: new Date(0).toISOString(),
    });
    await setDoc(doc(db, 'emergency', 'state'), {
      active: false, reason: '', triggeredAt: null, records: {},
    });
  });

  const admin = testEnv.authenticatedContext('admin-uid').firestore();
  const counselor = testEnv.authenticatedContext('counselor-uid').firestore();
  const pending = testEnv.authenticatedContext('pending-uid').firestore();
  const newUser = testEnv.authenticatedContext('new-uid').firestore();

  console.log('users/{uid} - קביעת תפקיד עצמית');
  await check(
    'מדריך כותב role:admin למסמך שלו',
    updateDoc(doc(counselor, 'users', 'counselor-uid'), { role: 'admin' }),
    'deny'
  );
  await check(
    'נרשם חדש יוצר את עצמו עם role:admin',
    setDoc(doc(newUser, 'users', 'new-uid'), { uid: 'new-uid', role: 'admin', group: 'כללי', displayName: 'תוקף' }),
    'deny'
  );
  await check(
    'נרשם חדש יוצר את עצמו כ-counselor/group ריק',
    setDoc(doc(newUser, 'users', 'new-uid'), { uid: 'new-uid', role: 'counselor', group: '', displayName: 'חדש' }),
    'allow'
  );
  await check(
    'מדריך משנה displayName של עצמו',
    updateDoc(doc(counselor, 'users', 'counselor-uid'), { displayName: 'שם חדש' }),
    'allow'
  );
  await check(
    'מדריך עושה list על users',
    getDocs(collection(counselor, 'users')),
    'deny'
  );
  await check(
    'אדמין משנה role של מדריך אחר',
    updateDoc(doc(admin, 'users', 'other-counselor-uid'), { role: 'admin', group: 'כללי' }),
    'allow'
  );

  console.log('students / history - שער האישור');
  await check(
    'ממתין (group ריק) כותב ל-history',
    setDoc(doc(pending, 'history', '2026-08-28_morning'), { date: '2026-08-28', session: 'morning', records: {}, markedBy: 'x', timestamp: '' }),
    'deny'
  );
  await check(
    'ממתין כותב ל-students',
    setDoc(doc(pending, 'students', '999'), { id: '999', name: 'תוקף', dorm: 'פניקס' }),
    'deny'
  );
  await check(
    'מדריך מאושר כותב ל-history',
    updateDoc(doc(counselor, 'history', '2026-08-27_evening'), { records: { '1': 'present' } }),
    'allow'
  );

  console.log('emergency/state - פיצול הרשאות');
  await check(
    'מדריך מסמן records בחירום',
    updateDoc(doc(counselor, 'emergency', 'state'), { records: { '1': true } }),
    'allow'
  );
  await check(
    'מדריך משנה active בחירום',
    updateDoc(doc(counselor, 'emergency', 'state'), { active: true }),
    'deny'
  );
  await check(
    'אדמין משנה active בחירום',
    updateDoc(doc(admin, 'emergency', 'state'), { active: true, reason: 'תרגיל', triggeredAt: new Date(0).toISOString() }),
    'allow'
  );

  await testEnv.cleanup();

  console.log(`\n${passed} עברו, ${failures} נכשלו`);
  process.exit(failures > 0 ? 1 : 0);
};

run();
