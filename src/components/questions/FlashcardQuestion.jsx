import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye } from 'lucide-react';

// Full-height flex column: a kártya a köztes sávban görög, a gombok
// fixen a viewport alján maradnak — mobilon nem kell legörgetni.
// A szülő-konténer feleletes definite magasságról: lásd FlashcardReview.
export default function FlashcardQuestion({ question, onAnswer }) {
  const [showBack, setShowBack] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="text-center text-xs uppercase tracking-wider text-accent-700 font-semibold shrink-0">
        Flashcard
      </div>

      {/* Kártya + gombok függőlegesen középre rendezve — így a "Mennyire tudtad?"
          gombok közvetlenül a kártya alatt vannak, nem a képernyő alján. */}
      <div className="flex-1 min-h-0 flex flex-col gap-4 pt-2 pb-1 justify-start dark:justify-between">
        <div className="min-h-0 overflow-y-auto flex items-center justify-center">
          <AnimatePresence mode="wait">
            {!showBack ? (
              <motion.div
                key="front"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="card w-full py-8 text-center flex items-center justify-center"
              >
                <p className="text-2xl text-ink-700 leading-snug px-4">{question.front}</p>
              </motion.div>
            ) : (
              <motion.div
                key="back"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="card-clean w-full"
              >
                <div className="text-xs uppercase tracking-wider text-secondary-700 font-semibold mb-2">Megoldás</div>
                <p className="text-ink-700 leading-relaxed">{question.back}</p>
                {question.explanation && (
                  <div className="mt-4 pt-3 border-t border-accent-300/60">
                    <p className="text-sm text-ink-500 leading-relaxed">{question.explanation}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0">
          {!showBack ? (
            <button onClick={() => setShowBack(true)} className="btn-flash-reveal">
              <Eye size={18} strokeWidth={2.5} /> Mutasd a választ
            </button>
          ) : (
            <SelfGradeButtons onAnswer={onAnswer} />
          )}
        </div>
      </div>
    </div>
  );
}

export function SelfGradeButtons({ onAnswer }) {
  return (
    <div className="space-y-2">
      <p className="text-center text-xs uppercase tracking-widest text-ink-500 font-semibold">
        Mennyire tudtad?
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAnswer('again')}
          className="btn-flash-grade bg-rose-50 text-rose-700"
        >
          Újra
        </button>
        <button
          onClick={() => onAnswer('hard')}
          className="btn-flash-grade bg-amber-50 text-amber-700"
        >
          Kicsit
        </button>
        <button
          onClick={() => onAnswer('good')}
          className="btn-flash-grade bg-leaf-50 text-leaf-700"
        >
          Tudom
        </button>
      </div>
    </div>
  );
}
