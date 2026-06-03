import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Layers, CheckCircle2, ChevronRight } from 'lucide-react';
import { findTopic, findSubject, splitTetel } from '../theme.js';
import { useStore, getTopicProgress } from '../engine/store.js';
import { InitialMedallion, OrnamentDivider } from '../components/Ornament.jsx';

const GAME_DEFS = [
  { type: 'multiple_choice', label: 'Feleletválasztós', hint: '4 lehetőség közül a helyes' },
  { type: 'true_false',      label: 'Igaz / Hamis',      hint: 'Állítás igazságának megítélése' },
  { type: 'cloze',           label: 'Kitöltős',          hint: 'Hiányos mondat kiegészítése' },
];

export default function TopicHub() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const settings = useStore((s) => s.settings);
  useStore((s) => s.topicProgress);
  const topic = findTopic(topicId);

  if (!topic) return <p className="text-center mt-8">Nincs ilyen tétel.</p>;

  const subject = findSubject(topic.subjectId);
  const { code, title } = splitTetel(topic.name);
  const disabled = settings.disabledTypes ?? [];
  const progress = getTopicProgress(topic.id);
  const done = progress.bestScore >= 80;

  const flashCount = topic.questions.filter((q) => q.type === 'flashcard').length;
  const countOf = (t) => topic.questions.filter((q) => q.type === t).length;

  return (
    <div className="space-y-5">
      <button onClick={() => navigate(`/subject/${topic.subjectId}`, { replace: true })} className="btn-ghost text-sm -ml-2">
        <ChevronLeft size={18} /> Vissza
      </button>

      <header className="flex flex-col items-center text-center gap-2">
        {subject && <InitialMedallion letter={subject.letter} size={60} />}
        <div className="text-[11px] font-bold tracking-widest text-secondary-700 uppercase">{code}</div>
        <h1 className="text-xl leading-snug px-2" style={{ fontFamily: 'var(--font-display)' }}>{title}</h1>
        {done && (
          <span className="inline-flex items-center gap-1 text-xs text-leaf-700 font-bold">
            <CheckCircle2 size={14} /> Teljesítve · legjobb {progress.bestScore}%
          </span>
        )}
        <OrnamentDivider />
      </header>

      {flashCount > 0 && (
        <Link to={`/flashcards/${topic.id}`} className="card-clean tome-card-lift flex items-center gap-3 group">
          <div className="rounded-md bg-secondary-100 p-2 shrink-0">
            <Layers className="text-secondary-700" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink-700">Flashcards — átnézés</div>
            <div className="text-xs text-ink-400">{flashCount} kártya · lapozós, pontozás nélkül</div>
          </div>
          <ChevronRight className="text-accent-500 group-hover:translate-x-0.5 transition-transform shrink-0" size={20} />
        </Link>
      )}

      <div className="section-rule"><h2>Játékok</h2></div>

      <ul className="space-y-2.5">
        {GAME_DEFS.map(({ type, label, hint }) => {
          const n = countOf(type);
          if (n === 0) return null;
          const off = disabled.includes(type);
          const inner = (
            <>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-700">{label}</div>
                <div className="text-xs text-ink-400">{n} kérdés · {hint}</div>
              </div>
              {off
                ? <span className="text-[10px] uppercase tracking-widest text-ink-400 shrink-0">kikapcsolva</span>
                : <ChevronRight className="text-accent-500 group-hover:translate-x-0.5 transition-transform shrink-0" size={20} />}
            </>
          );
          return off ? (
            <li key={type} className="card-clean flex items-center gap-3 opacity-50 cursor-not-allowed">{inner}</li>
          ) : (
            <li key={type}>
              <Link to={`/quiz/${topic.id}?type=${type}`} className="card-clean tome-card-lift flex items-center gap-3 group">
                {inner}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
