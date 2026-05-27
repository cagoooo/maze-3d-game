import { useRef, useEffect, useState } from "react";

interface JoystickProps {
  /** 拖曳時觸發。dx / dz 為 [-1, 1]，鬆開時都是 0 */
  onChange: (dx: number, dz: number) => void;
  size?: number;
}

export function Joystick({ onChange, size = 140 }: JoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ x: number; y: number } | null>(null);
  const activeTouchId = useRef<number | null>(null);

  useEffect(() => {
    const base = baseRef.current;
    if (!base) return;

    const radius = size / 2;

    const updateThumb = (cx: number, cy: number) => {
      const rect = base.getBoundingClientRect();
      const dx = cx - (rect.left + rect.width / 2);
      const dy = cy - (rect.top + rect.height / 2);
      const len = Math.sqrt(dx * dx + dy * dy);
      const capped = Math.min(len, radius);
      const nx = len > 0 ? (dx / len) * capped : 0;
      const ny = len > 0 ? (dy / len) * capped : 0;
      setThumb({ x: nx, y: ny });
      onChange(nx / radius, ny / radius);
    };

    const handleStart = (e: TouchEvent) => {
      if (activeTouchId.current !== null) return;
      const t = e.changedTouches[0];
      activeTouchId.current = t.identifier;
      updateThumb(t.clientX, t.clientY);
      e.preventDefault();
    };

    const handleMove = (e: TouchEvent) => {
      const t = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeTouchId.current,
      );
      if (!t) return;
      updateThumb(t.clientX, t.clientY);
      e.preventDefault();
    };

    const handleEnd = (e: TouchEvent) => {
      const t = Array.from(e.changedTouches).find(
        (t) => t.identifier === activeTouchId.current,
      );
      if (!t) return;
      activeTouchId.current = null;
      setThumb(null);
      onChange(0, 0);
      e.preventDefault();
    };

    base.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd, { passive: false });
    window.addEventListener("touchcancel", handleEnd, { passive: false });

    return () => {
      base.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
    };
  }, [onChange, size]);

  return (
    <div
      ref={baseRef}
      data-testid="joystick"
      style={{
        position: "fixed",
        left: "20px",
        bottom: "20px",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at center, rgba(0,229,255,0.18) 0%, rgba(0,0,0,0.4) 70%)",
        border: "2px solid rgba(0,229,255,0.45)",
        boxShadow: "0 0 18px rgba(0,229,255,0.18) inset",
        backdropFilter: "blur(4px)",
        zIndex: 60,
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: `${size * 0.42}px`,
          height: `${size * 0.42}px`,
          borderRadius: "50%",
          background:
            "radial-gradient(circle at 35% 30%, rgba(0,229,255,0.95), rgba(0,150,200,0.7))",
          border: "1px solid rgba(0,229,255,0.9)",
          boxShadow: "0 0 12px rgba(0,229,255,0.6)",
          transform: `translate(calc(-50% + ${thumb?.x ?? 0}px), calc(-50% + ${thumb?.y ?? 0}px))`,
          transition: thumb ? "none" : "transform 0.18s ease-out",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
