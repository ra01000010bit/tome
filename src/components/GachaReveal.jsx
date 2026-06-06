// Mucha-stílusú gacha-pull animáció:
//   1. Kártyahátlap középre repül (scale 0 → 1)
//   2. Megfordul (rotateY 0 → 180)
//   3. Felfedett kártya
//   4. Felhasználó "Beengedem a karámba" gombra zár

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { findCard, themeConfig } from '../theme.js';
import { CornerOrnaments, OrnamentDivider } from './Ornament.jsx';
import { useTilt } from '../hooks/useTilt.js';

export default function GachaReveal({ result, onClose, isStarter = false }) {
  const [stage, setStage] = useState('appearing'); // appearing → flipping → revealed
  
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const t1 = setTimeout(() => setStage('flipping'), 500);
    const t2 = setTimeout(() => setStage('revealed'), 1400);
    return () => {
      document.body.style.overflow = originalOverflow;
      [t1, t2].forEach(clearTimeout);
    };
  }, []);

  // Esc csak felfedés után zár (ne szakítsa meg a pull-animációt)
  useEffect(() => {
    if (stage !== 'revealed') return;
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [stage, onClose]);

  if (!result) return null;
  const card = findCard(result.card?.id || result.card);
  if (!card) return null;

  const level = result.level || 1;
  const levelData = card.levels.find((l) => l.level === level) || card.levels[0];

  const isFlipped = stage === 'flipping' || stage === 'revealed';
  const tilt = useTilt({ max: 10 });

  return createPortal((
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={isStarter ? 'Üdvözlő ajándék' : `Új kártya: ${card.name}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: 'radial-gradient(ellipse at center, rgba(61,37,32,0.94) 0%, rgba(0,0,0,0.985) 70%)' }}
    >
      <div
        style={{ perspective: '1500px' }}
        className={stage === 'revealed' ? 'tome-tilt' : undefined}
        {...(stage === 'revealed' ? tilt : {})}
      >
        <motion.div
          initial={{ scale: 0, opacity: 0, rotateY: 0 }}
          animate={{
            scale: 1,
            opacity: 1,
            rotateY: isFlipped ? 180 : 0,
          }}
          transition={{
            scale:    { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
            opacity:  { duration: 0.3 },
            rotateY:  { duration: 0.9, ease: 'easeInOut' },
          }}
          style={{
            position: 'relative',
            width: '320px',
            height: '480px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* HÁTLAP */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            <CardBack />
          </div>

          {/* ELEJE */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <CardFront card={card} levelData={levelData} isStarter={isStarter} />
          </div>
        </motion.div>
      </div>

      {/* Bezárás gomb csak felfedés után */}
      <AnimatePresence>
        {stage === 'revealed' && (
          <motion.button
            key="close"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute bottom-12 btn-primary px-8 py-3"
          >
            HOZZÁADÁS A GYŰJTEMÉNYHEZ
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  ), document.body);
}

// ────────────────────────────────────────────────────────────────────────────

function CardBack() {
  return (
    <div
      className="w-full h-full rounded-sm relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #5d3a32 0%, #3d2520 40%, #5d3a32 100%)",
        boxShadow: `0 0 0 2px #9b7e3a, 0 0 0 6px #faf3e7, 0 0 0 8px #c9a961, 0 30px 60px -15px rgba(0,0,0,0.7)`,
      }}
    >
      <svg viewBox="0 0 320 480" className="absolute inset-0 w-full h-full pointer-events-none" fill="none">
        <rect x="14" y="14" width="292" height="452" stroke="#c9a961" strokeWidth="1.2" />
        <rect x="22" y="22" width="276" height="436" stroke="#9b7e3a" strokeWidth="0.6" />
        <path d="M 50 60 Q 50 30 110 30 L 210 30 Q 270 30 270 60 L 270 200 L 50 200 Z"
              stroke="#c9a961" strokeWidth="1" fill="none" />
        <g transform="translate(160, 130)" stroke="#c9a961" fill="#9b7e3a" strokeWidth="0.8">
          <ellipse cx="0" cy="-20" rx="6" ry="14" />
          <ellipse cx="20" cy="0"  rx="14" ry="6" />
          <ellipse cx="0" cy="20"  rx="6" ry="14" />
          <ellipse cx="-20" cy="0" rx="14" ry="6" />
          <circle cx="0" cy="0" r="6" fill="#c9a961" />
          <circle cx="0" cy="0" r="2.5" fill="#3d2520" />
        </g>
        <text
          x="160" y="290"
          textAnchor="middle"
          fontFamily='-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif'
          fontSize="120"
          fontWeight="700"
          fill="#c9a961"
          opacity="0.9"
          letterSpacing="6"
        >
          {(themeConfig?.splash?.monogram || themeConfig?.brand?.short || 'T').charAt(0)}
        </text>
        <rect x="50" y="320" width="220" height="120" stroke="#c9a961" strokeWidth="1" fill="none" />
        <g transform="translate(160, 380)" stroke="#c9a961" fill="#9b7e3a" strokeWidth="0.6">
          <ellipse cx="0" cy="-15" rx="3" ry="8" />
          <ellipse cx="-12" cy="0" rx="8" ry="3" />
          <ellipse cx="12" cy="0"  rx="8" ry="3" />
          <ellipse cx="0" cy="15"  rx="3" ry="8" />
          <circle cx="0" cy="0" r="3" />
        </g>
        {[
          { x: 30,  y: 30,  r: 0   },
          { x: 290, y: 30,  r: 90  },
          { x: 290, y: 450, r: 180 },
          { x: 30,  y: 450, r: 270 },
        ].map((p, i) => (
          <g key={i} transform={`translate(${p.x}, ${p.y}) rotate(${p.r})`}>
            <path d="M 0 0 Q 0 -10 10 -10" stroke="#c9a961" strokeWidth="1" fill="none" />
            <circle cx="3" cy="-3" r="1.4" fill="#c9a961" />
          </g>
        ))}
      </svg>
    </div>
  );
}

