import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Timer, GraduationCap, RotateCcw, Home as HomeIcon } from 'lucide-react';
import clsx from 'clsx';
import { allQuestions } from '../theme.js';
import { QuestionRenderer } from '../components/questions/index.jsx';
import { useStore, recordAnswer } from '../engine/store.js';
import { ArchHeader, OrnamentDivider } from '../components/Ornament.jsx';

// Pontozott típusok (a flashcard kimarad — nincs jó/rossz pontozása).
const EXAM_TYPES = ['multiple_choice', 'true_false', 'cloze'];
const COUNT_OPTIONS = [10, 20, 30];
const RATING_VALUE = { good: 1, hard: 0.7, again: 0 };

// Fisher–Yates keverés (nem mutálja az eredetit).
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function MockExam() {
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  const disabledTypes = settings?.disabledTypes ?? [];

  // 'config' → beállítás, 'running' → kvíz, 'result' → eredmény
  const [phase, setPhase] = useState('config');
  const [count, setCount] = useState(10);
  const [timed, setTimed] = useState(false);

  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // A pontozható kérdés-poolt csak akkor számoljuk újra, ha a tiltott típusok
  // változnak — minden render-en végigfutni az összes tételen felesleges.
  const pool = useMemo(() => {
    return allQuestions().filter(
      (q) => EXAM_TYPES.includes(q.type) && !disabledTypes.includes(q.type),
    );
  }, [disabledTypes]);

  const maxAvailable = pool.length;

  // Időzítő: másodpercenként léptet, amíg fut a vizsga. Befagy a result fázisban.
  useEffect(() => {
    if (phase !== 'running' || !timed) return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, timed]);

  function startExam() {
    const chosen = shuffle(pool).slice(0, Math.min(count, maxAvailable));
    setQueue(chosen);
    setIndex(0);
    setResults([]);
    setElapsed(0);
    setPhase('running');
  }

  function handleAnswer(rating) {
    const current = queue[index];
    if (!current) return;
    recordAnswer(current.id, rating);
    const nextResults = [...results, { qid: current.id, rating }];
    setResults(nextResults);
    if (index + 1 < queue.length) {
      setIndex(index + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase('result');
    }
  }

  function close() {
    if (timerRef.current) clearInterval(timerRef.current);
    navigate('/', { replace: true });
  }

  function restart() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('config');
    setQueue([]);
    setIndex(0);
    setResults([]);
    setElapsed(0);
  }

  // ── Eredmény-összesítés ────────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = results.length;
    const goodCount = results.filter((r) => r.rating === 'good').length;
    const hardCount = results.filter((r) => r.rating === 'hard').length;
    const againCount = results.filter((r) => r.rating === 'again').length;
    const sum = results.reduce((acc, r) => acc + (RATING_VALUE[r.rating] ?? 0), 0);
    const score = total === 0 ? 0 : Math.round((sum / total) * 100);
    return { total, goodCount, hardCount, againCount, score };
  }, [results]);

  // ── CONFIG fázis ──────────────────────────────────────────────────────
  if (phase === 'config') {
    return (
      <ExamShell onClose={close}>
        <div className="flex-1 px-4 max-w-2xl mx-auto w-full pb-10 overflow-y-auto">
          <ArchHeader title="Próbavizsga" subtitle="Mérd fel a tudásod" />

          <p
            className="text-center text-sm text-ink-500 mt-2 mb-6 leading-relaxed"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Véletlenszerű kérdések minden tételből, vegyesen. A végén pontszámot kapsz.
          </p>

          {maxAvailable === 0 ? (
            <div className="card-clean text-center text-ink-500" role="alert">
              Jelenleg nincs elérhető kérdés a próbavizsgához.
            </div>
          ) : (
            <>
              <fieldset className="card-clean">
                <legend className="text-xs font-bold uppercase tracking-widest text-secondary-700 px-1">
                  Kérdések száma
                </legend>
                <div className="grid grid-cols-3 gap-2 mt-3" role="group" aria-label="Kérdések száma">
                  {COUNT_OPTIONS.map((n) => {
                    const active = count === n;
                    const disabled = n > maxAvailable;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setCount(n)}
                        disabled={disabled}
                        aria-pressed={active}
                        className={clsx(
                          'min-h-[44px] rounded-xl border-2 font-bold transition-all active:scale-[0.98]',
                          disabled && 'opacity-40 cursor-not-allowed border-base-200 text-ink-400',
                          !disabled && active && 'border-accent-500 bg-accent-200/40 text-accent-700',
                          !disabled && !active && 'border-base-200 bg-base-50 text-ink-600 hover:border-accent-300',
                        )}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                {count > maxAvailable && (
                  <p className="text-xs text-ink-400 mt-2" role="status">
                    Csak {maxAvailable} kérdés érhető el — annyit kapsz.
                  </p>
                )}
              </fieldset>

              <div className="card-clean flex items-center gap-3 mt-3">
                <div className="rounded-md bg-secondary-100 p-2 shrink-0">
                  <Timer size={22} className="text-secondary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-ink-700">Időmérés</div>
                  <div className="text-xs text-ink-400">Stopperóra fut a vizsga alatt</div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={timed}
                  aria-label="Időmérés be- és kikapcsolása"
                  onClick={() => setTimed((v) => !v)}
                  className={clsx(
                    'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors min-w-[44px]',
                    timed ? 'bg-accent-500' : 'bg-base-300',
                  )}
                >
                  <span
                    className={clsx(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                      timed ? 'translate-x-6' : 'translate-x-1',
                    )}
                  />
                </button>
              </div>

              <OrnamentDivider />

              <button onClick={startExam} className="btn-primary w-full text-base py-3">
                <GraduationCap size={18} /> Kezdés
              </button>
            </>
          )}
        </div>
      </ExamShell>
    );
  }

  // ── RESULT fázis ──────────────────────────────────────────────────────
  if (phase === 'result') {
    const headline = summary.score >= 80 ? 'Kiváló eredmény!'
                   : summary.score >= 50 ? 'Jó úton jársz'
                   : 'Van még mit gyakorolni';
    return (
      <ExamShell onClose={close}>
        <div className="flex-1 px-4 max-w-2xl mx-auto w-full pb-10 overflow-y-auto">
          <ArchHeader title="Próbavizsga" subtitle="Eredmény" />

          <div className="card text-center py-8 mt-2" role="alert" aria-live="polite">
            <div className="text-7xl font-bold text-accent-700">{summary.score}%</div>
            <div className="text-ink-600 text-sm mt-3 font-semibold">{headline}</div>
            <div className="text-ink-500 text-sm mt-1" style={{ fontFamily: 'var(--font-body)' }}>
              {summary.goodCount} biztos · {summary.hardCount} bizonytalan · {summary.againCount} hiba
            </div>
            <div className="text-xs text-ink-400 mt-1">{summary.total} kérdés</div>
            {timed && (
              <div className="inline-flex items-center gap-1.5 text-sm text-secondary-700 font-bold mt-3">
                <Timer size={15} /> {formatTime(elapsed)}
              </div>
            )}
          </div>

          <OrnamentDivider />

          <div className="space-y-2">
            <button onClick={restart} className="btn-secondary w-full">
              <RotateCcw size={18} /> Újra
            </button>
            <button onClick={() => navigate('/', { replace: true })} className="btn-ghost w-full">
              <HomeIcon size={18} /> Főoldal
            </button>
          </div>
        </div>
      </ExamShell>
    );
  }

  // ── RUNNING fázis ─────────────────────────────────────────────────────
  const current = queue[index];
  const progress = queue.length === 0 ? 0 : Math.round(((index + 1) / queue.length) * 100);

  return (
    <div className="flex flex-col bg-gradient-to-b from-base-50 to-secondary-50" style={{ minHeight: '100dvh' }}>
      <h1 className="sr-only">Próbavizsga</h1>
      <header className="px-4 pt-3 pb-4 flex items-center gap-3 max-w-2xl mx-auto w-full">
        <button
          onClick={close}
          aria-label="Kilépés"
          className="p-2 rounded-lg hover:bg-white/60 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={22} className="text-secondary-700" />
        </button>
        <div className="flex-1">
          <div
            className="h-2 bg-secondary-100 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Vizsga haladása"
          >
            <div
              className="h-full bg-gradient-to-r from-accent-400 to-accent-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-ink-500 mt-1 font-semibold">
            Próbavizsga · {Math.min(index + 1, queue.length)} / {queue.length}
          </div>
        </div>
        {timed && (
          <div
            className="inline-flex items-center gap-1 text-sm font-bold text-secondary-700 tabular-nums shrink-0"
            aria-label="Eltelt idő"
            aria-live="off"
          >
            <Timer size={16} /> {formatTime(elapsed)}
          </div>
        )}
      </header>

      <div className="flex-1 px-4 max-w-2xl mx-auto w-full pb-8">
        {current && (
          <QuestionRenderer key={current.id + ':' + index} question={current} onAnswer={handleAnswer} />
        )}
      </div>
    </div>
  );
}

// Teljes-képernyős keret a config/result fázishoz: X-zár fejléccel.
function ExamShell({ children, onClose }) {
  return (
    <div className="flex flex-col bg-gradient-to-b from-base-50 to-secondary-50" style={{ minHeight: '100dvh' }}>
      <header className="px-4 pt-3 pb-1 flex items-center max-w-2xl mx-auto w-full">
        <button
          onClick={onClose}
          aria-label="Kilépés"
          className="p-2 rounded-lg hover:bg-white/60 min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <X size={22} className="text-secondary-700" />
        </button>
      </header>
      {children}
    </div>
  );
}
