import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Sparkles, Gift, AlertTriangle, Layers, GraduationCap, BarChart3, Sun, Moon } from 'lucide-react';
import { SUBJECTS, topicsForSubject, allTopics, COPY, themeConfig } from '../theme.js';
import { useStore, getTopicProgress, getQuestionState, markStarterClaimed, updateSetting } from '../engine/store.js';
import { applyColorMode, resolveTheme } from '../engine/applyTheme.js';
import { isDue } from '../engine/fsrs.js';
import { performStarterPull } from '../engine/gacha.js';
import GachaReveal from '../components/GachaReveal.jsx';
import { ArchHeader, FlowerMotif, InitialMedallion } from '../components/Ornament.jsx';

export default function Home() {
  // Csak akkor szűk újraszámolás, ha a kérdés-állapotok ténylegesen változnak
  const questionStates = useStore((s) => s.questionStates);
  const starterClaimed = useStore((s) => s.starterClaimed);
  const [pullResult, setPullResult] = useState(null);

  const weakCount = useMemo(() => {
    let n = 0;
    for (const t of allTopics()) {
      for (const q of t.questions) {
        const s = getQuestionState(q.id);
        if (s.reviewCount < 2) continue;
        if (s.correctCount / s.reviewCount < 0.6 || s.state === 'learning') n += 1;
      }
    }
    return n;
  }, [questionStates]);

  const [exhaustedToast, setExhaustedToast] = useState(null);

  // Toast auto-elrejtese 4s utan (a kattintasos zaras megmarad)
  useEffect(() => {
    if (!exhaustedToast) return;
    const t = setTimeout(() => setExhaustedToast(null), 4000);
    return () => clearTimeout(t);
  }, [exhaustedToast]);

  function claimStarter() {
    const r = performStarterPull();
    if (r) { setPullResult(r); }
    else { setExhaustedToast('Minden kártyát felfedeztél! Nincs több feloldható.'); }
    markStarterClaimed();
  }

  return (
    <div className="space-y-6 relative">
      <ThemeToggle />
      <ArchHeader title={[themeConfig.brand.line1, themeConfig.brand.line2]} />

      {!starterClaimed && <StarterBanner onClaim={claimStarter} />}

      {weakCount > 0 && (
        <Link
          to="/weak-points"
          className="card-clean flex items-center gap-3 hover:-translate-y-0.5 active:scale-[0.99] transition"
        >
          <div className="rounded-md bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 p-2">
            <AlertTriangle size={22} className="text-rose-600 dark:text-rose-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-ink-700 font-bold">Hibanapló</div>
            <div className="text-xs text-ink-500">
              {weakCount} kérdést érdemes újra átnézni — gyakoroljunk!
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-rose-600 text-white px-2 py-0.5 rounded-sm">
            {weakCount}
          </span>
        </Link>
      )}

      <section>
        <div className="section-rule">
          <h2>Válassz csoportot</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SUBJECTS.map((subject) => <SubjectGateway key={subject.id} subject={subject} />)}
        </div>
      </section>
      <CentralFlashcardButton />
      <MockExamButton />
      <MasteryButton />

      <AnimatePresence>
        {pullResult && (
          <GachaReveal
            result={pullResult}
            onClose={() => setPullResult(null)}
            isStarter={true}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {exhaustedToast && (
          <motion.div
            key="exhausted"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            onClick={() => setExhaustedToast(null)}
            role="status"
            aria-live="polite"
            className="fixed bottom-24 left-4 right-4 mx-auto max-w-md card text-center cursor-pointer z-40"
            style={{ background: 'linear-gradient(135deg, #faf3e7, #f0e6c8)' }}
          >
            <div className="text-ink-700 font-bold">{exhaustedToast}</div>
            <div className="text-xs text-ink-500 mt-1">(érintsd meg a bezáráshoz)</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ThemeToggle() {
  const theme = useStore((s) => s.settings?.theme);
  const reduceMotion = useReducedMotion();
  const dark = resolveTheme(theme ?? 'auto') === 'dark';
  function toggle() {
    const next = dark ? 'light' : 'dark';
    updateSetting('theme', next);
    applyColorMode(next);
  }
  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Világos módra váltás' : 'Sötét módra váltás'}
      className="absolute right-0 -top-1 z-20 w-11 h-11 flex items-center justify-center rounded-full bg-base-50/80 backdrop-blur border border-accent-300 text-accent-700 shadow-sm active:scale-90 transition-transform"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={reduceMotion ? { opacity: 0 } : { rotate: -90, opacity: 0, scale: 0.6 }}
          animate={reduceMotion ? { opacity: 1 } : { rotate: 0, opacity: 1, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex"
        >
          {dark ? <Moon size={20} /> : <Sun size={20} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

function StarterBanner({ onClaim }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative card border-2 border-warm-300 bg-gradient-to-br from-warm-100 via-base-50 to-primary-100 overflow-hidden"
    >
      <motion.div
        animate={reduceMotion ? undefined : { rotate: [0, 8, -6, 0] }}
        transition={reduceMotion ? undefined : { duration: 3, repeat: Infinity }}
        className="absolute -right-4 -top-4 text-warm-300"
      >
        <Sparkles size={64} strokeWidth={1.5} />
      </motion.div>
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-2xl p-3 shadow-sm">
          <Gift size={28} className="text-warm-500" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl">Üdvözlő ajándék</h2>
          <p className="text-ink-600 text-sm">
            Kezdésként vedd át az első kártyádat — garantáltan ritka vagy jobb!
          </p>
        </div>
      </div>
      <button onClick={onClaim} className="btn-primary w-full mt-4 text-base py-3 relative z-10">
        <Gift size={18} /> Igénylés
      </button>
    </motion.div>
  );
}

function SubjectGateway({ subject }) {
  const topics = topicsForSubject(subject.id);
  const totalQuestions = topics.reduce((sum, t) => sum + t.questions.length, 0);
  const due = topics.reduce((sum, t) => {
    return sum + t.questions.filter((q) => {
      const st = getQuestionState(q.id);
      return st.state === 'new' || isDue(st);
    }).length;
  }, 0);
  const progressed = topics.reduce((sum, t) => sum + (getTopicProgress(t.id).bestScore || 0), 0);
  const avgProgress = topics.length ? Math.round(progressed / topics.length) : 0;
  const hasContent = topics.length > 0;

  return (
    <Link
      to={`/subject/${subject.id}`}
      className="card tome-card-lift flex flex-col items-center text-center gap-3 py-6 group active:scale-[0.98]"
    >
      {due > 0 && (
        <span className="absolute top-2 right-2 text-[10px] font-bold uppercase tracking-widest bg-accent-600 text-base-50 px-2 py-0.5 rounded-sm z-10">
          {due}
        </span>
      )}

      <InitialMedallion letter={subject.letter} dim={!hasContent} />

      <div className="min-w-0 px-1">
        <h3 className="tome-title text-base leading-tight">{subject.name}</h3>
        <p className="text-[11px] text-ink-500 mt-1 leading-snug" style={{ fontFamily: 'var(--font-body)' }}>
          {subject.description}
        </p>
      </div>

      <div className="w-full px-3 mt-auto">
        <div className="ornate-rule mb-2">
          <FlowerMotif size={12} />
        </div>
        <div className="flex items-center justify-between text-[11px]" style={{ fontFamily: 'var(--font-body)' }}>
          <span className="text-secondary-700 font-bold tracking-wide">{subject.range}</span>
          {hasContent ? (
            <span className="text-ink-500">{topics.length} tétel · {avgProgress}%</span>
          ) : (
            <span className="text-ink-400 italic">összeállítás alatt</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function CentralFlashcardButton() {
  const questionStates = useStore((s) => s.questionStates);
  const due = useMemo(() => {
    let n = 0;
    for (const t of allTopics()) {
      for (const q of t.questions) {
        if (q.type !== 'flashcard') continue;
        const st = getQuestionState(q.id);
        if (st.state === 'new' || isDue(st)) n += 1;
      }
    }
    return n;
  }, [questionStates]);

  return (
    <Link to="/flashcards" className="card tome-card-lift flex items-center gap-4 py-5 active:scale-[0.99]">
      <div
        className="rounded-full bg-secondary-100 p-3 shrink-0"
        style={{ boxShadow: 'inset 0 0 0 1.5px rgb(var(--c-secondary-300))' }}
      >
        <Layers className="text-secondary-700" size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="tome-title text-lg leading-tight">Flashcards</h3>
        <p className="text-[11px] text-ink-500 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          Ütemezett ismétlés — minden tétel kártyáiból
        </p>
      </div>
      <span className="text-sm font-bold text-secondary-700 shrink-0">
        {due > 0 ? `${due} esedékes` : 'kész'}
      </span>
    </Link>
  );
}

function MockExamButton() {
  return (
    <Link to="/mock-exam" className="card tome-card-lift flex items-center gap-4 py-5 active:scale-[0.99]">
      <div
        className="rounded-full p-3 shrink-0"
        style={{ background: 'rgb(var(--c-accent-200))', boxShadow: 'inset 0 0 0 1.5px rgb(var(--c-accent-300))' }}
      >
        <GraduationCap className="text-accent-700" size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="tome-title text-lg leading-tight">Próbavizsga</h3>
        <p className="text-[11px] text-ink-500 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          Vegyes kérdések minden tételből — időmérővel is
        </p>
      </div>
      <span className="text-sm font-bold text-accent-700 shrink-0">indítás</span>
    </Link>
  );
}

function MasteryButton() {
  return (
    <Link to="/mastery" className="card tome-card-lift flex items-center gap-4 py-5 active:scale-[0.99]">
      <div
        className="rounded-full p-3 shrink-0"
        style={{ background: 'rgb(var(--c-leaf-400) / 0.3)', boxShadow: 'inset 0 0 0 1.5px rgb(var(--c-leaf-400))' }}
      >
        <BarChart3 className="text-leaf-700" size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="tome-title text-lg leading-tight">Tudásszint</h3>
        <p className="text-[11px] text-ink-500 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          Tételenkénti haladásod és esedékes kérdések
        </p>
      </div>
      <span className="text-sm font-bold text-leaf-700 shrink-0">áttekintés</span>
    </Link>
  );
}
