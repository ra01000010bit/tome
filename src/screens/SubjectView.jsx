import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, CheckCircle2, ChevronRight } from 'lucide-react';
import { findSubject, topicsForSubject, splitTetel } from '../theme.js';
import { useStore, getTopicProgress, getQuestionState } from '../engine/store.js';
import { isDue } from '../engine/fsrs.js';
import { InitialMedallion, OrnamentDivider } from '../components/Ornament.jsx';

export default function SubjectView() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  // Re-render igénylés: a TopicRow-k `getQuestionState`/`getTopicProgress`-t
  // synchronously olvasnak — kérdés-válasz vagy lecke-teljesítés után friss
  // számokat akarunk látni. Csak a két érintett mező-csoportra iratkozunk fel,
  // hogy minden apró state-változás (pl. settings) ne triggereljen újra-renderet.
  useStore((s) => s.questionStates);
  useStore((s) => s.topicProgress);
  const subject = findSubject(subjectId);
  const topics = topicsForSubject(subjectId);

  if (!subject) {
    return <p className="text-center mt-8">Nincs ilyen csoport.</p>;
  }

  return (
    <div className="space-y-5">
      <button onClick={() => navigate('/', { replace: true })} className="btn-ghost text-sm -ml-2">
        <ChevronLeft size={18} /> Vissza
      </button>

      <header className="flex flex-col items-center text-center gap-2">
        <InitialMedallion letter={subject.letter} size={68} dim={topics.length === 0} />
        <h1 className="tome-title text-2xl leading-tight">{subject.name}</h1>
        <p className="text-sm text-ink-500" style={{ fontFamily: 'var(--font-body)' }}>
          {subject.description}
        </p>
        <span className="text-[11px] font-bold tracking-widest text-secondary-700 uppercase">
          {subject.range} · {topics.length} tétel
        </span>
        <OrnamentDivider />
      </header>

      {topics.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ink-500">Ehhez a csoporthoz még nincsenek tételek.</p>
          <p className="text-xs text-ink-400 mt-2">Hamarosan feltöltjük.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {topics.map((t) => <TopicRow key={t.id} topic={t} />)}
        </ul>
      )}
    </div>
  );
}

function TopicRow({ topic }) {
  const progress = getTopicProgress(topic.id);
  const { code, title } = splitTetel(topic.name);
  const done = progress.bestScore >= 80;
  const due = topic.questions.filter((q) => {
    const st = getQuestionState(q.id);
    return st.state === 'new' || isDue(st);
  }).length;

  return (
    <Link
      to={`/topic/${topic.id}`}
      className="tome-card-lift group flex items-stretch rounded-md overflow-hidden bg-base-50/85 backdrop-blur active:scale-[0.99]"
      style={{
        border: '1px solid rgb(var(--c-accent-300))',
        boxShadow: 'inset 0 1px 0 rgb(var(--c-secondary-100) / 0.6), 0 1px 3px -1px rgba(14,80,120,0.12)',
      }}
    >
      {/* Szám-jelvény oszlop — kiemelt arany pecsét a tétel kódjával */}
      <div
        className="flex flex-col items-center justify-center px-3 py-3 shrink-0 min-w-[62px] relative"
        style={{
          background: 'linear-gradient(160deg, rgb(var(--c-accent-300)), rgb(var(--c-accent-500)) 60%, rgb(var(--c-accent-600)))',
          boxShadow: 'inset -1px 0 0 rgb(var(--c-accent-700) / 0.5), inset 0 1px 0 rgba(255,255,255,0.35)',
        }}
      >
        <span className="text-[9px] uppercase tracking-[0.18em] text-base-50/80 leading-none">tétel</span>
        <span
          className="text-xl font-bold text-base-50 leading-tight mt-0.5"
          style={{ fontFamily: 'var(--font-display)', textShadow: '0 1px 1px rgba(0,0,0,0.25)' }}
        >
          {code || '•'}
        </span>
      </div>

      {/* Cím + meta */}
      <div className="flex-1 min-w-0 py-2.5 px-3 flex flex-col justify-center">
        <div className="font-semibold text-ink-700 leading-snug line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
          {title}
        </div>
        <div className="text-[11px] text-ink-400 mt-1" style={{ fontFamily: 'var(--font-body)' }}>
          {topic.questions.length} kérdés
          {progress.bestScore > 0 && ` · legjobb ${progress.bestScore}%`}
          {progress.completionCount > 1 && ` · ${progress.completionCount}×`}
        </div>
      </div>

      {/* Állapot-jelző */}
      <div className="flex items-center gap-2 pr-3 shrink-0">
        {due > 0 && (
          <span className="text-[10px] font-bold bg-secondary-600 text-white px-2 py-0.5 rounded-full">
            {due}
          </span>
        )}
        {done
          ? (
            <div className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-gradient-to-br from-[#f5d4b5] via-[#c9a961] to-[#9b7e3a] shadow-sm border border-[#faf3e7]">
              <CheckCircle2 className="text-[#2a1810]" size={14} strokeWidth={2.5} />
            </div>
          )
          : <ChevronRight className="text-accent-500 group-hover:translate-x-0.5 transition-transform" size={20} />}
      </div>
    </Link>
  );
}
