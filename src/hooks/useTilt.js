import { useRef, useCallback } from 'react';

// Sima 3D dőlés a kurzor/ujj pozíciója után — semmi extra effekt.
// A visszaadott objektumot a kártya-elemre kell spreadelni: <div {...tilt} className="tome-tilt ...">
// (a `tome-tilt` class adja a sima transform-átmenetet). Respektálja a reduced-motion-t.
export function useTilt({ max = 12, perspective = 800 } = {}) {
  const ref = useRef(null);

  const apply = useCallback((clientX, clientY) => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const rotY = ((clientX - r.left) / r.width - 0.5) * 2 * max;
    const rotX = -((clientY - r.top) / r.height - 0.5) * 2 * max;
    el.style.transform = `perspective(${perspective}px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  }, [max, perspective]);

  const reset = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = '';
  }, []);

  return {
    ref,
    onMouseMove: (e) => apply(e.clientX, e.clientY),
    onMouseLeave: reset,
    onPointerLeave: reset,
    // Érintésre azonnal dőljön (ne csak húzásra) — a kollekcióban "rákattintásra".
    onTouchStart: (e) => { const t = e.touches?.[0]; if (t) apply(t.clientX, t.clientY); },
    onTouchMove: (e) => { const t = e.touches?.[0]; if (t) apply(t.clientX, t.clientY); },
    onTouchEnd: reset,
    onTouchCancel: reset,
  };
}
