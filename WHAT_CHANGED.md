# What's in this update

Drag each file into the matching path in your GitHub repo (same folder
structure as shown here), overwriting the existing file. Then in Apps
Script, redeploy a new version; on Vercel, it'll auto-redeploy on the git
push.

## 0. Combined ballot — pick one Female + one Male, submit once
- `backend/Voting.gs` — new `submitVotes_()` verifies the voter's Google
  sign-in **once**, validates both picks, and writes both vote rows inside
  a single lock, instead of two full round trips through `submitVote_()`.
- `backend/Code.gs` — new `submitVotes` action registered.
- `frontend/src/api/api.js` — new `api.submitVotes()` client call.
- `frontend/src/pages/Vote.jsx` — rewritten: `/vote` now shows every
  active contestant grouped by Female / Male as tappable tiles (radio
  behavior — tap to select, tap again to deselect); one **Submit My
  Votes** button at the bottom submits both selections together. Loading
  is faster because the contestant list, voting-window status, and voter
  status are all fetched in parallel instead of waterfalled, and
  selecting a tile is instant (no network call) — only Submit hits the
  network.
- `frontend/src/pages/VoteConfirmed.jsx` — now lists one or two recorded
  votes from a single confirmation.
- `frontend/src/App.jsx` — added a plain `/vote` route; `/vote/:contestantId`
  still works and now just pre-selects that contestant on the same ballot.
- `frontend/src/components/ContestantCard.jsx`,
  `frontend/src/pages/ContestantProfile.jsx` — "Vote" buttons relabeled
  "Add to Ballot" since tapping one no longer immediately casts a vote.
- `frontend/src/styles/layout.css` — new styles for the selectable ballot
  tiles.

**You must redeploy the backend** (Deploy → Manage deployments → pencil →
New version → Deploy) for this to work — the frontend now calls a
`submitVotes` action that only exists after you redeploy `Code.gs` /
`Voting.gs`.

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
