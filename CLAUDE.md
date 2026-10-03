# CLAUDE.md

Hebrew, RTL, mobile-first attendance + emergency roll-call app for the Tzafit boarding school. React 19 + Vite 8, Firebase (Firestore + Google Auth), no router, no TypeScript, no state library. README.md has the full feature/architecture tour — read it first; this file is the short list of things that bite.

## Commands

| | |
|---|---|
| `npm run dev` | Vite on :5173 (also `.claude/launch.json` → `tzafit-dev`) |
| `npm run lint` | ESLint — must stay clean; CI doesn't run it, so run it yourself |
| `npm run build` | Must pass. The >500 kB chunk warning is known (firebase in the main chunk) |
| `npm run test:rules` | Behavioral tests of `firestore.rules` against the emulator. Needs Java (JDK) + firebase-tools. Only test suite in the repo |

There are no unit/component tests. Verify UI changes in the browser preview.

## ⚠️ Local dev talks to production

`.env.local` points at the real Firebase project `tzafit-presence`. `npm run dev` reads and writes **live data** used by counselors. Don't test destructive flows (reset roster, delete students/users, start emergency, rename group) locally unless the user OKs it. There is no staging project.

Without `.env.local`, `storage.js` falls back to localStorage, but `Login.jsx` shows only a "not configured" notice — there's no demo login button. Demo mode only works if `sessionStorage.tzafit_demo_user` is already set.

## Deploy

Push to `main` → `.github/workflows/deploy.yml` builds and deploys **Hosting only** to the live channel. Every push to `main` is a production release. Branch for non-trivial work.

`firestore.rules` is **not** deployed by CI. After changing rules: run `npm run test:rules`, then the user deploys with `firebase deploy --only firestore:rules`. If app code depends on a rules change (e.g. a new collection), rules must go out before or with the hosting deploy, or the feature fails with permission-denied in prod.

## Architecture in one breath

- `src/App.jsx` owns all state and realtime subscriptions (students, history, emergency, groupNames, own user profile), the auth gate (loading → Login → NameSetup → GroupPending → app) and tab switching. Secondary tabs are `lazy()` and stay mounted (hidden with CSS) once visited.
- `src/utils/storage.js` is the data layer. **Every exported function has two implementations** — Firestore and localStorage — branched on `isFirebaseConfigured`. When you add or change one, change both. Components never import Firebase directly (exception: `Login.jsx` for `signInWithPopup`).
- `firestore.rules` is the only real permission boundary. All role/group checks in the UI are cosmetic. Any new collection needs a rule (default is deny-all) and a case in `firestore.rules.test.mjs`.

## Data model

`students/{id}`, `history/{date}_{session}` (`records: {studentId: present|absent|leave|null}`), `emergency/state` (singleton), `users/{uid}`, `settings/groups` (`{names: [4 strings]}`).

- Sessions: `morning, afternoon, evening, night` (UI: פתיחת יום / ארוחת ערב / כיבוי אורות / לילה). `SESSION_ORDER` in storage.js.
- `history` is sorted chronologically (date, then session) by `sortHistoryChronologically`, **not** by `timestamp`. `history[0]` = "current round" for Dashboard.
- **The app only listens to the last `HISTORY_WINDOW_DAYS` (30) of history** (`where('date', '>=', cutoff)`). The project is on the free Spark plan (50K reads/day, and the app *stops working* when it runs out), and every app open reads every doc in the listener — so never widen a listener to an unbounded, growing collection. Dashboard averages and chronic absences cover the window only; CSV export fetches all history once via `fetchAllHistory`. Watch usage in Firebase Console → Firestore → Usage.
- Group names are dynamic (`settings/groups`), renamable by admins via `renameGroup` (atomic batch over settings + students.dorm + users.group). Don't hardcode dorm names — use the `groupNames` prop. Dorm color is by slot index: `utils/dormColors.js`. `'כללי'` (all groups) and `'הכל'` (UI "all" filter) are reserved tokens, not group names.
- User `group === ''` means pending approval; rules deny everything to pending users. New sign-ups are forced to `role: 'counselor', group: ''` by the rules. **There is no hardcoded admin** — the first admin is set by hand in the Firebase console.

## Known pitfalls

- **Multi-writer docs: write single fields, never the whole doc.** Attendance uses `setDoc(..., {merge: true})` with one student; emergency marks use `updateEmergencyRecords` (`updateDoc` on `records.<id>`). `saveEmergencyState` (full `setDoc`) is only for start/end of an emergency — don't use it for per-student marks, or concurrent counselors overwrite each other.
- `saveStudents` rewrites the entire collection (sets every doc, deletes missing ones). Fine for 133 rows; don't copy it for per-item edits.
- **No cloud auto-seeding.** An empty `students` or `history` collection stays empty (a new school year starts that way). The built-in roster (`MOCK_STUDENTS`) is only written by the admin "reset to defaults" button, and fake random history only exists in localStorage demo mode. Don't reintroduce seeding on empty snapshots — it undoes deliberate deletions and writes fake attendance to production.
- localStorage keys are versioned (`tzafit_students_v8`, `tzafit_history_v7`, …). Bump the version when the stored shape changes.
- `react-hooks` lint rules are strict (no set-state-in-effect). The codebase uses the "adjust state during render" pattern instead (see `dormSyncKey` in RollCall, `visitedTabs` in App). Match it.

## Conventions

- UI text and code comments are in **Hebrew**; comments explain *why*. Commit messages are English, imperative, one line summary (see `git log`).
- Styling: CSS variables/classes in `src/index.css` plus inline style objects per component. No CSS framework.
- User feedback: `useToast()` from `ToastProvider` and `ConfirmModal` — prefer these over `alert`/`window.confirm` (some old call sites still use the latter).
- Mobile first: counselors use phones. Keep touch targets large; check layout at 375px.
