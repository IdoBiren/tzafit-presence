# נוכחות פנימיית צפית — Tzafit Attendance

A Hebrew, RTL, mobile-first web app for boarding-school (`פנימייה`) attendance and emergency roll-call. Counselors (`מדריכים`) mark students present/absent/at-home from a phone or tablet; every change syncs to all devices in real time. Admins can trigger an institution-wide emergency headcount that instantly takes over every counselor's screen.

Built with React 19 + Vite, backed by Firebase (Firestore + Google Auth), with a full `localStorage` fallback so the app runs without any cloud setup.

---

## Features

- **Roll call** — four daily rounds (`פתיחת יום`, `ארוחת ערב`, `כיבוי אורות`, `לילה`), three statuses per student (`נוכח` / `חסר` / `בבית`). Tap-to-clear on the active status. Sorting defaults to unmarked-first so nobody gets skipped.
- **Real-time auto-save** — each tap writes only that one student's field (`setDoc` with `merge: true`), so several counselors can mark the same round at once without overwriting each other.
- **Emergency mode** — an admin activates it with a reason; every registered student starts as unverified, regardless of the last round — a student wrongly marked at home, or never marked, still has to be accounted for. All screens update live as students are confirmed safe, with a two-column verified/unverified split and a progress bar.
- **Dashboard & reports** — live counters, a clickable pie chart per dorm group (click a slice to list those students by name), a 7-round attendance trend, a chronic-absence table (`<92%`) with tap-to-call parent links, and CSV export of the full history with a UTF-8 BOM so Hebrew opens correctly in Excel. Live stats cover the last 30 days (see Known quirks).
- **Staff & permissions** — Google sign-in, one-time display-name setup, and an admin screen for assigning each new counselor a role and a dorm group. New counselors wait on a pending screen until an admin assigns them.
- **Student management** — add, edit, delete students (name, dorm, room, parent name/phone, notes), or reset the roster to the built-in default list.
- **Group renaming** — admins can rename any of the four dorm groups; students and staff assigned to it are updated in one atomic batch.

---

## Tech stack

| | |
|---|---|
| Framework | React 19 (no router — a single tab-switch in `App.jsx`) |
| Build | Vite 8 |
| Backend | Firebase — Firestore (realtime listeners) + Auth (Google popup) |
| Charts | recharts (pie charts) + a hand-rolled CSS bar chart |
| Icons | lucide-react |
| Styling | `index.css` (CSS custom properties + classes), plus inline style objects per component |

No TypeScript, no state-management library — all state lives in `App.jsx` and flows down as props. The only automated tests are the Firestore rules tests (`npm run test:rules`).

---

## Getting started

```bash
npm install
```

Create a `.env.local` in the project root with your Firebase web-app config:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

```bash
npm run dev
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run test:rules` | Run `firestore.rules.test.mjs` against the Firestore emulator (needs Java + firebase-tools) |

### Running without Firebase

`isFirebaseConfigured` is simply `!!VITE_FIREBASE_PROJECT_ID`. If it's missing, every function in `utils/storage.js` transparently falls back to `localStorage`, and the app seeds two demo users (one admin, one counselor). Google sign-in is disabled in this mode — the login screen shows a "not configured" notice instead.

### Firebase project setup

