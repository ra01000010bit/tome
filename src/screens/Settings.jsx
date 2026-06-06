import { useEffect, useRef, useState } from 'react';
import { useStore, updateSetting, resetAll, getState, importState } from '../engine/store.js';
import { applyColorMode } from '../engine/applyTheme.js';
import { isSyncEnabled, pullFromServer } from '../engine/sync.js';
import { Cloud, CloudOff, RefreshCw, Download, Upload, Sun, Moon, Clock } from 'lucide-react';
import { ArchHeader } from '../components/Ornament.jsx';
import { themeConfig } from '../theme.js';
import clsx from 'clsx';

export default function Settings() {
  const settings = useStore((s) => s.settings);
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div
        className="text-xs flex items-center gap-2 px-3 py-2 rounded-sm"
        style={{
          background: online ? 'rgba(168,201,154,0.15)' : 'rgba(217,152,135,0.15)',
          border: `1px solid ${online ? '#7a9e7e' : '#c47866'}`,
          color: online ? '#446248' : '#7a4f44',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span style={{
          display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
          background: online ? '#7a9e7e' : '#c47866',
        }} />
        {online ? 'Online — szinkron él' : 'Offline — szinkron újra hálózatkor'}
      </div>

      <ArchHeader title="Beállítások" />

      <div className="card">
        <h3 className="text-2xl mb-2">Megjelenés</h3>
        <div className="grid grid-cols-3 gap-2">
          {[
            { val: 'auto',  Icon: Clock, label: 'Auto' },
            { val: 'light', Icon: Sun,   label: 'Világos' },
            { val: 'dark',  Icon: Moon,  label: 'Sötét' },
          ].map(({ val, Icon, label }) => {
            const active = (settings.theme ?? 'auto') === val;
            return (
              <button
                key={val}
                onClick={() => { updateSetting('theme', val); applyColorMode(val); }}
                aria-pressed={active}
                className={clsx(
                  'min-h-[44px] rounded-xl border-2 flex flex-col items-center justify-center gap-1 py-2 text-xs font-bold transition-colors',
                  active
                    ? 'border-accent-500 bg-accent-200/40 text-accent-700'
                    : 'border-base-300 text-ink-400 hover:text-ink-600'
                )}
              >
                <Icon size={18} /> {label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-ink-500 mt-2">Auto: Budapesten 19–7 óra között Doré sötét, egyébként világos.</p>
      </div>

      <div className="card space-y-4">
        <Row
          label="Magabiztosság-mód"
          hint="A multiple-choice válasz után még megkérdezzük: biztos voltál? Pontosabb ütemezés."
        >
          <label className="inline-flex items-center justify-center w-11 h-11 -m-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(settings.confidenceMode)}
              onChange={(e) => updateSetting('confidenceMode', e.target.checked)}
              aria-label="Magabiztosság-mód"
              className="w-6 h-6 accent-primary-600"
            />
          </label>
        </Row>
      </div>

      <QuestionTypeCard settings={settings} />

      <SyncStatus />

      <BackupCard />

      <div className="card border-rose-200 bg-rose-50/40">
        <h3 className="text-2xl text-rose-700">Veszélyzóna</h3>
        <p className="text-sm text-ink-600 mb-3">
          Minden haladás, feloldott kártya és kérdésállapot törlődik.
        </p>
        {!confirmReset ? (
          <button
            onClick={() => setConfirmReset(true)}
            className="btn bg-rose-600 text-white hover:bg-rose-700"
          >
            Minden adat törlése
          </button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-rose-700">Valóban törlöd az összes haladást? Ez nem visszavonható.</p>
            <div className="flex gap-2">
              <button
                onClick={() => { resetAll(); setConfirmReset(false); }}
                className="btn bg-rose-600 text-white hover:bg-rose-700 flex-1"
              >
                Igen, törlöm
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="btn-secondary flex-1"
              >
                Mégse
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-ink-500 pt-4">
        {themeConfig?.brand?.full || 'Tome'} · v1.0
      </p>
    </div>
  );
}

function SyncStatus() {
  const enabled = isSyncEnabled();
  const [status, setStatus] = useState(enabled ? 'checking' : 'off');

  async function check() {
    if (!enabled) return;
    setStatus('checking');
    const r = await pullFromServer();
    setStatus(r?.ok ? 'ok' : 'error');
  }

  useEffect(() => { check(); /* eslint-disable-line */ }, []);

  if (!enabled) {
    return (
      <div className="card flex items-center gap-3 text-sm text-ink-500">
        <CloudOff size={20} className="shrink-0" />
        <div className="flex-1">
          <div className="font-semibold text-ink-700">Sync kikapcsolva</div>
          <div className="text-xs">A haladás csak ezen az eszközön él (localStorage).</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex items-center gap-3 text-sm">
      <Cloud size={20} className={clsx(
        'shrink-0',
        status === 'ok'       && 'text-emerald-600',
        status === 'error'    && 'text-rose-600',
        status === 'checking' && 'text-ink-500 animate-pulse',
      )} />
      <div className="flex-1">
        <div className="font-semibold text-ink-700">
          {status === 'ok'       && 'Sync aktív'}
          {status === 'error'    && 'Szerver nem elérhető'}
          {status === 'checking' && 'Ellenőrzés…'}
        </div>
        <div className="text-xs text-ink-500">
          A haladás minden eszközön ugyanaz lesz.
        </div>
      </div>
      <button onClick={check} className="btn-ghost p-2">
        <RefreshCw size={16} />
      </button>
    </div>
  );
}

function BackupCard() {
  const fileRef = useRef(null);
  const [msg, setMsg] = useState(null);

  function download() {
    const data = JSON.stringify(getState(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `tome-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMsg({ kind: 'ok', text: 'Mentés letöltve.' });
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!confirm('Felülírja a jelenlegi haladást a fájlból?')) return;
      importState(parsed);  // throws Error with Hungarian reason if shape invalid
      setMsg({ kind: 'ok', text: 'Mentés visszaállítva.' });
    } catch (err) {
      setMsg({ kind: 'err', text: `Érvénytelen mentésfájl: ${err.message || 'olvashatatlan JSON'}` });
    }
  }

  return (
    <div className="card">
      <h3 className="text-2xl mb-1">Mentés</h3>
      <p className="text-sm text-ink-500 mb-3">
        Töltsd le a haladást fájlba, vagy állítsd vissza egy korábbi mentésből. Vizsga előtt érdemes.
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={download} className="btn-secondary min-h-[44px] px-4 text-sm">
          <Download size={16} /> Mentés letöltése
        </button>
        <button onClick={() => fileRef.current?.click()} className="btn-secondary min-h-[44px] px-4 text-sm">
          <Upload size={16} /> Mentés visszaállítása
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          onChange={handleFile}
          className="hidden"
        />
      </div>
      {msg && (
        <div className={clsx(
          'text-xs mt-3',
          msg.kind === 'ok' ? 'text-emerald-700' : 'text-rose-700',
        )}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

const QUESTION_TYPES = [
  { id: 'flashcard',       label: 'Flashcards',            hint: 'Fogalom elöl, definíció hátul — saját értékelés' },
  { id: 'multiple_choice', label: 'Feleletválasztós',      hint: '4 lehetőség közül a helyes — rákattintással' },
  { id: 'true_false',      label: 'Igaz / Hamis',          hint: 'Egy állítás igazságtartalmának megítélése' },
  { id: 'cloze',           label: 'Kitöltős mondatok',     hint: 'Hiányos szöveg — begépelt szóval kell kitölteni' },
];

function QuestionTypeCard({ settings }) {
  const disabled = settings.disabledTypes ?? [];

  function toggle(typeId) {
    const next = disabled.includes(typeId)
      ? disabled.filter((t) => t !== typeId)
      : [...disabled, typeId];
    // Ha az összes el lenne tiltva, az utolsót nem engedjük tiltani
    if (next.length >= QUESTION_TYPES.length) return;
    updateSetting('disabledTypes', next);
  }

  return (
    <div className="card space-y-3">
      <div>
        <h3 className="text-2xl mb-0.5">Feladattípusok</h3>
        <p className="text-xs text-ink-500">
          A kikapcsolt típusok a tétel-módválasztóban nem játszhatók. A Flashcards ettől
          függetlenül elérhető. Legalább egy típus maradjon bekapcsolva.
        </p>
      </div>
      {QUESTION_TYPES.map(({ id, label, hint }) => {
        const isOn = !disabled.includes(id);
        return (
          <Row key={id} label={label} hint={hint}>
            <button
              onClick={() => toggle(id)}
              aria-pressed={isOn}
              aria-label={label}
              className={clsx(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                isOn ? 'bg-primary-600' : 'bg-ink-300',
              )}
            >
              <span
                className={clsx(
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
                  isOn ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </Row>
        );
      })}
    </div>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-ink-700 font-medium">{label}</div>
        {hint && <div className="text-xs text-ink-500 mt-0.5">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
