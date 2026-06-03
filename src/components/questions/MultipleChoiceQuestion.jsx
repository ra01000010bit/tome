import { useState } from 'react';
import { Check, X, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { findTopic } from '../../theme.js';
import { useStore } from '../../engine/store.js';

export default function MultipleChoiceQuestion({ question, onAnswer }) {
  const confidenceMode = useStore((s) => s.settings?.confidenceMode);
  const [selected, setSelected] = useState(null);
  const [confidence, setConfidence] = useState(null);  // 'low' | 'mid' | 'high' | null
  const [revealed, setRevealed] = useState(false);

  function pick(idx) {
    if (revealed || (confidence !== null && confidenceMode)) return;
    setSelected(idx);
    if (!confidenceMode) setRevealed(true);
  }

  function pickConfidence(level) {
    setConfidence(level);
    setRevealed(true);
  }

  function continueNext() {
    const correct = selected === question.correct;
    // Confidence map: helyes + magas → good, helyes + közepes → good,
    // helyes + bizonytalan → hard. Rossz válasz → mindig again, függetlenül.
    let rating;
    if (!correct) {
      rating = 'again';
    } else if (confidenceMode) {
      rating = confidence === 'low' ? 'hard' : 'good';
    } else {
      rating = 'good';
    }
    onAnswer(rating);
  }

  const awaitingConfidence = confidenceMode && selected !== null && !revealed;

  return (
    <div className="space-y-4">
      <p className="text-xl text-ink-700 leading-snug font-medium">{question.text}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correct;
          const isSelected = i === selected;
          const lockedForConfidence = awaitingConfidence;
          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={revealed || lockedForConfidence}
              className={clsx(
                'w-full text-left rounded-xl border-2 px-4 py-3 transition-all flex items-center gap-3',
                !revealed && !lockedForConfidence && 'border-primary-100 bg-base-50 hover:border-primary-300 hover:bg-primary-50 active:scale-[0.99]',
                lockedForConfidence && isSelected && 'border-primary-400 bg-primary-50',
                lockedForConfidence && !isSelected && 'border-primary-100 bg-base-50 opacity-60',
                revealed && isCorrect && 'border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40',
                revealed && isSelected && !isCorrect && 'border-rose-400 bg-rose-50 dark:border-rose-600 dark:bg-rose-950/40',
                revealed && !isCorrect && !isSelected && 'border-primary-100 bg-base-50 opacity-50',
              )}
            >
              <span className={clsx(
                'w-7 h-7 rounded-full border-2 flex items-center justify-center font-bold text-sm shrink-0',
                !revealed && 'border-primary-300 text-primary-700',
                revealed && isCorrect && 'border-emerald-500 bg-emerald-500 text-white',
                revealed && isSelected && !isCorrect && 'border-rose-500 bg-rose-500 text-white',
                revealed && !isCorrect && !isSelected && 'border-primary-200 text-ink-500',
              )}>
                {revealed && isCorrect ? <Check size={16} /> :
                 revealed && isSelected && !isCorrect ? <X size={16} /> :
                 String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1 text-ink-700">{opt}</span>
            </button>
          );
        })}
      </div>

      {awaitingConfidence && (
        <ConfidencePicker onPick={pickConfidence} />
      )}

      {revealed && (
        <Explanation
          text={question.explanation}
          correct={selected === question.correct}
          onContinue={continueNext}
          question={question}
        />
      )}
    </div>
  );
}

function ConfidencePicker({ onPick }) {
  return (
    <div className="space-y-2 animate-[unlock_0.3s_ease-out]">
      <p className="text-center text-sm text-ink-500">Mennyire vagy biztos a válaszodban?</p>
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onPick('low')}
          className="rounded-xl border-2 border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/50 font-bold py-3 hover:bg-rose-100 active:scale-95 transition"
        >
          Bizonytalan
        </button>
        <button
          onClick={() => onPick('mid')}
          className="rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 font-bold py-3 hover:bg-amber-100 active:scale-95 transition"
        >
          Elég
        </button>
        <button
          onClick={() => onPick('high')}
          className="rounded-xl border-2 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 font-bold py-3 hover:bg-emerald-100 active:scale-95 transition"
        >
          Biztos
        </button>
      </div>
    </div>
  );
}

export function Explanation({ text, correct, onContinue, question }) {
  const [showSource, setShowSource] = useState(false);
  const topic = question?.topicId ? findTopic(question.topicId) : null;
  const section = question?.sourceSection;
  const pdf = topic?.sourcePdf || question?.sourcePdf;
  const quote = question?.sourceQuote;
  const hasSource = Boolean(section || pdf || quote);

  return (
    <div className={clsx(
      'rounded-2xl p-4 border-2 animate-[unlock_0.3s_ease-out]',
      correct ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50' : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/50',
    )}>
      <div role="alert" className={clsx('text-sm font-semibold mb-2 flex items-center gap-1.5', correct ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300')}>
        {correct ? <Check size={15} /> : <X size={15} />}
        {correct ? 'Helyes!' : 'Sajnos nem.'}
      </div>
      <p className="text-ink-700 text-sm leading-relaxed">{text}</p>

      {hasSource && (
        <div className="mt-3">
          <button
            onClick={() => setShowSource((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-800"
          >
            <BookOpen size={14} /> Mutasd a forrást a tételből
          </button>
          {showSource && (
            <div className="mt-2 p-3 rounded-lg bg-base-50/70 border border-primary-100 text-xs text-ink-600 space-y-2">
              {quote && (
                <blockquote className="border-l-2 border-accent-400 pl-2 italic text-ink-700 leading-relaxed">
                  „{quote}"
                </blockquote>
              )}
              {section && (
                <div><span className="font-bold text-ink-700">Fejezet:</span> {section}</div>
              )}
              {pdf && (
                <div><span className="font-bold text-ink-700">PDF:</span> <span className="italic">{pdf}</span></div>
              )}
            </div>
          )}
        </div>
      )}

      <button onClick={onContinue} className="btn-primary mt-4 w-full">Tovább</button>
    </div>
  );
}
