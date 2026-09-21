import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

import Landing from './pages/Landing.jsx';
import Contestants from './pages/Contestants.jsx';
import ContestantProfile from './pages/ContestantProfile.jsx';
import Vote from './pages/Vote.jsx';
import VoteConfirmed from './pages/VoteConfirmed.jsx';
import Results from './pages/Results.jsx';
import TodayResults from './pages/TodayResults.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicLayout><Landing /></PublicLayout>} />
      <Route path="/contestants" element={<PublicLayout><Contestants /></PublicLayout>} />
      <Route path="/contestants/:contestantId" element={<PublicLayout><ContestantProfile /></PublicLayout>} />
      <Route path="/vote" element={<PublicLayout><Vote /></PublicLayout>} />
      <Route path="/vote/:contestantId" element={<PublicLayout><Vote /></PublicLayout>} />
      <Route path="/vote-confirmed" element={<PublicLayout><VoteConfirmed /></PublicLayout>} />
      {/*<Route path="/today" element={<PublicLayout><TodayResults /></PublicLayout>} />*/}
      <Route path="/results" element={<PublicLayout><Results /></PublicLayout>} />
      <Route path="*" element={<PublicLayout><NotFound /></PublicLayout>} />
    </Routes>
  );
}

function PublicLayout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
