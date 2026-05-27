import { useEffect, useRef } from "react";

interface TouchLookProps {
  /** 拖曳時呼叫，yawDelta / pitchDelta 已乘 sensitivity */
  onDelta: (yawDelta: number, pitchDelta: number) => void;
  /** 鎖左半畫面給搖桿，視角控制只在右半起作用 */
  leftReservedPx?: number;
}

const SENSITIVITY = 0.005;

export function TouchLook({ onDelta, leftReservedPx = 200 }: TouchLookProps) {
  const lastTouch = useRef<{ id: number; x: number; y: number } | null>(null);

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (lastTouch.current) return; // 已有手指在追蹤
      // 只接受畫面右側 / 不在搖桿區域的觸控
      const t = Array.from(e.changedTouches).find(
        (t) => t.clientX > leftReservedPx,
      );
      if (!t) return;
      // 不要在 button / input 上開始
      const target = e.target as Element | null;
      if (target && target.closest("button, input, a, [data-no-touchlook]"))
        return;
      lastTouch.current = { id: t.identifier, x: t.clientX, y: t.clientY };
    };

    const onMove = (e: TouchEvent) => {
      const cur = lastTouch.current;
      if (!cur) return;
      const t = Array.from(e.changedTouches).find(
        (t) => t.identifier === cur.id,
      );
      if (!t) return;
      const dx = t.clientX - cur.x;
      const dy = t.clientY - cur.y;
      lastTouch.current = { id: cur.id, x: t.clientX, y: t.clientY };
      onDelta(-dx * SENSITIVITY, -dy * SENSITIVITY);
      e.preventDefault();
    };

    const onEnd = (e: TouchEvent) => {
      const cur = lastTouch.current;
      if (!cur) return;
      const ended = Array.from(e.changedTouches).find(
        (t) => t.identifier === cur.id,
      );
      if (ended) lastTouch.current = null;
    };

    window.addEventListener("touchstart", onStart, { passive: false });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd, { passive: false });
    window.addEventListener("touchcancel", onEnd, { passive: false });

    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [onDelta, leftReservedPx]);

  // 此元件不渲染 DOM；視角控制是全域 touch events
  return null;
}