function CardFront({ card, levelData, isStarter }) {
  const headline = isStarter ? 'Üdvözlő ajándék' : 'Új kártya';
  return (
    <div
      className="w-full h-full rounded-sm relative bg-base-50 overflow-hidden"
      style={{
        boxShadow: `0 0 0 1px #c9a961, 0 0 0 5px #faf3e7, 0 0 0 6px #9b7e3a, 0 0 50px 10px rgba(0,0,0,0.15)`,
      }}
    >
      <CornerOrnaments size={26} color="#9b7e3a" />

      <div className="relative h-full flex flex-col items-center pt-6 px-5 pb-4 text-center">
        <div className="text-[10px] font-bold uppercase tracking-widest text-accent-700">
          {headline}
        </div>

        <div className="my-3 flex-1 flex items-center justify-center relative w-full">
          <div className="tome-bg-anchor" style={{ inset: '10%' }} aria-hidden />
          {levelData.image ? (
            <img
              src={levelData.image}
              alt={card.name}
              className="relative z-10 max-w-[220px] max-h-[220px] object-contain"
              style={{ filter: `drop-shadow(0 8px 12px rgba(0,0,0,0.25))` }}
            />
          ) : (
            <div
              className="relative z-10 w-40 h-40 flex items-center justify-center"
            >
              <Sparkles size={64} style={{ color: '#9b7e3a', opacity: 0.55 }} />
            </div>
          )}
        </div>

        <h2 className="tome-title text-3xl">{card.name}</h2>
        <p className="tome-script text-2xl text-accent-600 leading-tight">
          {card.subtitle}
        </p>
        <p className="text-[10px] text-ink-500 italic mb-1">— {card.source} —</p>

        <OrnamentDivider />

        <p className="text-ink-600 text-xs leading-snug italic line-clamp-3 px-2">
          „{card.lore}"
        </p>
      </div>
    </div>
  );
}
