import { NavLink } from 'react-router-dom';
import { BookOpen, TreePine, Settings as SettingsIcon, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../engine/store.js';
import { COPY } from '../theme.js';

const items = [
  { to: '/',            label: COPY.nav.home,     icon: BookOpen },
  { to: '/collection',      label: COPY.nav.collection,   icon: TreePine },
  { to: '/weak-points', label: 'Hibák',           icon: AlertTriangle, badgeKey: 'weak' },
  { to: '/settings',    label: COPY.nav.settings, icon: SettingsIcon },
];

export default function BottomNav() {
  const questionStates = useStore((s) => s.questionStates);
  // A "gyenge pont" jelvény annyi, ahány aktív, lesújtott kérdés van
  // (lapses > 0 vagy box <= 2 a legutóbbi review után). Egy egyszerű
  // közelítés, hogy a user lássa van-e mit gyakorolnia.
  const weakCount = countWeak(questionStates);
  return (
    <nav
      className="fixed bottom-0 inset-x-0 border-t border-accent-300 safe-bottom z-50"
      style={{
        backgroundColor: 'var(--cream)',
        boxShadow: '0 -8px 24px -10px rgba(0,0,0,0.35), 0 -1px 0 rgba(255,255,255,0.15) inset',
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-4">
        {items.map(({ to, label, icon: Icon, badgeKey }) => {
          const showBadge = badgeKey === 'weak' && weakCount > 0;
          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center min-w-[64px] min-h-[56px] px-2 py-1 rounded-xl transition-all duration-300',
                isActive
                  ? 'text-secondary-700 bg-secondary-50/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.05)]'
                  : 'text-ink-400 hover:text-ink-600 hover:bg-base-100/50 active:scale-95'
              )}            >
              {({ isActive }) => (
                <>
                  <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110 mb-1' : 'scale-100 mb-0.5'}`}>
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                    {showBadge && (
                      <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {weakCount > 99 ? '99+' : weakCount}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-medium tracking-wide transition-all duration-300 ${isActive ? 'opacity-100 font-bold' : 'opacity-80'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// A WeakPoints.jsx-szel azonos kritérium: legalább 2 review, és vagy
// 60% alatti helyes arány, vagy az utolsó válasz után tanulásra esett
// vissza. Ne térjenek el — ha a badge mást mutat mint a képernyő, az
// zavaró.
function countWeak(qs) {
  if (!qs || typeof qs !== 'object') return 0;
  let n = 0;
  for (const item of Object.values(qs)) {
    if (!item || (item.reviewCount ?? 0) < 2) continue;
    const ratio = item.correctCount / item.reviewCount;
    if (ratio < 0.6 || item.state === 'learning') n++;
  }
  return n;
}
