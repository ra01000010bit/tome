import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CheckCircle2, AlertTriangle, CircleDot } from 'lucide-react';
import { SUBJECTS, topicsForSubject, splitTetel } from '../theme.js';
import { useStore, getTopicProgress, getQuestionState } from '../engine/store.js';
import { isDue } from '../engine/fsrs.js';
import { ArchHeader, OrnamentDivider, InitialMedallion } from '../components/Ornament.jsx';

// Mastery-sávok színen FELÜL ikonnal/szöveggel is jeleznek (a11y: nem csak szín):
//  <50%   gyenge   warm/red
//  50–79% közepes  accent/amber
//  >=80%  erős     leaf/green
function masteryTier(score) {
  if (score >= 80) {
    return {
      label: 'Erős',
      barClass: 'bg-leaf-500',
      textClass: 'text-leaf-700',
      Icon: CheckCircle2,
    };
  }
  if (score >= 50) {
    return {
      label: 'Közepes',
      barClass: 'bg-accent-500',
      textClass: 'text-accent-700',
      Icon: CircleDot,
    };
  }
  return {
    label: 'Gyenge',
    barClass: 'bg-warm-500',
    textClass: 'text-warm-600',
    Icon: AlertTriangle,
  };
}

export default function Mastery() {
  // Újraszámolás, ha a haladás vagy a kérdés-állapotok változnak.
  const topicProgress = useStore((s) => s.topicProgress);
  const questionStates = useStore((s) => s.questionStates);

  const groups = useMemo(() => {
    return SUBJECTS.map((subject) => {
      const topics = topicsForSubject(subject.id).map((topic) => {
        const { code, title } = splitTetel(topic.name);
        const bestScore = getTopicProgress(topic.id).bestScore || 0;
        const dueCount = topic.questions.filter((q) => {
          const st = getQuestionState(q.id);
          return st.state === 'new' || isDue(st);
        }).length;
        return { topic, code, title, bestScore, dueCount };
      });
      return { subject, topics };
    });
    // topicProgress / questionStates a függőség — getTopicProgress/getQuestionState
    // a friss store-állapotból olvas, így a memo újrafut amikor azok változnak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicProgress, questionStates]);

  const hasAnyTopic = groups.some((g) => g.topics.length > 0);

  return (
    <div className="space-y-6">
      <ArchHeader title="Tudásszint" />

      <p
        className="text-center text-sm text-ink-500 -mt-2 leading-relaxed"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        Tételenként a legjobb eredményed és az átismétlésre váró kérdések.
      </p>

      {!hasAnyTopic && (
        <div className="card-clean text-center text-ink-500" role="status">
          Még nincs elérhető tétel.
        </div>
      )}

      {groups.map(({ subject, topics }) => {
        if (topics.length === 0) return null;
        return (
          <section key={subject.id}>
            <div className="flex items-center gap-3 mb-3">
              <InitialMedallion letter={subject.letter} size={44} />
              <div className="min-w-0">
                <h2 className="tome-title text-lg leading-tight">{subject.name}</h2>
                <p className="text-[11px] text-ink-500" style={{ fontFamily: 'var(--font-body)' }}>
                  {subject.description}
                </p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {topics.map(({ topic, code, title, bestScore, dueCount }) => {
                const tier = masteryTier(bestScore);
                const { Icon } = tier;
                return (
                  <li key={topic.id}>
                    <Link
                      to={`/topic/${topic.id}`}
                      className="card-clean tome-card-lift flex items-center gap-3 group"
                    >
                      <div className="flex-1 min-w-0">
                        {code && (
                          <div className="text-[10px] font-bold tracking-widest text-secondary-700 uppercase">
                            {code}
                          </div>
                        )}
                        <div className="font-bold text-ink-700 leading-snug truncate">{title}</div>

                        {/* Mastery-sáv + % szöveg (szín + ikon + szám = a11y-konform) */}
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className="flex-1 h-2 bg-base-200 rounded-full overflow-hidden"
                            role="progressbar"
                            aria-valuenow={bestScore}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Tudásszint: ${tier.label}, ${bestScore} százalék`}
                          >
                            <div
                              className={`h-full ${tier.barClass} transition-all`}
                              style={{ width: `${bestScore}%` }}
                            />
                          </div>
                          <span className={`inline-flex items-center gap-1 text-xs font-bold ${tier.textClass} shrink-0`}>
                            <Icon size={13} aria-hidden /> {bestScore}%
                          </span>
                        </div>

                        <div className="text-[11px] text-ink-400 mt-1.5">
                          {dueCount > 0
                            ? `${dueCount} kérdés esedékes`
                            : 'Nincs esedékes kérdés'}
                        </div>
                      </div>

                      {dueCount > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest bg-accent-600 text-base-50 px-2 py-0.5 rounded-sm shrink-0">
                          {dueCount}
                        </span>
                      )}
                      <ChevronRight
                        className="text-accent-500 group-hover:translate-x-0.5 transition-transform shrink-0"
                        size={20}
                        aria-hidden
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <OrnamentDivider />
          </section>
        );
      })}
    </div>
  );
}
