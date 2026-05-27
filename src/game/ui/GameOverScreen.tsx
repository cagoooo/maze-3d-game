import { Footer } from "./Footer";

interface GameOverScreenProps {
  score: number;
  collected: number;
  onRestart: () => void;
  reason: "timeout" | "enemy" | null;
}

export function GameOverScreen({ score, collected, onRestart, reason }: GameOverScreenProps) {
  const isTimeout = reason === "timeout";
  const title = isTimeout ? "時間到" : "遊戲結束";
  const subtitle = isTimeout
    ? "時間到了，挑戰失敗！"
    : "你被敵人抓住了！";
  const accent = isTimeout ? "#ffaa00" : "#ff3366";
  const accentSoft = isTimeout ? "rgba(255,170,0,0.8)" : "rgba(255,51,102,0.8)";
  const subtitleColor = isTimeout ? "rgba(255,210,140,0.85)" : "rgba(255,150,170,0.8)";
  const panelBg = isTimeout ? "rgba(30,20,0,0.8)" : "rgba(30,0,15,0.8)";
  const panelBorder = isTimeout ? "rgba(255,170,0,0.3)" : "rgba(255,51,102,0.3)";
  const panelLabel = isTimeout ? "rgba(255,210,140,0.7)" : "rgba(255,150,170,0.7)";
  const panelHint = isTimeout ? "rgba(255,210,140,0.6)" : "rgba(255,150,170,0.6)";
  const buttonGradient = isTimeout
    ? "linear-gradient(135deg, #ffaa00, #cc7700)"
    : "linear-gradient(135deg, #ff3366, #cc0033)";
  const buttonShadow = isTimeout
    ? "0 0 20px rgba(255,170,0,0.4)"
    : "0 0 20px rgba(255,51,102,0.4)";

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.88)',
        zIndex: 100,
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
    >
      <h1
        data-testid="text-gameover-title"
        style={{
          fontSize: '3rem',
          fontWeight: 900,
          color: accent,
          textShadow: `0 0 30px ${accentSoft}`,
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h1>

      <p
        data-testid="text-gameover-reason"
        style={{ color: subtitleColor, fontSize: '1rem', marginBottom: '2rem' }}
      >
        {subtitle}
      </p>

      <div style={{
        background: panelBg,
        border: `1px solid ${panelBorder}`,
        borderRadius: '12px',
        padding: '1.5rem 2.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        minWidth: '240px',
      }}>
        <div style={{ color: panelLabel, fontSize: '0.9rem', marginBottom: '0.5rem' }}>本局得分</div>
        <div style={{ color: accent, fontSize: '2.5rem', fontWeight: 900 }} data-testid="text-final-score">{score}</div>
        <div style={{ color: panelHint, fontSize: '0.85rem', marginTop: '0.5rem' }}>
          已收集光球：{collected}
        </div>
      </div>

      <button
        onClick={onRestart}
        data-testid="button-restart-game"
        style={{
          padding: '0.9rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#fff',
          background: buttonGradient,
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: buttonShadow,
          letterSpacing: '0.05em',
          transition: 'transform 0.1s',
        }}
        onMouseEnter={e => (e.target as HTMLButtonElement).style.transform = 'scale(1.05)'}
        onMouseLeave={e => (e.target as HTMLButtonElement).style.transform = 'scale(1)'}
      >
        重新開始
      </button>

      <Footer />
    </div>
  );
}
