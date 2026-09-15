# Lira University Pageantry — Official Voting Platform

A production-ready voting platform: a React (Vite) frontend and a Google
Apps Script backend backed by Google Sheets. The frontend is never trusted
for validation — every voting rule is enforced server side in Apps Script.

```
lira-pageantry-voting/
  backend/    → Google Apps Script project (.gs files + appsscript.json)
  frontend/   → React + Vite application
```

---

## 1. How it fits together

- **Google Sheets** is the private database (7 sheets — see below). It is
  never published publicly; only the Apps Script project (running as the
  deploying user) can read or write it.
- **Google Apps Script** is deployed as a Web App. It exposes a small,
  explicit set of named actions (never a generic spreadsheet passthrough).
  All voting rules, duplicate protection, rate limiting, and admin
  authorization live here.
- **React frontend** calls the Apps Script Web App URL with POST requests
  of the shape `{ action, payload }` and renders the UI. It holds no
  secrets and makes no trust decisions.
- **Authentication** uses Google Identity Services ("Sign in with Google").
  The frontend obtains an ID token; Apps Script re-verifies that token on
  every vote-affecting call via Google's `tokeninfo` endpoint, so the
  frontend can never spoof a voter's identity.

---

## 2. Google Cloud: create an OAuth Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/),
   create (or select) a project.
2. Go to **APIs & Services → Credentials → Create Credentials → OAuth
   client ID**.
3. Application type: **Web application**.
4. Under **Authorized JavaScript origins**, add the URL(s) you'll serve the
   frontend from (e.g. `http://localhost:5173` for local dev, and your
   production domain).
5. Copy the generated **Client ID** — you'll need it in two places (backend
   and frontend, see below).

---

## 3. Backend: deploy the Apps Script Web App

