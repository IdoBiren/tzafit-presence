# נוכחות פנימיית צפית — Tzafit Attendance

A Hebrew, RTL, mobile-first web app for boarding-school (`פנימייה`) attendance and emergency roll-call. Counselors (`מדריכים`) mark students present/absent/at-home from a phone or tablet; every change syncs to all devices in real time. Admins can trigger an institution-wide emergency headcount that instantly takes over every counselor's screen.

Built with React 19 + Vite, backed by Firebase (Firestore + Google Auth), with a full `localStorage` fallback so the app runs without any cloud setup.

---

## Features

- **Roll call** — four daily rounds (`פתיחת יום`, `ארוחת ערב`, `כיבוי אורות`, `לילה`), three statuses per student (`נוכח` / `חסר` / `בבית`). Tap-to-clear on the active status. Sorting defaults to unmarked-first so nobody gets skipped.
- **Real-time auto-save** — each tap writes only that one student's field (`setDoc` with `merge: true`), so several counselors can mark the same round at once without overwriting each other.
- **Emergency mode** — an admin activates it with a reason; the checklist is seeded *only* with students who were present in the most recent round, so the team isn't hunting for kids already at home. All screens update live as students are confirmed safe, with a two-column verified/unverified split and a progress bar.
- **Dashboard & reports** — live counters, a clickable pie chart per dorm group (click a slice to list those students by name), a 7-round attendance trend, a chronic-absence table (`<92%`) with tap-to-call parent links, and CSV export with a UTF-8 BOM so Hebrew opens correctly in Excel.
- **Staff & permissions** — Google sign-in, one-time display-name setup, and an admin screen for assigning each new counselor a role and a dorm group. New counselors wait on a pending screen until an admin assigns them.
- **Student management** — add, edit, delete students (name, dorm, room, parent name/phone, notes), or reset the roster to the built-in default list.

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

No TypeScript, no test suite, no state-management library — all state lives in `App.jsx` and flows down as props.

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

### Running without Firebase

`isFirebaseConfigured` is simply `!!VITE_FIREBASE_PROJECT_ID`. If it's missing, every function in `utils/storage.js` transparently falls back to `localStorage`, and the app seeds two demo users (one admin, one counselor). Google sign-in is disabled in this mode — the login screen shows a "not configured" notice instead.

### Firebase project setup

1. Enable **Google** as a sign-in provider in Authentication.
2. Add your dev and production domains to the authorized-domains list.
3. Write Firestore security rules — see [Security](#security) below.

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

Admins are granted by a hardcoded email check in `getOrCreateUserRole` (`utils/storage.js`). Everyone else is created as a `counselor` with no group and waits for an admin to assign one in the staff screen.

### Data model (Firestore)

| Collection | Doc ID | Shape |
|---|---|---|
| `students` | `"1"`, `"2"`, … | `{ id, name, dorm, room, parentName, parentPhone, notes }` |
| `history` | `` `${date}_${session}` `` | `{ date, session, records: { [studentId]: "present"\|"absent"\|"leave"\|null }, markedBy, timestamp }` |
| `emergency` | `state` (singleton) | `{ active, reason, triggeredAt, records: { [studentId]: boolean } }` |
| `users` | Firebase Auth `uid` | `{ uid, displayName, email, photoURL, role, group, needsNameSetup, createdAt }` |

`role` is `"admin"` or `"counselor"`. `group` is a dorm name (`פניקס`, `קומביין`, `סקויה`, `סהרה`) or `כללי` for full access; empty means *pending assignment*.

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
| `Analytics.jsx` | **Currently unused** — not imported anywhere |

---

## Security

**All role and group checks in this app are client-side only** — they control what the UI shows, not what the database allows. Firestore security rules are the only real access boundary, and they are configured in the Firebase console, not in this repo. At minimum, rules should:

- require authentication for every collection;
- let a user read their own `users` document but never write their own `role` or `group`;
- restrict writes to `users` and `emergency/state` to admins;
- allow authenticated counselors to write `history` and `students`.

Note that a counselor's assigned group only sets the *default* filter in the UI — it does not prevent them from switching the filter and marking another group. Treat group assignment as convenience, not as a permission.

`.env.local` is gitignored. Firebase web API keys are not secrets (they ship in the client bundle), so the protection has to come from the rules and the authorized-domains list.

---

## Known quirks

Worth knowing before changing behavior:

- **`history[0]` is "the current round."** History is ordered by `timestamp desc`, and every tap rewrites that record's timestamp. Editing an older round therefore moves it to position `0`, and both the dashboard counters and the emergency-mode seeding will start treating it as the current state.
- **Unmarked students are counted inconsistently** — the dashboard counts them as absent, while the CSV export counts them as present.
- **`setActiveTab` is called during render** in `renderTabContent`'s permission guards, which React warns about.
- The seeded demo history is generated with `Math.random()`, so a fresh cloud project starts with plausible-looking but entirely fictional attendance data.
