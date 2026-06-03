import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Play, Sparkles } from 'lucide-react';
import { allTopics, findTopic, findSubject } from '../theme.js';
import { useStore, getQuestionState, recordAnswer } from '../engine/store.js';
import { QuestionRenderer } from '../components/questions/index.jsx';
import { OrnamentDivider, ArchHeader } from '../components/Ornament.jsx';

const WEAK_LIMIT = 10;

// Egy kérdés "gyenge", ha legalább kétszer látta és a helyes arány < 0.6,
// VAGY az utolsó válasz `again` volt és nem javította ki azóta.
function gradeQuestion(qid) {
  const st = getQuestionState(qid);
  if (st.reviewCount < 2) return null;
  const ratio = st.correctCount / st.reviewCount;
  return { ratio, reviewCount: st.reviewCount, lastState: st.state };
}

export default function WeakPoints() {
  const questionStates = useStore((s) => s.questionStates);
  const navigate = useNavigate();
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [frozenWeak, setFrozenWeak] = useState(null);

  const weak = useMemo(() => {
    const list = [];
    for (const topic of allTopics()) {
      for (const q of topic.questions) {
        const grade = gradeQuestion(q.id);
        if (!grade) continue;
        if (grade.ratio < 0.6 || grade.lastState === 'learning') {
          list.push({ ...q, topicId: topic.id, _grade: grade });
        }
      }
    }
    list.sort((a, b) => a._grade.ratio - b._grade.ratio || b._grade.reviewCount - a._grade.reviewCount);
    return list.slice(0, WEAK_LIMIT);
  }, [questionStates]);

  if (running) {
    const q = frozenWeak?.[index];
    if (!q) {
      return (
        <div className="space-y-5 text-center pt-6">
          <Sparkles size={40} className="mx-auto text-accent-600" />
          <h1 className="text-3xl">Átismételve!</h1>
          <p className="text-ink-500">Mindet átnézted. A gyenge pontok újraértékelődnek.</p>
          <button onClick={() => { setRunning(false); setIndex(0); setFrozenWeak(null); }} className="btn-secondary mx-auto">
            Vissza
          </button>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="text-center text-xs uppercase tracking-widest text-accent-700 font-bold">
          Gyenge pont · {index + 1} / {frozenWeak?.length ?? 0}
        </div>
        <QuestionRenderer
          key={q.id + index}
          question={q}
          onAnswer={(rating) => {
            recordAnswer(q.id, rating);
            setIndex(index + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ArchHeader title="Hibanapló" />
      <p className="text-ink-600 text-sm text-center -mt-1">
        Azok a kérdések, ahol a legtöbbet kapaszkodtál — érdemes velük gyakorolni.
      </p>

      <OrnamentDivider />

      {weak.length === 0 ? (
        <div className="card text-center py-10 text-ink-500">
          <AlertTriangle size={28} className="mx-auto text-accent-600 mb-2" />
          <p>Még nincs elég adat — válaszolj néhány kérdésre legalább kétszer, és előjönnek a gyenge pontok.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {weak.map((q) => {
              const topic = findTopic(q.topicId);
              const subject = topic && findSubject(topic.subjectId);
              const ratio = Math.round(q._grade.ratio * 100);
              const preview = q.text || q.front || q.statement || '(kérdés)';
              return (
                <li key={q.id} className="card-clean flex items-start gap-3">
                  <div className="shrink-0 w-12 h-12 rounded-md bg-rose-50 border border-rose-200 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-rose-700">{ratio}%</span>
                    <span className="text-[9px] text-rose-500 uppercase">helyes</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-ink-500">
                      {subject?.name} · {topic?.name}
                    </div>
                    <div className="text-ink-700 leading-snug line-clamp-2 mt-0.5">
                      {preview}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <button onClick={() => { setFrozenWeak([...weak]); setRunning(true); }} className="btn-primary w-full">
            <Play size={18} /> Gyakoroljunk ({weak.length})
          </button>
        </>
      )}

      <button onClick={() => navigate('/')} className="btn-ghost w-full">
        Vissza a főoldalra
      </button>
    </div>
  );
}
