import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { setUserName, hydrateFromServer, getState } from '../engine/store.js';
import { registerUser, saveAuth } from '../engine/sync.js';
import { CornerOrnaments, OrnamentDivider, FlowerMotif } from './Ornament.jsx';
import { themeConfig } from '../theme.js';

const BRAND = themeConfig?.brand?.full || 'Tome';
const CARDS_LABEL = themeConfig?.terminology?.cardPlural || 'Kártyák';

// UserGate — első indításkor (vagy resetelt save / új eszköz után) bekéri
// a játékos nevét és tisztázza, hogy új mentés-e vagy másik eszközről folytatás.
//
// Flow:
//   1) Név beírása → POST /register {name}
//   2a) status: 'created'  → új mentés, tokent eltároljuk, belép
//   2b) status: 'exists'   → "Hello, ez a te korábbi mentésed?" prompt summary-vel
//        → Igen: POST /register {name, claim:true} → token, hydrate, belép
//        → Nem:  visszamegy a név-mezőhöz egy hint-tel ("válassz másikat")
//
// Hibatűrés: ha a szerver nem érhető el, csak localStorage-ben halad tovább —
// nem akasztjuk meg a játékot. (Sync később, online eseménynél automatán retry.)

export default function UserGate() {
  // Régi eszközökön (2026-05-08 redesign előttről) már lehet localStorage-ben
  // userName, de még nincs auth token. Pre-fill-eljük, hogy egy gombnyomással
  // átmenjen a register flow-n.
  const [name, setName] = useState(() => getState().userName || '');
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState('input');  // 'input' | 'confirm'
  const [summary, setSummary] = useState(null);
  const [hint, setHint] = useState(null);

  // Ref-alapú "egyszer-fut" guard. A submitting state-flag race condition-ra
  // nem tökéletes (két gyors klikk mindkettő látja false-nak); a ref szinkron
  // ír/olvas, így biztosan blokkolja. Plusz: ha valamiért a komponens nem
  // unmountolódik a sikeres regisztráció után, ez megakadályozza a duplázott
  // /register hívást.
  const inFlightRef = useRef(false);
  const completedRef = useRef(false);

  const trimmed = name.trim();
  const valid = trimmed.length >= 2 && trimmed.length <= 40;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!valid || inFlightRef.current || completedRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    setHint(null);
    try {
      const res = await registerUser(trimmed, false);
      if (!res.ok) {
        // Szerver nincs / nem elérhető → offline indulás.
        // saveAuth is szükséges: readAuth()?.token nélkül az App.jsx needsUserName
        // örökre true marad és a gate nem tűnik el.
        completedRef.current = true;
        saveAuth({ token: `offline-${Date.now()}`, userId: `local-${trimmed}`, displayName: trimmed });
        setUserName(trimmed);
        return;
      }
      if (res.status === 'created') {
        saveAuth({ token: res.token, userId: res.userId, displayName: res.displayName });
        completedRef.current = true;
        setUserName(res.displayName);
        return;
      }
      if (res.status === 'exists') {
        setSummary(res.summary);
        setPhase('confirm');
        return;
      }
      // Ismeretlen válasz — biztos ami biztos, lokálisan tovább.
      completedRef.current = true;
      setUserName(trimmed);
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  async function handleClaim() {
    if (inFlightRef.current || completedRef.current) return;
    inFlightRef.current = true;
    setSubmitting(true);
    try {
      const res = await registerUser(trimmed, true);
      if (!res.ok || res.status !== 'claimed') {
        setHint('Sajnos nem sikerült visszaállítani — próbáld újra később.');
        setPhase('input');
        return;
      }
      // Sorrend kritikus:
      //   1) saveAuth — token a localStorage-be, a sync onnan olvassa
      //   2) completedRef — még BEFORE a state-frissítések, hogy ha a komponens
      //      még él az emit utáni re-render alatt, ne fusson újabb claim
      //   3) hydrateFromServer — szerver-állapot rátöltése a lokálisra
      //   4) setUserName — App.jsx-ben a needsUserName false lesz, a gate eltűnik
      saveAuth({ token: res.token, userId: res.userId, displayName: res.displayName });
      completedRef.current = true;
      await hydrateFromServer({ overwrite: true });
      setUserName(res.displayName);
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }

  function handleDifferentName() {
    setPhase('input');
    setSummary(null);
    setHint('Az a név foglalt. Adj meg egy másikat (pl. becenév + kezdőbetű).');
    setName('');
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Üdvözlő — add meg a neved"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{
        background: 'radial-gradient(ellipse at top, var(--cream) 0%, var(--cream2) 50%, var(--page) 100%)',
      }}
    >
      <motion.div
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md bg-base-50 rounded-sm px-7 pt-6 pb-7"
        style={{
          boxShadow: `0 0 0 1px #c9a961, 0 0 0 5px #faf3e7, 0 0 0 6px #9b7e3a, 0 24px 70px -16px rgba(0,0,0,0.45)`,
        }}
      >
        <CornerOrnaments size={26} color="#9b7e3a" />

        <div className="relative text-center" style={{ zIndex: 10 }}>
          <div className="flex justify-center mb-2">
            <FlowerMotif size={28} color="#9b7e3a" />
          </div>

          <AnimatePresence mode="wait">
            {phase === 'input' ? (
              <InputPhase
                key="input"
                name={name}
                setName={setName}
                onSubmit={handleSubmit}
                valid={valid}
                submitting={submitting}
                hint={hint}
              />
            ) : (
              <ConfirmPhase
                key="confirm"
                displayName={trimmed}
                summary={summary}
                onClaim={handleClaim}
                onDifferent={handleDifferentName}
                submitting={submitting}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InputPhase({ name, setName, onSubmit, valid, submitting, hint }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="tome-script text-2xl text-accent-700 leading-tight">Üdvözöllek:</div>
      <h2 className="tome-title text-3xl mt-1">{BRAND}</h2>
      <OrnamentDivider color="#9b7e3a" />
      <p className="text-sm text-ink-600 italic px-1 leading-snug"
         style={{ fontFamily: 'var(--font-body)' }}>
        Mielőtt belépnél, áruld el a neved —<br />
        innen indul a saját mentésed.
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3">
        <input
          type="text"
          autoFocus
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="A neved"
          aria-label="A neved"
          className="w-full px-4 py-3 text-center text-lg bg-base-100 border-2 border-accent-300 focus:border-accent-500 focus:outline-none rounded-sm text-ink-800"
          style={{ fontFamily: 'var(--font-body)', letterSpacing: '0.03em' }}
        />
        <button type="submit" disabled={!valid || submitting} className="btn-primary w-full">
          {submitting ? 'Egy pillanat…' : 'Belépés'}
        </button>
      </form>

      {hint && (
        <p role="alert" className="text-xs text-rose-700 mt-3 leading-snug">{hint}</p>
      )}

      <p className="text-[11px] text-ink-500 mt-4 leading-snug"
         style={{ fontFamily: 'system-ui, sans-serif' }}>
        Ha másik eszközön már játszottál ugyanezzel a névvel, a következő lépésben
        rákérdezünk, hogy folytatni szeretnéd-e azt a mentést.
      </p>
    </motion.div>
  );
}

function ConfirmPhase({ displayName, summary, onClaim, onDifferent, submitting }) {
  const last = summary?.lastSync ? new Date(summary.lastSync) : null;
  const lastStr = last
    ? `${last.toLocaleDateString('hu-HU')} ${last.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`
    : 'még sosem';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
    >
      <div className="tome-script text-xl text-accent-700">Ismerős név…</div>
      <h2 className="tome-title text-2xl mt-1">Hello, {displayName}!</h2>
      <OrnamentDivider color="#9b7e3a" />
      <p className="text-sm text-ink-700 leading-snug px-2"
         style={{ fontFamily: 'var(--font-body)' }}>
        Találtam egy korábbi mentést ezen a néven. <br />A tiéd?
      </p>

      <div className="mt-3 mb-4 grid grid-cols-3 gap-2 text-center">
        <Stat label={CARDS_LABEL} value={summary?.unlockedCount ?? 0} />
        <Stat label="Mester" value={summary?.questionsMastered ?? 0} />
        <Stat label="Utolsó" value={lastStr} small />
      </div>

      <div className="space-y-2">
        <button onClick={onClaim} disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Visszaállítás…' : 'Igen, ez az enyém — folytatom'}
        </button>
        <button onClick={onDifferent} disabled={submitting} className="btn-secondary w-full">
          Nem én vagyok — másik nevet adok
        </button>
      </div>

      <p className="text-[11px] text-ink-500 mt-4 leading-snug"
         style={{ fontFamily: 'system-ui, sans-serif' }}>
        Ha igent választasz, ez az eszköz is szinkronba kerül a korábbi haladással.
      </p>
    </motion.div>
  );
}

function Stat({ label, value, small }) {
  return (
    <div className="rounded-sm bg-[#faf3e7] border border-accent-300 px-2 py-2">
      <div className={small ? 'text-[11px] font-semibold text-ink-800 leading-tight' : 'text-base font-semibold text-ink-800'}>
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-ink-500 mt-1">{label}</div>
    </div>
  );
}
