import { useState } from 'react';
import { Check, X } from 'lucide-react';
import clsx from 'clsx';
import { Explanation } from './MultipleChoiceQuestion.jsx';

export default function TrueFalseQuestion({ question, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  function pick(value) {
    if (revealed) return;
    setSelected(value);
    setRevealed(true);
  }

  function continueNext() {
    const correct = selected === question.correct;
    onAnswer(correct ? 'good' : 'again');
  }

  return (
    <div className="flex flex-col min-h-[68vh] gap-4 justify-start dark:justify-between py-1">
      <div className="card !bg-base-50">
        <p className="text-lg text-ink-700 leading-snug">{question.statement}</p>
      </div>

      <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { val: true,  label: 'Igaz',  color: 'emerald' },
          { val: false, label: 'Hamis', color: 'rose' },
        ].map(({ val, label, color }) => {
          const isCorrect = val === question.correct;
          const isSelected = val === selected;
          return (
            <button
              key={String(val)}
              onClick={() => pick(val)}
              disabled={revealed}
              className={clsx(
                'rounded-2xl border-2 py-6 font-bold text-xl transition-all flex flex-col items-center gap-2',
                !revealed && color === 'emerald' && 'border-emerald-200 bg-base-50 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 active:scale-95 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/40',
                !revealed && color === 'rose'    && 'border-rose-200    bg-base-50 text-rose-700    hover:bg-rose-50    hover:border-rose-400    active:scale-95 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40',
                revealed && isCorrect && 'border-emerald-400 bg-emerald-100 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
                revealed && isSelected && !isCorrect && 'border-rose-400 bg-rose-100 text-rose-700 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
                revealed && !isCorrect && !isSelected && 'opacity-40',
              )}
            >
              {revealed && isCorrect && <Check size={28} />}
              {revealed && isSelected && !isCorrect && <X size={28} />}
              {label}
            </button>
          );
        })}
      </div>

      {revealed && (
        <Explanation
          text={question.explanation}
          correct={selected === question.correct}
          onContinue={continueNext}
          question={question}
        />
      )}
      </div>
    </div>
  );
}
