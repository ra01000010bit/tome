import { useEffect, useState, lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { hydrateFromServer, useStore } from './engine/store.js';
import { readAuth } from './engine/storage.js';
import { startCardPreloader } from './engine/preloadCards.js';
import { CARDS } from './theme.js';
import Layout from './components/Layout.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import SplashGate from './components/SplashGate.jsx';
import UserGate from './components/UserGate.jsx';

// Route-level lazy loading — kezdetben csak a Home jön, a többi on-demand.
// A <Suspense fallback> a Layout belsejében van, hogy a lazy-load spinner alatt
// is megmaradjon a BottomNav (különben a felhasználó látszólag elveszti a navigációt).
const Home           = lazy(() => import('./screens/Home.jsx'));
const SubjectView    = lazy(() => import('./screens/SubjectView.jsx'));
const Quiz           = lazy(() => import('./screens/Quiz.jsx'));
const LessonComplete = lazy(() => import('./screens/LessonComplete.jsx'));
const Collection         = lazy(() => import('./screens/Collection.jsx'));
const Settings       = lazy(() => import('./screens/Settings.jsx'));
const WeakPoints     = lazy(() => import('./screens/WeakPoints.jsx'));
const FlashcardBrowse = lazy(() => import('./screens/FlashcardBrowse.jsx'));
const FlashcardReview = lazy(() => import('./screens/FlashcardReview.jsx'));
const TopicHub = lazy(() => import('./screens/TopicHub.jsx'));
const MockExam = lazy(() => import('./screens/MockExam.jsx'));
const Mastery = lazy(() => import('./screens/Mastery.jsx'));

export default function App() {
  const [gateOpen, setGateOpen] = useState(false);
  const userName = useStore((s) => s.userName);
  const navigate = useNavigate();
  useEffect(() => { hydrateFromServer(); }, []);

  // Háttér-prefetch a ló-képekhez. 30 mp warmup után indul, 2.5 mp-enként
  // egy kép, idle-priority. Részletek: src/engine/preloadCards.js.
  useEffect(() => {
    const urls = [];
    for (const a of CARDS) {
      for (const lvl of a.levels || []) {
        if (lvl?.image) urls.push(lvl.image);
      }
    }
    return startCardPreloader(urls);
  }, []);

  function handleGateClick() {
    // Azonnal a főoldalra navigálunk, mielőtt a kapu kinyílna —
    // különben az animáció alatt az aktuális oldal (pl. /subject/endokrin) látszik át.
    navigate('/', { replace: true });
  }

  function handleGateComplete() {
    setGateOpen(true);
  }

  // A UserGate a SplashGate után jön: ha még nincs név VAGY nincs auth token,
  // kérdezd be. Az auth-token-feltétel kell ahhoz hogy a régi eszközökön
  // (ahol userName már van localStorage-ben, de a 2026-05-08 redesign előttről)
  // a register flow lefusson → kapjanak tokent és szinkronizáljanak.
  const hasAuth = Boolean(readAuth()?.token);
  const needsUserName = gateOpen && (!userName || !hasAuth);

  return (
    <>
      {!gateOpen && <SplashGate onOpen={handleGateClick} onComplete={handleGateComplete} />}
      <AnimatePresence>
        {needsUserName && <UserGate key="user-gate" />}
      </AnimatePresence>
      <ErrorBoundary>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="subject/:subjectId" element={<SubjectView />} />
            <Route path="topic/:topicId" element={<TopicHub />} />
            <Route path="quiz/:topicId" element={<Quiz />} />
            <Route path="flashcards" element={<FlashcardReview />} />
            <Route path="flashcards/:topicId" element={<FlashcardBrowse />} />
            <Route path="lesson-complete/:topicId" element={<LessonComplete />} />
            <Route path="collection" element={<Collection />} />
            <Route path="farm" element={<Navigate to="/collection" replace />} />
            <Route path="mock-exam" element={<MockExam />} />
            <Route path="mastery" element={<Mastery />} />
            <Route path="weak-points" element={<WeakPoints />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </ErrorBoundary>
    </>
  );
}
