import { Leaderboard } from "./Leaderboard";
import type { LeaderboardEntry } from "../leaderboard";

interface StartScreenProps {
  onStart: () => void;
  leaderboard: LeaderboardEntry[];
}

export function StartScreen({ onStart, leaderboard }: StartScreenProps) {
  return (
    <div
      data-testid="overlay-start"
      style={{
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1a2e 50%, #0a0a1a 100%)',
        zIndex: 100,
        userSelect: 'none',
      }}
    >
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'radial-gradient(ellipse at center, rgba(0,200,255,0.05) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        margin: 'auto',
        width: '100%',
        maxWidth: '520px',
        padding: 'clamp(1.5rem, 4vh, 3rem) clamp(1rem, 4vw, 2rem)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1,
      }}>
      <h1 style={{
        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
        fontWeight: 900,
        color: '#00e5ff',
        textShadow: '0 0 30px rgba(0,229,255,0.8), 0 0 60px rgba(0,229,255,0.4)',
        marginBottom: '0.5rem',
        letterSpacing: '0.1em',
        textAlign: 'center',
      }}>
        3D 迷宮冒險
      </h1>

      <p style={{
        fontSize: 'clamp(0.9rem, 2.2vw, 1.1rem)',
        color: 'rgba(180,220,255,0.7)',
        marginBottom: 'clamp(1.2rem, 4vh, 3rem)',
        letterSpacing: '0.05em',
        textAlign: 'center',
      }}>
        收集所有光球，躲避敵人
      </p>

      <div style={{
        background: 'rgba(0,20,40,0.8)',
        border: '1px solid rgba(0,229,255,0.2)',
        borderRadius: '12px',
        padding: 'clamp(1rem, 2.5vw, 1.5rem) clamp(1.2rem, 3vw, 2rem)',
        marginBottom: 'clamp(1rem, 3vh, 2.5rem)',
        maxWidth: '340px',
        width: '90%',
      }}>
        <p style={{ color: '#00e5ff', fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>遊戲說明</p>
        <div style={{ color: 'rgba(200,230,255,0.8)', fontSize: '0.9rem', lineHeight: '1.8' }}>
          <div>🖱 移動滑鼠 — 環顧四周</div>
          <div>⌨ WASD / 方向鍵 — 移動</div>
          <div>💎 收集所有藍色光球得分</div>
          <div>👾 避開紅色敵人</div>
          <div>⏱ 越快完成分數越高</div>
        </div>
      </div>

      <button
        onClick={onStart}
        data-testid="button-start-game"
        style={{
          padding: 'clamp(0.8rem, 2vh, 1rem) clamp(2rem, 6vw, 3rem)',
          fontSize: 'clamp(1.05rem, 2.5vw, 1.3rem)',
          fontWeight: 700,
          color: '#0a0a1a',
          background: 'linear-gradient(135deg, #00e5ff, #0066ff)',
          border: 'none',
          borderRadius: '50px',
          cursor: 'pointer',
          boxShadow: '0 0 30px rgba(0,229,255,0.5), 0 4px 20px rgba(0,0,0,0.4)',
          transition: 'transform 0.1s, box-shadow 0.1s',
          letterSpacing: '0.1em',
        }}
        onMouseEnter={e => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1.05)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 0 50px rgba(0,229,255,0.7), 0 4px 30px rgba(0,0,0,0.5)';
        }}
        onMouseLeave={e => {
          (e.target as HTMLButtonElement).style.transform = 'scale(1)';
          (e.target as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(0,229,255,0.5), 0 4px 20px rgba(0,0,0,0.4)';
        }}
      >
        開始遊戲
      </button>

      <div
        style={{
          marginTop: 'clamp(1rem, 2.5vh, 1.5rem)',
          padding: '0.9rem 1.2rem',
          background: 'rgba(0,229,255,0.06)',
          border: '1px solid rgba(0,229,255,0.22)',
          borderRadius: '10px',
          color: 'rgba(220,236,255,0.85)',
          fontSize: '0.85rem',
          lineHeight: 1.7,
          width: '100%',
          maxWidth: '420px',
          textAlign: 'left',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ color: 'rgba(0,229,255,0.8)', fontSize: '0.75rem', letterSpacing: '0.18em', marginBottom: '6px', textAlign: 'center' }}>
          操作說明
        </div>
        <div>・ <b>WASD / 方向鍵</b>：移動</div>
        <div>・ <b>滑鼠</b>：控制視角（點擊畫面以鎖定）</div>
        <div>・ <b>ESC 鍵</b>：釋放滑鼠游標、暫停遊戲</div>
        <div>・ <b>P 鍵</b>：顯示／隱藏雷達小地圖</div>
      </div>

      <div style={{ marginTop: 'clamp(1.2rem, 3vh, 1.8rem)', width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Leaderboard entries={leaderboard} accent="#00e5ff" />
      </div>
      </div>
    </div>
  );
}
