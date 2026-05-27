import { useEffect, useRef, useState } from "react";

interface DamageOverlayProps {
  health: number;
  maxHealth: number;
}

export function DamageOverlay({ health, maxHealth }: DamageOverlayProps) {
  const [flashId, setFlashId] = useState(0);
  const prevHealth = useRef(health);

  useEffect(() => {
    if (health < prevHealth.current) {
      setFlashId((n) => n + 1);
    }
    prevHealth.current = health;
  }, [health]);

  const ratio = maxHealth > 0 ? health / maxHealth : 0;
  const critical = health > 0 && ratio <= 0.34;

  return (
    <>
      <style>{`
        @keyframes mazeDamageFlash {
          0%   { opacity: 1; }
          25%  { opacity: 0.85; }
          100% { opacity: 0; }
        }
        @keyframes mazeLowHealthPulse {
          0%, 100% { opacity: 0.32; }
          50%      { opacity: 0.68; }
        }
      `}</style>

      {critical && (
        <div
          data-testid="overlay-low-health"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 60,
            background:
              "radial-gradient(ellipse at center, rgba(255,30,60,0) 35%, rgba(255,30,60,0.55) 95%)",
            animation: "mazeLowHealthPulse 1.4s ease-in-out infinite",
          }}
        />
      )}

      {flashId > 0 && (
        <div
          key={flashId}
          data-testid="overlay-damage-flash"
          style={{
            position: "fixed",
            inset: 0,
            pointerEvents: "none",
            zIndex: 61,
            background:
              "radial-gradient(ellipse at center, rgba(255,20,50,0) 20%, rgba(255,20,50,0.95) 95%)",
            animation: "mazeDamageFlash 0.45s ease-out forwards",
          }}
        />
      )}
    </>
  );
}
