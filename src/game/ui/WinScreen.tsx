import { Leaderboard } from "./Leaderboard";
import type { LeaderboardEntry } from "../leaderboard";

interface WinScreenProps {
  score: number;
  timeBonus: number;
  elapsed: number;
  onRestart: () => void;
  leaderboard: LeaderboardEntry[];
  rank: number | null;
}

export function WinScreen({ score, timeBonus, elapsed, onRestart, leaderboard, rank }: WinScreenProps) {
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

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
      <div style={{
        fontSize: '3.5rem',
        marginBottom: '0.5rem',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>
        🏆
      </div>

      <h1 style={{
        fontSize: '2.8rem',
        fontWeight: 900,
        color: '#ffd700',
        textShadow: '0 0 30px rgba(255,215,0,0.8), 0 0 60px rgba(255,165,0,0.4)',
        marginBottom: '0.5rem',
      }}>
        恭喜過關！
      </h1>

      <p style={{ color: 'rgba(255,220,100,0.7)', fontSize: '1rem', marginBottom: '2rem' }}>
        你成功收集了所有光球！
      </p>

      <div style={{
        background: 'rgba(20,15,0,0.8)',
        border: '1px solid rgba(255,215,0,0.3)',
        borderRadius: '12px',
        padding: '1.5rem 2.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        minWidth: '260px',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,220,100,0.7)', fontSize: '0.9rem' }}>
            <span>收集得分</span>
            <span style={{ color: '#fff', fontWeight: 700 }}>{score - timeBonus}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,220,100,0.7)', fontSize: '0.9rem' }}>
            <span>時間獎勵</span>
            <span style={{ color: '#00e5ff', fontWeight: 700 }}>+{timeBonus}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,220,100,0.7)', fontSize: '0.9rem' }}>
            <span>完成時間</span>
            <span style={{ color: '#fff' }}>{timeStr}</span>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,215,0,0.2)', paddingTop: '0.6rem', marginTop: '0.2rem' }}>
            <div style={{ color: 'rgba(255,220,100,0.7)', fontSize: '0.85rem', marginBottom: '0.2rem' }}>總得分</div>
            <div style={{ color: '#ffd700', fontSize: '2.5rem', fontWeight: 900 }} data-testid="text-win-score">{score}</div>
          </div>
        </div>
      </div>

      {rank !== null && (
        <div
          data-testid="text-new-rank"
          style={{
            color: '#ffd700',
            fontWeight: 800,
            fontSize: '0.95rem',
            marginBottom: '1rem',
            textShadow: '0 0 12px rgba(255,215,0,0.6)',
          }}
        >
          🎉 新紀錄！本局擠進第 {rank} 名
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <Leaderboard entries={leaderboard} highlightRank={rank} accent="#ffd700" />
      </div>

      <button
        onClick={onRestart}
        data-testid="button-play-again"
        style={{
          padding: '0.9rem 2.5rem',
          fontSize: '1.1rem',
          fontWeight: 700,
          color: '#0a0a1a',
          background: 'linear-gradient(135deg, #ffd700, #ff8c00)',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 0 20px rgba(255,215,0,0.4)',
          letterSpacing: '0.05em',
          transition: 'transform 0.1s',
        }}
        onMouseEnter={e => (e.target as HTMLButtonElement).style.transform = 'scale(1.05)'}
        onMouseLeave={e => (e.target as HTMLButtonElement).style.transform = 'scale(1)'}
      >
        再玩一次
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