1. Go to [script.google.com](https://script.google.com) and create a new
   project (e.g. "Lira Pageantry Voting Backend").
2. Copy each file from `backend/` into the Apps Script editor as a matching
   file (`Config.gs`, `Utils.gs`, `Auth.gs`, `Security.gs`, `Voting.gs`,
   `Contestants.gs`, `Admin.gs`, `Code.gs`, `SetupSheets.gs`). Also open
   **Project Settings → appsscript.json** (enable "Show appsscript.json" in
   editor settings) and replace its content with `backend/appsscript.json`.
3. In `Auth.gs`, set `GOOGLE_CLIENT_ID` to the OAuth Client ID from step 2.
4. In `Config.gs`, set `ADMIN_EMAILS` to the Google account email(s) that
   should have administrator access.
5. Run the `setupDatabase` function once (select it in the function
   dropdown in the toolbar, click **Run**). On first run you'll be asked to
   authorize the script — review and accept the permissions. This creates a
   new, private Google Spreadsheet with all 7 sheets, headers, default
   settings, and protections, and saves its ID to Script Properties
   automatically.
6. (Optional) Run `seedSampleContestants` once to add two test contestants.
7. Open the newly created spreadsheet (its URL is printed in the **Execution
   log**, `View → Logs`) and fill in the **Settings** sheet: at minimum set
   `start_datetime` and `end_datetime` (ISO 8601, e.g.
   `2026-10-01T08:00:00+03:00`), or configure these later from the admin
   dashboard's Voting Control tab instead.
8. **Deploy → New deployment → Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**, then copy the **Web app URL** (ends in `/exec`).

Re-deploy (Manage deployments → Edit → New version) any time you change the
backend code — editing files alone does not update a live deployment.

---

## 4. Frontend: configure and run

```bash
cd frontend
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=<the /exec Web App URL from step 3.8>
VITE_GOOGLE_CLIENT_ID=<the OAuth Client ID from step 2>
```

Install and run locally:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

This produces a static `dist/` folder you can host anywhere (e.g. your
university's web hosting, Cloudflare Pages, Netlify, GitHub Pages). No
server runtime is required for the frontend — it only talks to the Apps
Script Web App.

### Replace the placeholder logo

`frontend/public/lira-university-logo.svg` is a **placeholder only**.
Replace this file with the official Lira University logo asset (same
filename, or update the `src` in `frontend/src/components/Header.jsx`) —
do not recolor, distort, or recreate the official logo.

---

## 5. Google Sheets database structure

| Sheet | Columns |
|---|---|
| **Voters** | voter_id, email, email_verified, device_hash, first_seen, last_vote_date, status, created_at |
| **Votes** | vote_id, voter_id, email_hash, contestant_id, contestant_name, category, voting_day, timestamp, device_hash, status |
| **Contestants** | contestant_id, contestant_number, name, category, biography, photo_url, status, created_at, updated_at |
| **Settings** | setting, value |
| **AuditLog** | timestamp, admin, action, target, details |
| **SuspiciousActivity** | timestamp, email_hash, device_hash, event, risk_level, details, status |
| **DailyResults** | voting_day, contestant_id, contestant_name, category, vote_count, last_updated |

The Votes, Voters, and AuditLog sheets are sheet-protected on creation so
they cannot be edited manually by mistake — only the Apps Script backend
(running as the deploying user) writes to them.

---

## 6. Administrator setup

1. Add each administrator's Google account email to `ADMIN_EMAILS` in
   `Config.gs` and re-deploy the backend.
2. Administrators go to `/admin` on the frontend, sign in with Google, and
   are routed to the dashboard if their email is authorized.
3. From **Voting Control**, set the start/end date-time and timezone
   (defaults to `Africa/Kampala`). Voting opens and closes automatically —
   no manual start/stop action is needed.
4. Add contestants from the **Contestants** tab.
5. After the configured end time passes, voting closes automatically. Go to
   **Final Results** and click **Calculate & Release Final Results** to
   publish the overall standings on the public `/results` page.

---

## 7. Testing checklist

- [ ] Sign in with a test Google account and cast a vote; confirm it's
      recorded in the **Votes** sheet and the confirmation page shows the
      correct reference.
- [ ] Attempt to vote again with the same account the same day — confirm
      you see "You have already voted today."
- [ ] Change your system clock or wait until after midnight
      `Africa/Kampala`; confirm the same account can vote again the next
      voting day.
- [ ] Try voting before `start_datetime` and after `end_datetime` — confirm
      the correct "not started" / "closed" messages appear.
- [ ] As a non-admin Google account, try visiting `/admin` — confirm access
      is denied.
- [ ] As an admin, confirm Overview, Daily Results (with pie chart), Voters
      (masked emails), Suspicious Activity, and Audit Logs all load.
- [ ] Confirm `/results` shows "not yet available" while voting is active,
      and shows standings only after **Release Final Results** is clicked
      post-close.
- [ ] Load the site on a phone-sized viewport and confirm the landing page,
      contestant cards, and voting flow are usable one-handed.

---

## 8. Operational notes

- **Rate limiting & abuse signals**: enforced server side
  (`Security.gs`) using `CacheService` for short-window throttling and
  `LockService` for atomic, race-free vote recording. Device hashing is an
  additional signal only — the binding rule is always one verified email
  per voting day.
- **Data integrity**: votes are never deleted or overwritten; disabling a
  contestant only changes their `status`, so historical results remain
  reproducible.
- **Backups**: since Apps Script writes to a normal Google Sheet, you can
  use Google Sheets' built-in **File → Version history**, or periodically
  duplicate the spreadsheet, for backups. Admins can also export vote
  records via the `adminExportVotes` action.
- **Capacity**: the design (incremental `DailyResults` updates, indexed
  lookups by voting day, `LockService` only around the critical write)
  comfortably supports the target of ~2,000 votes/day and ~28,000 votes
  across a 14-day event, provided the spreadsheet is not manually edited
  concurrently by others.
