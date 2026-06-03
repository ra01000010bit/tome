import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Explanation } from './MultipleChoiceQuestion.jsx';

// Normalize: lowercase + strip diacritics + trim
function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function ClozeQuestion({ question, onAnswer }) {
  const segments = useMemo(() => parseSegments(question.text), [question.text]);
  const blanks = segments.filter((s) => s.type === 'blank');
  const [values, setValues] = useState(() => (question.answers || []).map(() => ''));
  const [revealed, setRevealed] = useState(false);

  const allCorrect = useMemo(() => {
    if (!revealed) return null;
    return values.every((v, i) => normalize(v) === normalize(question.answers[i]));
  }, [revealed, values, question.answers]);

  function submit() {
    setRevealed(true);
  }

  function continueNext() {
    onAnswer(allCorrect ? 'good' : 'again');
  }

  return (
    <div className="space-y-4">
      <div className="text-center text-xs uppercase tracking-wider text-ink-500 font-semibold">
        Töltsd ki a hiányzó részeket
      </div>

      <div className="card !bg-base-50 text-lg leading-loose text-ink-700">
        {segments.map((seg, idx) => {
          if (seg.type === 'text') return <span key={idx}>{seg.value}</span>;
          const i = seg.index;
          const isCorrect = revealed && normalize(values[i]) === normalize(question.answers[i]);
          return (
            <input
              key={idx}
              value={values[i]}
              onChange={(e) => setValues((vs) => vs.map((v, j) => j === i ? e.target.value : v))}
              disabled={revealed}
              aria-label={`Hiányzó szó ${i + 1}`}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={clsx(
                'inline-block min-w-[6ch] mx-1 px-2 py-0.5 rounded border-b-2 bg-transparent focus:outline-none text-center font-semibold',
                !revealed && 'border-primary-300 focus:border-primary-600',
                revealed && isCorrect && 'border-emerald-500 text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/40',
                revealed && !isCorrect && 'border-rose-500 text-rose-700 bg-rose-50 line-through decoration-rose-400 dark:text-rose-300 dark:bg-rose-950/40',
              )}
              style={{ width: `${Math.max(6, (values[i] || '').length + 2)}ch` }}
            />
          );
        })}
      </div>

      {revealed && !allCorrect && (
        <div className="card bg-amber-50 border-amber-200 text-sm dark:!bg-amber-950/50 dark:border-amber-800">
          <div className="font-semibold text-amber-700 dark:text-amber-300 mb-2">Helyes válaszok:</div>
          <ol className="list-decimal pl-5 space-y-0.5 text-ink-700">
            {question.answers.map((a, i) => (
              <li key={i}>
                <span className="font-semibold">{a}</span>
                {normalize(values[i]) !== normalize(a) && values[i] && (
                  <span className="text-rose-600 dark:text-rose-400 ml-2">(te: „{values[i]}")</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!revealed ? (
        <button
          onClick={submit}
          disabled={values.some((v) => !v.trim())}
          className="btn-primary w-full"
        >
          Ellenőrzés
        </button>
      ) : (
        <Explanation
          text={question.explanation}
          correct={allCorrect}
          onContinue={continueNext}
          question={question}
        />
      )}
    </div>
  );
}

function parseSegments(text) {
  const segs = [];
  const re = /\{\{c(\d+)\}\}/g;
  let lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) {
      segs.push({ type: 'text', value: text.slice(lastIndex, m.index) });
    }
    segs.push({ type: 'blank', index: parseInt(m[1], 10) - 1 });
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) {
    segs.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return segs;
}