1. Enable **Google** as a sign-in provider in Authentication.
2. Add your dev and production domains to the authorized-domains list.
3. Deploy the security rules: `firebase deploy --only firestore:rules` — see [Security](#security) below.
4. Sign in once, then promote yourself to admin by hand in the Firestore console (`users/{uid}` → `role: "admin"`, `group: "כללי"`). There is no built-in admin account.

> Note: the committed `.firebaserc` points at the production project `tzafit-presence`. A `.env.local` with those keys means `npm run dev` reads and writes live data.

### Deployment

Every push to `main` builds and deploys Firebase **Hosting** via `.github/workflows/deploy.yml` (Firebase config comes from repository secrets). Firestore rules are **not** deployed by CI — deploy them manually after changing `firestore.rules`.

Collections are created automatically on first run: if `students` or `history` come back empty, the app batch-seeds the built-in 133-student roster and 7 days of randomly generated attendance history.

---

## Architecture

```
index.html  (lang="he" dir="rtl")
  └── main.jsx
        └── App.jsx ......... all app state + tab switching + auth gate
              ├── utils/firebase.js ... SDK init, exports isFirebaseConfigured
              └── utils/storage.js .... data layer: Firestore  ⇄  localStorage
```

`App.jsx` opens four realtime listeners on mount — students, history, emergency state, and the signed-in user's own profile — and passes the data down as props. Writes go back up through handler props (`onSaveStudents`, `onUpdateSingleAttendance`, …), which call `storage.js` and flip a floating "syncing" indicator.

**`utils/storage.js` is the key file.** Every exported function branches on `isFirebaseConfigured` and implements the same operation twice — once against Firestore, once against `localStorage`. Components never import Firebase directly, so the whole app is storage-agnostic.

### Auth & onboarding gate

`App.jsx` renders a chain of early returns before the main UI:

```
loading spinner
  → Login          (not signed in)
  → NameSetup      (needsNameSetup)
  → GroupPending   (counselor with no group assigned yet)
  → the app
```

Every new sign-up is created as a `counselor` with no group (the security rules reject anything else) and waits for an admin to assign one in the staff screen. Admins are promoted by another admin, or by hand in the Firebase console.

### Data model (Firestore)

| Collection | Doc ID | Shape |
|---|---|---|
| `students` | `"1"`, `"2"`, … | `{ id, name, dorm, room, parentName, parentPhone, notes }` |
| `history` | `` `${date}_${session}` `` | `{ date, session, records: { [studentId]: "present"\|"absent"\|"leave"\|null }, markedBy, timestamp }` |
| `emergency` | `state` (singleton) | `{ active, reason, triggeredAt, records: { [studentId]: boolean } }` |
| `settings` | `groups` (singleton) | `{ names: [string, string, string, string] }` — the dorm group names, renamable by admins |
| `users` | Firebase Auth `uid` | `{ uid, displayName, email, photoURL, role, group, needsNameSetup, createdAt }` |

`role` is `"admin"` or `"counselor"`. `group` is one of the names in `settings/groups` (default `פניקס`, `קומביין`, `סקויה`, `סהרה`) or `כללי` for full access; empty means *pending assignment*. Dorm colors are tied to the slot index in `settings/groups`, so they survive a rename (`utils/dormColors.js`).

The emergency doc being a **single document** is what makes the shared live checklist work — one `onSnapshot` and every device sees every other counselor's confirmations immediately.

### Components

| File | Role |
|---|---|
| `App.jsx` | State, realtime subscriptions, auth gate, tab switching, nav bar |
| `Header.jsx` | Title bar, user avatar, role badge, logout |
| `RollCall.jsx` | The main screen: date/session picker, filters, student cards, auto-save |
| `Dashboard.jsx` | Stats, pie charts per group, trend chart, chronic absences, CSV export |
| `EmergencyMode.jsx` | Emergency activation form and the live safe/unverified checklist |
| `StudentManager.jsx` | Student CRUD and roster reset |
| `StaffManager.jsx` | Admin-only: assign roles and groups, delete users |
| `Login.jsx` | Google sign-in |
| `NameSetup.jsx` | One-time display-name prompt |
| `GroupPending.jsx` | Waiting screen for counselors without a group |
| `ToastProvider.jsx` | `useToast()` — shared toast notifications |
| `ConfirmModal.jsx` | Shared confirmation dialog |

---

## Security

**All role and group checks in the app are client-side only** — they control what the UI shows, not what the database allows. The real access boundary is [`firestore.rules`](firestore.rules), tested by `firestore.rules.test.mjs`. In short:

- a user with no group (pending) can read or write nothing except their own `users` doc;
- users can never change their own `role` or `group`; new sign-ups must be `counselor` with an empty group;
- approved counselors can read/write `students` and `history` (no deletes on `history`), and mark students safe in `emergency/state` — only admins can start or end an emergency;
- only admins can list/edit other users and change `settings/groups`;
- anything else is denied.

Note that a counselor's assigned group only sets the *default* filter in the UI — it does not prevent them from switching the filter and marking another group. Treat group assignment as convenience, not as a permission.

`.env.local` is gitignored. Firebase web API keys are not secrets (they ship in the client bundle), so the protection has to come from the rules and the authorized-domains list.

---

## Known quirks

Worth knowing before changing behavior:

- **Only the last 30 days of history are loaded live** (`HISTORY_WINDOW_DAYS` in `storage.js`), to stay inside the free Firestore plan's 50K reads/day. The attendance average and chronic-absence table reflect that window; CSV export still fetches everything. The roll-call date picker doesn't go further back.
- **`history[0]` is "the current round."** History is sorted by date + session order (not by write time), and the dashboard treats the first entry as current state.
- **`setActiveTab` is called during render** in `App.jsx`'s tab-permission guard — intentional "adjust state during render" pattern, not an effect.
- The seeded demo history is generated with `Math.random()`, so a fresh cloud project starts with plausible-looking but entirely fictional attendance data.
- Without Firebase config there's no way to sign in from the login screen; the localStorage fallback only works with a demo user already in `sessionStorage`.
