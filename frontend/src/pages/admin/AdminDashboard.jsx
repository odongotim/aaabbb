import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Overview from './sections/Overview.jsx';
import VotingControl from './sections/VotingControl.jsx';
import ContestantsAdmin from './sections/ContestantsAdmin.jsx';
import DailyResults from './sections/DailyResults.jsx';
import VotersAdmin from './sections/VotersAdmin.jsx';
import SuspiciousActivity from './sections/SuspiciousActivity.jsx';
import AuditLogs from './sections/AuditLogs.jsx';
import FinalResults from './sections/FinalResults.jsx';
import SettingsAdmin from './sections/SettingsAdmin.jsx';

const TABS = [
  { key: 'overview', label: 'Overview', Component: Overview },
  { key: 'voting-control', label: 'Voting Control', Component: VotingControl },
  { key: 'contestants', label: 'Contestants', Component: ContestantsAdmin },
  { key: 'daily-results', label: "Today's Votes & Daily Results", Component: DailyResults },
  { key: 'voters', label: 'Voters', Component: VotersAdmin },
  { key: 'suspicious', label: 'Suspicious Activity', Component: SuspiciousActivity },
  { key: 'audit', label: 'Audit Logs', Component: AuditLogs },
  { key: 'final-results', label: 'Final Results', Component: FinalResults },
  { key: 'settings', label: 'Settings', Component: SettingsAdmin }
];

export default function AdminDashboard() {
  const [active, setActive] = useState('overview');
  const { profile, signOut } = useAuth();
  const ActiveComponent = TABS.find((t) => t.key === active)?.Component || Overview;

  return (
    <div className="admin-shell">
      <aside className="admin-nav">
        <div className="admin-nav__header">
          <p className="eyebrow">Lira University</p>
          <p className="admin-nav__title">Pageantry Admin</p>
        </div>
        <nav aria-label="Admin sections">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`admin-nav__item ${active === t.key ? 'is-active' : ''}`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="admin-nav__footer">
          <p>{profile?.email}</p>
          <button className="link-button" onClick={signOut}>Sign out</button>
        </div>
      </aside>
      <main className="admin-content">
        <ActiveComponent />
      </main>
    </div>
  );
}
