import { clsx } from "clsx";

export function BraidedDivider({ color = "#c9a961" }) {
  return (
    <div className="w-full h-2 my-4 opacity-60" style={{
      backgroundImage: `repeating-linear-gradient(45deg, ${color} 0, ${color} 2px, transparent 2px, transparent 4px)`
    }} />
  );
}

// Megvilágított iniciálé-medál: óriás betű accent-gradiensből, azúr halóval és
// Mucha-féle dupla aranygyűrűvel — illuminált kódex-kezdőbetű érzés (A/B csoport).
export function InitialMedallion({ letter, size = 80, dim = false }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden>
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: 'radial-gradient(circle at 50% 38%, rgb(var(--c-secondary-200) / 0.6), transparent 70%)' }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow:
            '0 0 0 1.5px rgb(var(--c-accent-500)), inset 0 0 0 4px rgb(var(--c-base-50)), inset 0 0 0 5px rgb(var(--c-accent-400) / 0.7)',
          background: 'radial-gradient(circle at 50% 30%, rgb(var(--c-base-50) / 0.7), rgb(var(--c-base-100) / 0.5))',
        }}
      />
      <div className="absolute inset-0 grid place-items-center">
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: size * 0.46,
            fontWeight: 700,
            lineHeight: 1,
            background: dim
              ? 'linear-gradient(160deg, rgb(var(--c-ink-400)), rgb(var(--c-ink-500)))'
              : 'linear-gradient(160deg, rgb(var(--c-accent-300)) 0%, rgb(var(--c-accent-500)) 55%, rgb(var(--c-accent-700)) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.5))',
          }}
        >
          {letter}
        </span>
      </div>
    </div>
  );
}

// Mucha-szerű dekoratív SVG-k. Mind aranyban, finoman.
// Használat:
//   <CornerOrnaments />          — kártya 4 sarkába (absolute pozícióval)
//   <OrnamentDivider />           — szakasz-elválasztó középen virággal
//   <OvalFrame>{children}</OvalFrame> — ovális keret kép köré (Mucha medál)

const GOLD = '#9b7e3a';
const GOLD_LIGHT = '#c9a961';

// 4 sarokba helyezhető szecessziós motívum, az anyaelem `relative`-ja kell.
export function CornerOrnaments({ size = 26, color = GOLD }) {
  return (
    <>
      <Corner pos="top-1.5 left-1.5"          size={size} color={color} />
      <Corner pos="top-1.5 right-1.5"         size={size} color={color} rotate="rotate-90" />
      <Corner pos="bottom-1.5 right-1.5"      size={size} color={color} rotate="rotate-180" />
      <Corner pos="bottom-1.5 left-1.5"       size={size} color={color} rotate="-rotate-90" />
    </>
  );
}

function Corner({ pos, size, color, rotate = '' }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={`absolute ${pos} ${rotate} pointer-events-none`}
      fill="none"
      stroke={color}
      strokeWidth="1.1"
    >
      {/* fő ív */}
      <path d="M 2 14 Q 2 2 14 2" strokeLinecap="round" />
      {/* belső ív */}
      <path d="M 5 14 Q 5 5 14 5" strokeLinecap="round" opacity="0.7" />
      {/* három apró pötty */}
      <circle cx="3.5" cy="20" r="1" fill={color} />
      <circle cx="20" cy="3.5" r="1" fill={color} />
      <circle cx="9" cy="9" r="1.2" fill={color} />
      {/* vékony levél-szár */}
      <path d="M 12 12 Q 18 10 20 4" strokeWidth="0.7" opacity="0.55" />
    </svg>
  );
}

// Vízszintes szecessziós elválasztó: két oldalt dupla vonal, közepén
// stilizált virág / négyszirom.
export function OrnamentDivider({ color = GOLD }) {
  return (
    <div className="flex items-center justify-center gap-3 my-3" aria-hidden>
      <DividerSide color={color} />
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke={color} strokeWidth="1.2">
        {/* négy szirom */}
        <ellipse cx="12" cy="6"  rx="2" ry="4" />
        <ellipse cx="18" cy="12" rx="4" ry="2" />
        <ellipse cx="12" cy="18" rx="2" ry="4" />
        <ellipse cx="6"  cy="12" rx="4" ry="2" />
        <circle cx="12" cy="12" r="1.6" fill={color} stroke="none" />
      </svg>
      <DividerSide color={color} />
    </div>
  );
}

