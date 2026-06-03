import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { themeConfig } from '../theme.js';
import { IrisMotif } from './Ornament.jsx';
import './SplashGate.css';

// Téma-vezérelt nyitóképernyő. Minden szöveg/szín a téma `theme.config.js`-éből
// jön (`brand` + `splash`), így téma-cserekor a kód nem változik. Képfüggetlen:
// gradiens háttér + SVG-flourish + animált cím. Egy téma adhat saját Splash.jsx-et
// is, ha egyedi nyitót akar (lásd docs/THEMING.md).
export default function SplashGate({ onOpen, onComplete }) {
  const [opening, setOpening] = useState(false);
  const [done, setDone] = useState(false);

  const brand  = themeConfig?.brand  || {};
  const splash = themeConfig?.splash || {};
  const line1 = brand.line1 || brand.full || brand.short || 'TOME';
  const line2 = brand.line2 || '';

  function open() {
    if (opening) return;
    onOpen?.();
    setOpening(true);
    setTimeout(() => setDone(true), 1100);
  }

  useEffect(() => {
    if (done) onComplete?.();
  }, [done, onComplete]);

  if (done) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="splash-gate"
        className="tome-splash"
        style={{ background: splash.bgGradient || 'radial-gradient(ellipse at 50% 40%, rgb(var(--c-base-50)) 0%, rgb(var(--c-base-300)) 100%)' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: opening ? 0 : 1 }}
        transition={{ duration: opening ? 1.0 : 0 }}
      >
        {/* Teljes-felület kattintózóna — bárhol kattintva belép */}
        <button
          className="tome-splash-click"
          onClick={open}
          aria-label={`Belépés${brand.full ? ' — ' + brand.full : ''}`}
        />

        <div className="tome-splash-edge-glow" aria-hidden="true" />

        <motion.div
          className="tome-splash-scene"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {splash.monogram && (
            <div
              className="tome-splash-monogram"
              style={{ color: splash.titleColor || 'rgb(var(--c-accent-600))' }}
              aria-hidden="true"
            >
              {splash.monogram}
            </div>
          )}

          <div className="tome-splash-flourish" aria-hidden="true">
            <IrisMotif size={38} />
          </div>

          <h1
            className="tome-splash-title"
            style={{
              color: splash.titleColor || undefined,
              '--splash-glow': splash.titleGlow || 'rgba(255,255,255,0.6)',
              '--splash-aura': splash.titleAura || 'rgba(0,0,0,0.18)',
            }}
          >
            {line1}{line2 && <><br />{line2}</>}
          </h1>

          <div className="tome-splash-hint">{splash.button || 'Koppints a belépéshez'}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
