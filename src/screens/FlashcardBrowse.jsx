import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { findTopic, splitTetel } from '../theme.js';
import { recordAnswer } from '../engine/store.js';

// Lecke-flashcard böngészés. Layout-szabályok:
//   - h-[100dvh]: a layout pontosan a látható viewportra zár (mobil-Safari URL-sáv barát).
//   - flex flex-col + middle min-h-0: a kártya a köztes sávban görög,
//     a footer (rating + nav) ÁLLANDÓAN látszik, nem kell legörgetni.
// A felfedés után FSRS-rating gombok jelennek meg (Újra/Kicsit/Tudom);
// a választás rögzíti az ismétlés-állapotot ÉS előrelapoz egyet.
// Az UTOLSÓ kártya ratingelésekor "Kész!" képernyő — különben a beteg ott
// ragadna a back-en, és újra-újra rányomhatná a rating-gombokat.
export default function FlashcardBrowse() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const topic = findTopic(topicId);
  const cards = (topic?.questions ?? []).filter((q) => q.type === 'flashcard');
  const [index, setIndex] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [rated, setRated] = useState(0);
  const [done, setDone] = useState(false);

  if (!topic) return <p className="text-center mt-8">Nincs ilyen tétel.</p>;

  const { code } = splitTetel(topic.name);

  if (cards.length === 0) {
    return (
      <div className="space-y-4 text-center mt-10">
        <p className="text-ink-500">Ehhez a tételhez nincs flashcard.</p>
        <button onClick={() => navigate(`/topic/${topicId}`, { replace: true })} className="btn-secondary">
          Vissza
        </button>
      </div>
    );
  }

  // "Kész!" képernyő — akkor jön, ha a beteg az utolsó kártyát is ratingelte.
  if (done) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center px-4 text-center space-y-4">
        <h1 className="tome-title text-2xl">Kész!</h1>
        <p className="text-ink-500">
          {rated} kártyát értékeltél át — {code} flashcards.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
          <button
            onClick={() => {
              setIndex(0); setShowBack(false); setRated(0); setDone(false);
            }}
            className="btn-flash-reveal"
          >
            <Eye size={18} strokeWidth={2.5} /> Újra elölről
          </button>
          <button
            onClick={() => navigate(`/topic/${topicId}`, { replace: true })}
            className="btn-flash-nav"
          >
            Vissza a tételhez
          </button>
        </div>
      </div>
    );
  }

  const card = cards[index];
  const atFirst = index === 0;
  const atLast = index === cards.length - 1;

  function go(delta) {
    setShowBack(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), cards.length - 1));
  }

  // Rating: rögzít FSRS-t és tovább lapoz. Utolsó kártyán → "Kész!" képernyő.
  function handleGrade(rating) {
    if (!card) return;
    recordAnswer(card.id, rating);
    setRated((n) => n + 1);
    if (atLast) {
      setDone(true);
    } else {
      setShowBack(false);
      setIndex((i) => i + 1);
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="px-4 pt-3 pb-3 flex items-center gap-3 max-w-2xl mx-auto w-full shrink-0">
        <button onClick={() => navigate(`/topic/${topicId}`, { replace: true })} aria-label="Kilépés" className="p-2 rounded-lg hover:bg-base-100/60 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={22} className="text-ink-500" />
        </button>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-secondary-700 font-bold">{code} · Flashcards</div>
          <div className="text-xs text-ink-400 mt-0.5">{index + 1} / {cards.length}</div>
        </div>
      </header>

      {/* Mód-függő elrendezés: világosban minden felül (onnan indul lefelé);
          sötétben a kártya felül, a gombok lent (a lovas középen szabadon). */}
      <div className="flex-1 min-h-0 px-4 max-w-2xl mx-auto w-full flex flex-col gap-3 pt-2 justify-start dark:justify-between">
        <div className="min-h-0 overflow-y-auto flex flex-col items-center justify-center gap-2">
          {!showBack && (
            <p className="text-center text-xs text-ink-400 shrink-0" style={{ fontFamily: 'var(--font-body)' }}>
              Idézd fel fejből, mielőtt megnézed.
            </p>
          )}
          <AnimatePresence mode="wait">
            {!showBack ? (
              <motion.button
                key={`front-${index}`}
                onClick={() => setShowBack(true)}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="card w-full py-8 text-center flex items-center justify-center"
              >
                <p className="text-2xl text-ink-700 leading-snug px-4">{card.front}</p>
              </motion.button>
            ) : (
              <motion.div
                key={`back-${index}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="card-clean w-full"
              >
                <div className="text-xs uppercase tracking-wider text-secondary-700 font-semibold mb-2">Megoldás</div>
                <p className="text-ink-700 leading-relaxed">{card.back}</p>
                {card.explanation && (
                  <div className="mt-4 pt-3 border-t border-accent-300/60">
                    <p className="text-sm text-ink-500 leading-relaxed">{card.explanation}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0">
          {!showBack ? (
            <button onClick={() => setShowBack(true)} className="btn-flash-reveal">
              <Eye size={18} strokeWidth={2.5} /> Mutasd a választ
            </button>
          ) : (
            <div className="space-y-1.5">
              <p className="text-center text-[11px] uppercase tracking-widest text-ink-500 font-semibold">
                Mennyire tudtad?
              </p>
              <div className="flex gap-2">
                <button onClick={() => handleGrade('again')} className="btn-flash-grade bg-rose-50 text-rose-700">Újra</button>
                <button onClick={() => handleGrade('hard')}  className="btn-flash-grade bg-amber-50 text-amber-700">Kicsit</button>
                <button onClick={() => handleGrade('good')}  className="btn-flash-grade bg-leaf-50 text-leaf-700">Tudom</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav nyilak: mindig a legalján. */}
      <div className="px-4 pb-3 pt-1 max-w-2xl mx-auto w-full shrink-0 safe-bottom">
        <div className="flex items-center gap-2">
          <button onClick={() => go(-1)} disabled={atFirst} className="btn-flash-nav">
            <ChevronLeft size={16} /> Előző
          </button>
          <button onClick={() => go(1)} disabled={atLast} className="btn-flash-nav">
            Következő <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