function DividerSide({ color }) {
  return (
    <svg viewBox="0 0 80 12" width="80" height="12" preserveAspectRatio="none">
      <line x1="0"  y1="5" x2="80" y2="5" stroke={color} strokeWidth="0.7" opacity="0.6" />
      <line x1="0"  y1="8" x2="80" y2="8" stroke={color} strokeWidth="1.2" />
      <circle cx="76" cy="6.5" r="1.4" fill={color} />
    </svg>
  );
}

// Ovális Mucha-medál keret — card-képek köré
export function OvalFrame({ children, color = GOLD, accent = GOLD_LIGHT, size = 220 }) {
  return (
    <div className="relative inline-block" style={{ width: size, height: size * 1.18 }}>
      <svg
        viewBox="0 0 220 260"
        className="absolute inset-0 w-full h-full pointer-events-none"
        fill="none"
      >
        {/* külső ovális */}
        <ellipse cx="110" cy="130" rx="100" ry="120" stroke={color} strokeWidth="1.5" />
        {/* belső ovális */}
        <ellipse cx="110" cy="130" rx="93" ry="113" stroke={accent} strokeWidth="0.8" />
        {/* tetején apró ornament */}
        <g transform="translate(110, 8)">
          <circle r="3" fill={color} />
          <line x1="-12" y1="0" x2="-4" y2="0" stroke={color} strokeWidth="0.8" />
          <line x1="4"   y1="0" x2="12" y2="0" stroke={color} strokeWidth="0.8" />
        </g>
        {/* alján apró ornament */}
        <g transform="translate(110, 252)">
          <circle r="3" fill={color} />
          <line x1="-12" y1="0" x2="-4" y2="0" stroke={color} strokeWidth="0.8" />
          <line x1="4"   y1="0" x2="12" y2="0" stroke={color} strokeWidth="0.8" />
        </g>
        {/* két oldalt apró pöttyök */}
        <circle cx="6"   cy="130" r="2.5" fill={color} />
        <circle cx="214" cy="130" r="2.5" fill={color} />
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center overflow-hidden"
        style={{
          clipPath: `ellipse(${(size - 25) / 2}px ${((size * 1.18) - 30) / 2}px at 50% 50%)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Apró L-alakú sarok-ornament — MiniCardhoz, ahol a CornerOrnaments túl gazdag.
// `color` a stroke; `inset` az eltartás (px) a parent szélétől.
export function MiniCardCorners({ color = GOLD, inset = 4, size = 12, bottomInset = 36 }) {
  const baseStyle = { width: size, height: size, borderColor: color, position: 'absolute' };
  return (
    <>
      <div style={{ ...baseStyle, top: inset, left: inset, borderTop: '1px solid', borderLeft: '1px solid', borderTopLeftRadius: 4 }} />
      <div style={{ ...baseStyle, top: inset, right: inset, borderTop: '1px solid', borderRight: '1px solid', borderTopRightRadius: 4 }} />
      <div style={{ ...baseStyle, bottom: bottomInset, left: inset, borderBottom: '1px solid', borderLeft: '1px solid', borderBottomLeftRadius: 4 }} />
      <div style={{ ...baseStyle, bottom: bottomInset, right: inset, borderBottom: '1px solid', borderRight: '1px solid', borderBottomRightRadius: 4 }} />
    </>
  );
}

// Kis virág-motívum a heading mellé
export function FlowerMotif({ size = 16, color = GOLD }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color} aria-hidden>
      <circle cx="12" cy="6" r="2.2" />
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <circle cx="18" cy="12" r="2.2" />
      <circle cx="12" cy="12" r="2" fill="#7a5e22" />
    </svg>
  );
}

// ── Erősebb Mucha-stílusú motívumok azúr-arany kombinációval ───────────────

// Mucha-féle iris (íriszvirág) — a szecesszió kedvenc motívuma. Kék-arany.
export function IrisMotif({ size = 36, primary = '#0369a1', accent = GOLD }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden>
      {/* szár */}
      <path d="M 24 46 L 24 28" stroke={accent} strokeWidth="1.2" fill="none" />
      {/* két levél a száron */}
      <path d="M 24 38 Q 18 36 16 30" stroke={accent} strokeWidth="0.9" fill="none" />
      <path d="M 24 38 Q 30 36 32 30" stroke={accent} strokeWidth="0.9" fill="none" />
      {/* három felső szirom (íriszre jellemző) */}
      <path d="M 24 22 Q 16 18 14 8 Q 18 6 24 12 Q 30 6 34 8 Q 32 18 24 22 Z"
            fill={primary} fillOpacity="0.18" stroke={primary} strokeWidth="1.1" />
      {/* középső szirom */}
      <path d="M 24 24 Q 22 20 24 14 Q 26 20 24 24 Z"
            fill={accent} fillOpacity="0.45" stroke={accent} strokeWidth="0.7" />
      {/* alsó három szirom (lehulló) */}
      <path d="M 24 24 Q 18 28 14 32 Q 16 26 24 22"
            fill={primary} fillOpacity="0.15" stroke={primary} strokeWidth="0.9" />
      <path d="M 24 24 Q 30 28 34 32 Q 32 26 24 22"
            fill={primary} fillOpacity="0.15" stroke={primary} strokeWidth="0.9" />
      {/* középső pötty */}
      <circle cx="24" cy="18" r="1.6" fill={accent} />
    </svg>
  );
}

// Boltíves Mucha-header: arch keret + iris a tetején — minden képernyőn ez nyit.
// `title` lehet string VAGY string[] (több sor — hosszú címeknél két sorba törve).
// `subtitle` opcionális script-stílusú felirat a fő-cím fölött.
export function ArchHeader({ title, subtitle, accent = GOLD, primary = '#0369a1' }) {
  const lines = Array.isArray(title) ? title : [title];
  // Hosszú szövegnél kisebb font, hogy ne csússzon ki az arch alól
  const totalChars = lines.reduce((n, l) => n + (l?.length || 0), 0);
  const titleSize = totalChars > 18
    ? 'text-xl sm:text-2xl'
    : 'text-2xl sm:text-3xl';
  // Több soros cím → magasabb belső padding, hogy az arch ne metssze
  const padTop = lines.length > 1 ? 'pt-12' : 'pt-10';

  return (
    <div className="relative pt-2 pb-1 mb-1">
      <svg viewBox="0 0 320 110" preserveAspectRatio="none"
           className="absolute inset-x-0 top-0 w-full pointer-events-none"
           style={{ height: lines.length > 1 ? 130 : 100 }}
           aria-hidden>
        {/* boltív */}
        <path d="M 12 108 Q 12 12 160 12 Q 308 12 308 108"
              stroke={accent} strokeWidth="1.1" fill="none" />
        <path d="M 22 108 Q 22 22 160 22 Q 298 22 298 108"
              stroke={accent} strokeWidth="0.6" fill="none" opacity="0.55" />
        {/* két oldali kis kör */}
        <circle cx="22" cy="108" r="2.5" fill={accent} />
        <circle cx="298" cy="108" r="2.5" fill={accent} />
        {/* alsó horizontális vonal */}
        <line x1="40" y1="108" x2="280" y2="108" stroke={accent} strokeWidth="0.5" opacity="0.6" />
        {/* két azúr-pötty (Mucha-féle "drágakő"-jelzés) */}
        <circle cx="50"  cy="108" r="1.6" fill={primary} />
        <circle cx="270" cy="108" r="1.6" fill={primary} />
      </svg>
      <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-10">
        <IrisMotif size={32} primary={primary} accent={accent} />
      </div>
      <div className={`text-center ${padTop}`}>
        {subtitle && (
          <div className="tome-script text-2xl leading-none" style={{ color: primary }}>
            {subtitle}
          </div>
        )}
        {lines.map((line, i) => (
          i === 0
            ? <h1 key={i} className={`tome-title ${titleSize} leading-tight`}>{line}</h1>
            : <div key={i} className={`tome-title ${titleSize} leading-tight`}>{line}</div>
        ))}
      </div>
    </div>
  );
}

// Függőleges szecessziós dekor-csík — hosszú kártyák mellé (pl. lecke-listák)
export function VerticalFiligree({ side = 'left', height = 100, color = GOLD, accent = '#0369a1' }) {
  return (
    <svg
      viewBox="0 0 24 200"
      width="20"
      height={height}
      preserveAspectRatio="none"
      className={`absolute ${side === 'left' ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 pointer-events-none`}
      aria-hidden
    >
      {/* fő-vonal */}
      <line x1="12" y1="0" x2="12" y2="200" stroke={color} strokeWidth="0.6" opacity="0.4" />
      {/* három virág-csomó: tetején, közepén, alján */}
      {[20, 100, 180].map((y, i) => (
        <g key={i} transform={`translate(12, ${y})`}>
          <circle r="2.5" fill={color} />
          <circle r="1.2" fill={accent} />
          <path d={`M -6 0 Q -8 -3 -3 -2 M 6 0 Q 8 -3 3 -2 M -6 0 Q -8 3 -3 2 M 6 0 Q 8 3 3 2`}
                stroke={color} strokeWidth="0.7" fill="none" />
        </g>
      ))}
    </svg>
  );
}
