# What's in this update

Drag each file into the matching path in your GitHub repo (same folder
structure as shown here), overwriting the existing file. Then in Apps
Script, redeploy a new version; on Vercel, it'll auto-redeploy on the git
push.

## 1. One vote per category per day (Male + Female separately)
- `backend/Voting.gs` — duplicate-vote check now keys on
  email + voting day + category, not just email + voting day
- `backend/Code.gs` — passes the category through to checkVoterStatus
- `frontend/src/api/api.js` — sends category with the status check
- `frontend/src/pages/Vote.jsx` — checks/display status per category
- `frontend/src/pages/VoteConfirmed.jsx` — updated confirmation copy

**You must redeploy the backend** (Deploy → Manage deployments → pencil →
New version → Deploy) for this half of the change to take effect — editing
files alone doesn't update the live URL.

## 2. Fixed header overlap on mobile
- `frontend/src/styles/layout.css` — below 560px wide, the logo/title and
  the nav links (Home / Contestants / Results) now stack vertically
  instead of compressing into each other.

## 3. Real official logo
- `frontend/public/lira-university-logo.png` — the actual Lira University
  logo you provided, with the white background made transparent (artwork
  itself untouched — no recoloring or distortion).
- `frontend/src/components/Header.jsx` — updated to reference the new
  `.png` instead of the old placeholder `.svg`.
- **Delete** the old `frontend/public/lira-university-logo.svg` from your
  repo — it's no longer referenced anywhere.
