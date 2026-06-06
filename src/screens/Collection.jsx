import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { CARDS, cardsByCategory, CATEGORIES, COPY } from '../theme.js';
import { useStore } from '../engine/store.js';
import { CornerOrnaments, FlowerMotif, ArchHeader, MiniCardCorners, VerticalFiligree, BraidedDivider } from '../components/Ornament.jsx';
import CardPlaceholder from '../components/CardPlaceholder.jsx';
import { useTilt } from '../hooks/useTilt.js';
import clsx from 'clsx';

// Római szám konvertáló — tetszőleges fejezetszámig (1..3999)
function toRoman(n) {
  if (n <= 0) return '';
  const map = [['M',1000],['CM',900],['D',500],['CD',400],['C',100],['XC',90],['L',50],['XL',40],['X',10],['IX',9],['V',5],['IV',4],['I',1]];
  let s = '';
  for (const [r, v] of map) while (n >= v) { s += r; n -= v; }
  return s + '.';
}

export default function Collection() {
  const unlocked = useStore((s) => s.unlockedCards);

  const [pageState, setPageState] = useState({ page: 0, direction: 1 });
  const [selected, setSelected] = useState(null);
  const reduceMotion = useReducedMotion();
  const tabRefs = useRef([]);

  const page = pageState.page;
  const direction = pageState.direction;

  function isCategoryDiscovered(catId) {
    return CARDS.some((a) => a.category === catId && unlocked[a.id]);
  }

  function jumpTo(target) {
    if (target === page) return;
    setPageState({ page: target, direction: target > page ? 1 : -1 });
  }

  function go(delta) {
    const next = (page + delta + CATEGORIES.length) % CATEGORIES.length;
    setPageState({ page: next, direction: delta });
  }

  const cat = CATEGORIES[page];

  // Aktív könyvjelző automatikus középre görgetése lapozáskor (spec 3. pont)
  useEffect(() => {
    const el = tabRefs.current[page];
    if (el) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [page, reduceMotion]);

  return (
    <div className="min-h-screen bg-base-300/30 pb-12 select-none overflow-hidden">
      <ArchHeader title={COPY.collection.title} />

      <div className="max-w-4xl mx-auto px-1 sm:px-6 relative">
        {/* Lapozó nyilak: a viewporthoz fixáltak (top-1/2), nem a könyvhöz —
            görgetéskor nem mozognak, mindig elérhetőek. */}
        <button
          onClick={() => go(-1)}
          aria-label="Előző fejezet"
          className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 text-accent-700 active:scale-90 opacity-80 hover:opacity-100 z-30 bg-base-100/70 hover:bg-base-100 backdrop-blur-sm rounded-full shadow-md border border-accent-200"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={() => go(1)}
          aria-label="Következő fejezet"
          className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 text-accent-700 active:scale-90 opacity-80 hover:opacity-100 z-30 bg-base-100/70 hover:bg-base-100 backdrop-blur-sm rounded-full shadow-md border border-accent-200"
        >
          <ChevronRight size={28} />
        </button>

        {/* Book viewport — Pure CSS Book Design without buggy dragging */}
        <div className="flex justify-center items-center w-full px-1 mt-4 relative">

        <div className="relative w-full max-w-3xl">

          {/* Top-mounted scrollable bookmarks */}
          <div className="relative mb-[-1px] z-20">
            <div className="flex overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory px-2 pt-4 pb-0 gap-1 bg-ink-900/10 rounded-t-xl border-t border-x border-accent-400/30">
              {CATEGORIES.map((c, i) => (
                <button
                  key={c.id}
                  ref={(el) => (tabRefs.current[i] = el)}
                  onClick={() => jumpTo(i)}
                  aria-label={`${isCategoryDiscovered(c.id) ? c.name : 'Ismeretlen'} fejezet${i === page ? ' (aktív)' : ''}`}
                  aria-current={i === page ? 'page' : undefined}
                  className={clsx(
                    "snap-start flex-shrink-0 min-w-[90px] px-3 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border-t border-x rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-inset",
                    i === page
                      ? "bg-[var(--parchment)] text-[var(--ink-brown)] border-[var(--gold)] h-12 mt-0 shadow-[-4px_-2px_10px_rgba(0,0,0,0.1)]"
                      : "bg-accent-400/55 text-[var(--ink-brown2)] border-transparent h-11 mt-1 hover:bg-accent-400/70"
                  )}
                >
                  {isCategoryDiscovered(c.id) ? c.id.split('_')[0] : '???'}
                </button>
              ))}
            </div>
            {/* Fade gradients */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--page)] to-transparent pointer-events-none z-30" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--page)] to-transparent pointer-events-none z-30" />
          </div>

          <div aria-hidden className="absolute pointer-events-none" style={{
            inset: '6px -10px -8px 10px',
            background: 'linear-gradient(to right, transparent 0%, var(--page) 4px, var(--page) calc(100% - 4px), transparent 100%)',
            borderRadius: '2px 4px 4px 2px',
            zIndex: 0,
            opacity: 0.6,
            boxShadow: '0 8px 14px -8px rgba(0,0,0,0.18)',
          }} />
          <div aria-hidden className="absolute pointer-events-none" style={{
            inset: '3px -5px -4px 5px',
            background: 'linear-gradient(to right, transparent 0%, var(--page2) 4px, var(--page2) calc(100% - 4px), transparent 100%)',
            borderRadius: '2px 4px 4px 2px',
            zIndex: 0,
            opacity: 0.7,
            boxShadow: '0 6px 10px -6px rgba(0,0,0,0.14)',
          }} />

          <div className="relative z-10">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={page}
                custom={direction}
                style={reduceMotion ? undefined : {
                  transformStyle: 'preserve-3d',
                  perspective: '1400px',
                  transformOrigin: direction > 0 ? 'left center' : 'right center',
                }}
                initial={(d) =>
                  reduceMotion
                    ? { x: d > 0 ? 30 : -30, opacity: 0 }
                    : { rotateY: d > 0 ? 90 : -90, opacity: 0 }
                }
                animate={
                  reduceMotion
                    ? { x: 0, opacity: 1 }
                    : { rotateY: 0, opacity: 1 }
                }
                exit={(d) =>
                  reduceMotion
                    ? { x: d > 0 ? -30 : 30, opacity: 0 }
                    : { rotateY: d > 0 ? -90 : 90, opacity: 0 }
                }
                transition={reduceMotion
                  ? { duration: 0.25, ease: 'easeOut' }
                  : { duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <CategoryPage
                  cat={cat}
                  pageIndex={page}
                  discovered={isCategoryDiscovered(cat.id)}
                  cards={cardsByCategory(cat.id)}
                  unlocked={unlocked}
                  onSelect={setSelected}
                  reduceMotion={reduceMotion}
                />
              </motion.div>
            </AnimatePresence>
            {!reduceMotion && (
              <div
                key={`spine-${page}`}
                className="absolute pointer-events-none"
                style={{
                  top: 0, bottom: 0,
                  left: direction > 0 ? 0 : undefined,
                  right: direction > 0 ? undefined : 0,
                  width: '32%',
                  background: 'linear-gradient(90deg, transparent 0%, #c9a961 50%, transparent 100%)',
                  animation: 'tome-spine-flash 350ms ease-out',
                  mixBlendMode: 'overlay',
                  zIndex: 5,
                }}
              />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <DetailModal
            card={selected}
            unlock={unlocked[selected.id]}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

const GRID_STAGGER = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.2 },
  },
};
const CARD_FROM = {
  hidden: { opacity: 0, y: 22, scale: 0.9 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring', stiffness: 230, damping: 24, mass: 0.7 },
  },
};
const CARD_FROM_REDUCED = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
};

function CategoryPage({ cat, pageIndex, discovered, cards, unlocked, onSelect, reduceMotion = false }) {
  const titleColor = discovered ? cat.accent : '#9b7e3a';
  const accent = discovered ? cat.accent : '#9b7e3a';
  // Feloldott lovak előre a sorban (a csoporton belül az eredeti sorrend marad)
  const orderedCards = [...cards].sort(
    (a, b) => (unlocked[b.id] ? 1 : 0) - (unlocked[a.id] ? 1 : 0)
  );
  return (
    <div
      className="p-4 sm:p-6 relative min-h-[45vh] flex flex-col overflow-hidden"
      style={{
        backgroundColor: 'var(--parchment)',
        boxShadow: `
          0 1px 1px rgba(0,0,0,0.11), 
          0 2px 2px rgba(0,0,0,0.11), 
          0 4px 4px rgba(0,0,0,0.11), 
          0 8px 8px rgba(0,0,0,0.11), 
          0 16px 16px rgba(0,0,0,0.11),
          inset 20px 0 35px -15px rgba(0,0,0,0.2)
        `,
        borderLeft: '1px solid rgba(0,0,0,0.05)',
        borderRadius: '2px 8px 8px 2px',
      }}
    >
      <div className="tome-paper-noise absolute inset-0 pointer-events-none" aria-hidden />
      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none"></div>

      <div className="hidden md:block absolute top-1/2 left-3 -translate-y-1/2 pointer-events-none opacity-55" aria-hidden style={{ height: '70%' }}>
        <VerticalFiligree side="left" height={300} color={accent} />
      </div>
      <div className="hidden md:block absolute top-1/2 right-12 -translate-y-1/2 pointer-events-none opacity-55" aria-hidden style={{ height: '70%' }}>
        <VerticalFiligree side="right" height={300} color={accent} />
      </div>
      
      <div className="relative z-10 pl-2">
        <div className="text-center mb-3">
          <div className="text-[10px] uppercase tracking-[0.3em] font-bold mb-1"
               style={{ color: accent, fontFamily: 'system-ui, sans-serif' }}>
            {toRoman(pageIndex + 1)} fejezet
          </div>
          {discovered ? (
            <>
              <div className="text-2xl italic" style={{ color: titleColor, fontFamily: 'var(--font-body)' }}>
                {cat.subtitle}
              </div>
              <h2 className="tome-title text-2xl sm:text-3xl">{cat.name}</h2>
              <p className="text-sm text-ink-600 italic mt-1 leading-snug px-1"
                 style={{ fontFamily: 'var(--font-body)' }}>
                {cat.description}
              </p>
            </>
          ) : (
            <>
              <div className="tome-script text-2xl text-accent-600">{COPY.collection.undiscoveredChapter}</div>
              <h2 className="tome-title text-2xl sm:text-3xl">— — —</h2>
              <p className="text-sm text-ink-600 italic mt-1 leading-snug px-1"
                 style={{ fontFamily: 'var(--font-body)' }}>
                Egy újabb világ vár felfedezésre. Teljesíts leckéket, hátha innen érkezik az új kártya.
              </p>
            </>
          )}
        </div>

        <BraidedDivider color={accent} />

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 mt-4"
          variants={GRID_STAGGER}
          initial="hidden"
          animate="show"
        >
          {cards.length === 0 ? (
            <div className="col-span-2 text-center text-sm text-ink-500 py-6">
              <FlowerMotif size={24} color={cat.accent} />
              <p className="mt-2">Ez az oldal még üres — gyűjts kártyákat ehhez a kategóriához!</p>
            </div>
          ) : (
            orderedCards.map((a) => (
              <motion.div key={a.id} variants={reduceMotion ? CARD_FROM_REDUCED : CARD_FROM}>
                <MiniCard
                  card={a}
                  unlock={unlocked[a.id]}
                  onClick={unlocked[a.id] ? () => onSelect(a) : undefined}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {cards.length > 0 && (
          <div className="flex justify-center mt-6 mb-2 opacity-70" aria-hidden>
            <FlowerMotif size={22} color={accent} />
          </div>
        )}
      </div>
    </div>
  );
}

function MiniCard({ card, unlock, onClick }) {
  const isUnlocked = Boolean(unlock);
  const level = unlock?.level || 1;
  const levelData = card.levels.find((l) => l.level === level) || card.levels[0];
  const hasImage = isUnlocked && levelData?.image;

  const [pulse, setPulse] = useState(false);
  function handleClick(e) {
    if (!onClick) return;
    setPulse(true);
    onClick(e);
    setTimeout(() => setPulse(false), 200);
  }
  function handleKeyDown(e) {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  }
  const tilt = useTilt({ max: 14 });

  const npVars = isUnlocked
    ? { '--np-bg': 'linear-gradient(180deg, #f5d4b5 0%, #c9a961 50%, #9b7e3a 100%)', '--np-bt': '#c9a961', '--np-bb': '#6b4f1a', '--np-color': '#2a1810' }
    : { '--np-bg': 'linear-gradient(180deg, #eaddc5, #c9a961, #9b7e3a)', '--np-bt': '#c9a961', '--np-bb': '#6b4f1a', '--np-color': '#6b4f1a' };

  const cardShadow = isUnlocked
    ? `0 0 0 1px #c9a961, 0 0 0 3px #faf3e7, 0 0 0 4px #9b7e3a, 0 4px 12px -4px rgba(0,0,0,0.15)`
    : `0 0 0 1px #d9bf90, 0 0 0 3px #faf3e7, 0 0 0 4px #b8945a, 0 2px 8px -4px rgba(0,0,0,0.18)`;

  return (
    <div
      {...tilt}
      onClick={onClick ? handleClick : undefined}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? card.name : undefined}
      className={clsx(
        'tome-tilt tome-card-lift relative rounded-sm bg-base-50/95 flex flex-col',
        onClick && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 focus-visible:ring-offset-2',
        !isUnlocked && 'opacity-90',
        pulse && 'tome-tap-pulse',
      )}
      style={{
        aspectRatio: '3 / 4.4',
        boxShadow: cardShadow,
      }}
    >
      <MiniCardCorners color={isUnlocked ? '#9b7e3a' : '#b8945a'} inset={4} size={11} bottomInset={36} />

      <div className="relative flex-1 m-1 mx-1.5 flex items-center justify-center" style={{ zIndex: 10 }}>
        <div className="tome-bg-anchor" aria-hidden />
        {hasImage ? (
          <img src={levelData.image} alt={card.name} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain p-1" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <CardPlaceholder
              color={isUnlocked ? '#9b7e3a' : '#6b4f1a'}
              opacity={isUnlocked ? 0.42 : 0.32}
            />
          </div>
        )}
      </div>

      <div className="tome-nameplate" style={{ ...npVars, fontSize: '0.78rem', borderRadius: '0 0 1px 1px' }}>
        {isUnlocked ? card.name : '???'}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

function DetailModal({ card, unlock, onClose }) {
  const level = unlock?.level || 1;
  const levelData = card.levels.find((l) => l.level === level) || card.levels[0];

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const tilt = useTilt({ max: 10 });

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={card.name}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClose}
      className="fixed top-0 left-0 h-[100dvh] w-[100dvw] z-[100] backdrop-blur-md flex items-center justify-center p-4 overflow-hidden"
      style={{ perspective: '1400px', background: `radial-gradient(circle at 50% 50%, rgba(155,126,58,0.15) 0%, rgba(0,0,0,0.85) 50%, rgba(0,0,0,0.98) 100%)`, touchAction: 'none' }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label={COPY.collection.closeModal || 'Bezárás'}
        className="fixed top-4 right-4 z-[110] w-11 h-11 flex items-center justify-center bg-base-100 text-ink-700 rounded-full shadow-lg border border-accent-300 active:scale-90 transition-transform"
      >
        <X size={22} />
      </button>

      <motion.div
        initial={{ scale: 0.86, y: 28, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 12, opacity: 0, transition: { duration: 0.18, ease: 'easeIn' } }}
        transition={{
          opacity: { duration: 0.22, ease: 'easeOut' },
          default: { type: 'spring', stiffness: 240, damping: 24, mass: 0.9 },
        }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-md w-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div
          {...tilt}
          className="tome-tilt relative bg-base-50 rounded-sm w-full px-6 pt-5 pb-6 text-center"
          style={{
            boxShadow: `0 0 0 1px #c9a961, 0 0 0 5px #faf3e7, 0 0 0 6px #9b7e3a, 0 20px 60px -12px rgba(0,0,0,0.55)`,
          }}
        >
          <CornerOrnaments size={28} color="#9b7e3a" />

          <div className="relative" style={{ zIndex: 10 }}>
            
            <div className="mx-auto my-4 relative w-full max-w-[300px] aspect-square flex items-center justify-center">
              <div className="tome-bg-anchor scale-125" aria-hidden />
              {levelData.image ? (
                <img
                  src={levelData.image}
                  alt={card.name}
                  loading="lazy"
                  decoding="async"
                  className="relative z-10 w-full h-full object-contain p-1"
                  style={{ filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.15))` }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <CardPlaceholder color="#9b7e3a" opacity={0.45} />
                </div>
              )}
            </div>

            <div
              className="tome-nameplate mx-auto rounded-sm"
              style={{
                '--np-bg': 'linear-gradient(180deg, #f5d4b5 0%, #c9a961 50%, #9b7e3a 100%)',
                '--np-bt': '#c9a961',
                '--np-bb': '#6b4f1a',
                '--np-color': '#2a1810',
                fontSize: '1.05rem',
                padding: '8px 28px 9px',
                maxWidth: '85%',
                whiteSpace: 'normal',
                overflow: 'visible',
                textOverflow: 'clip',
              }}
            >
              {card.name}
            </div>
            <p className="tome-script text-xl text-accent-600 leading-tight mt-2">
              {card.subtitle}
            </p>
            <p className="text-xs text-ink-500 italic">— {card.source} —</p>

            <BraidedDivider />

            <p className="text-ink-600 text-base leading-relaxed text-left italic"
               style={{ fontFamily: 'var(--font-body)' }}>
              „{card.lore}"
            </p>

            <button onClick={onClose} className="btn-secondary mt-5">{COPY.collection.closeModal}</button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
