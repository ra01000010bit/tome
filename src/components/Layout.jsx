import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';

function ScreenFallback() {
  return (
    <div className="flex items-center justify-center py-20" role="status" aria-label="Betöltés…">
      <div className="w-10 h-10 border-2 border-accent-400 border-t-transparent rounded-full animate-spin" />
      <span className="sr-only">Betöltés…</span>
    </div>
  );
}

export default function Layout() {
  const location = useLocation();
  // Immerzív, teljes-képernyős módok (kvíz + flashcard): nincs alsó menü, és
  // nincs nagy alsó padding — különben a kártya alatti gombok lecsúsznak.
  const hideNav = location.pathname.startsWith('/quiz')
    || location.pathname.startsWith('/flashcards')
    || location.pathname.startsWith('/mock-exam');

  // Görgetés-alapú kiemelés (főleg mobilon, ahol nincs hover): a viewport
  // közepén lévő kártya megkapja a `.tome-focus` class-t → sötét módban tömörré
  // válik (a többi féláttetsző marad). MutationObserver fogja a lazy-betöltött
  // kártyákat is. Világos módban nincs vizuális hatása.
  useEffect(() => {
    const main = document.querySelector('main');
    if (!main || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle('tome-focus', e.isIntersecting)),
      { rootMargin: '-45% 0px -45% 0px' }
    );
    const observeCards = () =>
      main.querySelectorAll('.card, .card-clean, .card-plain').forEach((el) => io.observe(el));
    observeCards();
    const mo = new MutationObserver(observeCards);
    mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 overflow-y-auto max-w-7xl w-full mx-auto px-4 pt-6" style={{ paddingBottom: hideNav ? 'env(safe-area-inset-bottom)' : 'calc(11rem + env(safe-area-inset-bottom))' }}>
        <Suspense fallback={<ScreenFallback />}>
          <Outlet />
        </Suspense>
      </main>
      {!hideNav && <BottomNav />}
    </div>
  );
}
