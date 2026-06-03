// Stilizált ló-silhouette — a MiniCard "panini empty pocket" érzése locked
// vagy hiányzó kép esetén. SVG inline, opacity és szín props-ból.
export default function CardPlaceholder({ color = '#9b7e3a', opacity = 0.28, className = '' }) {
  return (
    <svg
      viewBox="0 0 80 80"
      width="100%"
      height="100%"
      className={className}
      aria-hidden="true"
      style={{ opacity }}
    >
      <path
        d="M 18 60 L 18 44 Q 18 36 24 32 L 30 28 Q 28 22 32 18 Q 36 14 42 16 L 46 14 Q 50 12 54 16 L 58 22 Q 60 28 56 32 L 52 34 L 50 38 Q 56 38 60 42 L 62 50 L 62 60 L 58 60 L 58 50 L 50 50 L 50 60 L 46 60 L 46 50 L 32 50 L 32 60 L 28 60 L 28 50 L 22 50 L 22 60 Z"
        fill={color}
        stroke={color}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
