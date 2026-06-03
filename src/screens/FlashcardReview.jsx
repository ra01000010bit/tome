import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { allQuestions } from '../theme.js';
import { getState, recordAnswer } from '../engine/store.js';
import { buildQueue } from '../engine/fsrs.js';
import FlashcardQuestion from '../components/questions/FlashcardQuestion.jsx';

export default function FlashcardReview() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [pendingRequeue, setPendingRequeue] = useState([]);
  const [reviewed, setReviewed] = useState(0);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const states = getState().questionStates;
    const cards = allQuestions().filter((q) => q.type === 'flashcard');
    setQueue(buildQueue(cards, states));
    setReady(true);
  }, []);

  const current = queue[index];

  function handleAnswer(rating) {
    if (!current) return;
    recordAnswer(current.id, rating);
    setReviewed((n) => n + 1);
    const requeue = rating === 'again' ? [...pendingRequeue, current] : pendingRequeue;
    if (index + 1 < queue.length) {
      setIndex(index + 1);
      if (rating === 'again') setPendingRequeue(requeue);
    } else if (requeue.length > 0) {
      setQueue(requeue);
      setPendingRequeue([]);
      setIndex(0);
    } else {
      setDone(true);
    }
  }

  if (ready && queue.length === 0) {
    return (
      <div className="space-y-4 text-center mt-10">
        <h1 className="tome-title text-2xl">Flashcards</h1>
        <p className="text-ink-500">Nincs most esedékes kártya — gyere vissza később.</p>
        <button onClick={() => navigate('/', { replace: true })} className="btn-secondary">
          Vissza a kezdőlapra
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center mt-10">
        <h1 className="tome-title text-2xl">Kész!</h1>
        <p className="text-ink-500">{reviewed} kártyát ismételtél át.</p>
        <button onClick={() => navigate('/', { replace: true })} className="btn-primary">
          Vissza a kezdőlapra
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      <header className="px-4 pt-3 pb-3 flex items-center gap-3 max-w-2xl mx-auto w-full shrink-0">
        <button onClick={() => navigate('/', { replace: true })} aria-label="Kilépés" className="p-2 rounded-lg hover:bg-base-100/60 min-w-[44px] min-h-[44px] flex items-center justify-center">
          <X size={22} className="text-ink-500" />
        </button>
        <div className="flex-1">
          <div className="text-xs uppercase tracking-widest text-secondary-700 font-bold">Flashcards — ismétlés</div>
          <div className="text-xs text-ink-400 mt-0.5">{Math.min(index + 1, queue.length)} / {queue.length}</div>
        </div>
      </header>

      {/* min-h-0 kell a flex-1-re, hogy a gyerek h-full ténylegesen korlátozott legyen. */}
      <div className="flex-1 min-h-0 px-4 pb-2 max-w-2xl mx-auto w-full flex flex-col">
        {current && <FlashcardQuestion key={current.id + index} question={current} onAnswer={handleAnswer} />}
      </div>
    </div>
  );
}
