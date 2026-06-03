import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { findTopic } from '../theme.js';
import { QuestionRenderer } from '../components/questions/index.jsx';
import {
  getState, recordAnswer, recordTopicCompletion, getTopicProgress,
} from '../engine/store.js';
import { buildQueue } from '../engine/fsrs.js';
import { evaluateUnlock } from '../engine/unlock.js';

const GAME_TYPES = ['multiple_choice', 'true_false', 'cloze'];

export default function Quiz() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type');
  const topic = findTopic(topicId);

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [pendingRequeue, setPendingRequeue] = useState([]);

  useEffect(() => {
    if (!topic || !GAME_TYPES.includes(type)) return;
    const states = getState().questionStates;
    const filtered = topic.questions
      .filter((q) => q.type === type)
      .map((q) => ({ ...q, topicId: topic.id }));
    const q = buildQueue(filtered, states);
    setQueue(q.length ? q : filtered.slice());
  }, [topic, type]);

  if (!topic) return <p className="text-center mt-8">Nincs ilyen tétel.</p>;
  if (!GAME_TYPES.includes(type)) return <Navigate to={`/topic/${topicId}`} replace />;

  const current = queue[index];
  const totalForBar = queue.length + pendingRequeue.length;
  const progress = totalForBar === 0 ? 0 : Math.round(((index + 1) / totalForBar) * 100);

  function handleAnswer(rating) {
    if (!current) return;
    recordAnswer(current.id, rating);
    setResults((r) => [...r, { qid: current.id, rating }]);
    if (rating === 'again') setPendingRequeue((r) => [...r, current]);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
    } else if (pendingRequeue.length > 0 || rating === 'again') {
      const next = rating === 'again' ? [...pendingRequeue, current] : [...pendingRequeue];
      setQueue(next);
      setPendingRequeue([]);
      setIndex(0);
    } else {
      finishLesson([...results, { qid: current.id, rating }]);
    }
  }

  function finishLesson(allResults) {
    const RATING_VALUE = { good: 1, hard: 0.7, again: 0 };
    const bestPerQid = new Map();
    for (const r of allResults) {
      const v = RATING_VALUE[r.rating] ?? 0;
      bestPerQid.set(r.qid, Math.max(bestPerQid.get(r.qid) ?? 0, v));
    }
    const totalQuestions = bestPerQid.size;
    const sum = [...bestPerQid.values()].reduce((a, b) => a + b, 0);
    const score = totalQuestions === 0 ? 0 : Math.round((sum / totalQuestions) * 100);
    const goodCount = [...bestPerQid.values()].filter((v) => v === 1).length;
    const hardCount = [...bestPerQid.values()].filter((v) => v === 0.7).length;

    // Unlock csak az ELSŐ alkalommal, amikor a tétel bestScore-ja átlépi a 80%-ot
    // (bármely játéktípussal). A performPull önmagában nem idempotens, ezért kell az őr.
    const priorBest = getTopicProgress(topic.id).bestScore || 0;
    recordTopicCompletion(topic.id, score);
    const unlock = (priorBest < 80 && score >= 80) ? evaluateUnlock(topic, score) : null;

    navigate(`/lesson-complete/${topic.id}`, {
      state: { score, totalAttempts: totalQuestions, goodCount, hardCount, unlock, type },
      replace: true,
    });
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-3 pt-2 pb-6">
      <h1 className="sr-only">{topic.name}</h1>
      {/* Tömör panel: a feladat-tartalom ezen ül, a háttérkép körülötte látszik. */}
      <div className="w-full max-w-2xl bg-base-50 rounded-2xl shadow-xl border border-accent-200/50 overflow-hidden flex flex-col">
        <header className="px-4 pt-3 pb-4 flex items-center gap-3 w-full">
          <button
            onClick={() => navigate(`/topic/${topicId}`, { replace: true })}
            aria-label="Kilépés a leckéből"
            className="p-2 rounded-lg hover:bg-base-200/60 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X size={22} className="text-ink-500" />
          </button>
          <div className="flex-1">
            <div
              className="h-2 bg-primary-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Lecke haladása"
            >
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-ink-500 mt-1 font-semibold">
              {topic.name} · {Math.min(index + 1, queue.length)} / {queue.length}
            </div>
          </div>
        </header>

        <div className="px-4 pb-6 w-full">
          {current && <QuestionRenderer key={current.id + index} question={current} onAnswer={handleAnswer} />}
        </div>
      </div>
    </div>
  );
}
