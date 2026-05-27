import { Minimap, type PlayerState } from "./Minimap";
import { DamageOverlay } from "./DamageOverlay";
import type { MazeData } from "../maze/MazeGenerator";

interface HUDProps {
  score: number;
  collected: number;
  total: number;
  health: number;
  timeLeft: number;
  isLocked: boolean;
  isPaused: boolean;
  mazeData: MazeData;
  playerStateRef: React.MutableRefObject<PlayerState>;
  exploredGridRef: React.MutableRefObject<boolean[][]>;
  mapVisible: boolean;
}

export function HUD({
  score,
  collected,
  total,
  health,
  timeLeft,
  isLocked,
  isPaused,
  mazeData,
  playerStateRef,
  exploredGridRef,
  mapVisible,
}: HUDProps) {
  const safeTime = Math.max(0, timeLeft);
  const minutes = Math.floor(safeTime / 60);
  const seconds = safeTime % 60;
  const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  const timeColor = safeTime <= 10 ? '#ff3366' : safeTime <= 20 ? '#ffaa00' : '#fff';
  const healthPct = Math.max(0, Math.min(100, (health / 3) * 100));

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '16px 20px',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.65)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: '2px' }}>得分</div>
            <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 900, lineHeight: 1 }} data-testid="text-score">{score}</div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.65)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: '2px' }}>已收集</div>
            <div style={{ color: collected === total ? '#ffd700' : '#00e5ff', fontSize: '1.1rem', fontWeight: 700, lineHeight: 1 }} data-testid="text-collected">
              {collected} / {total}
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.65)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            backdropFilter: 'blur(4px)',
            textAlign: 'right',
          }}>
            <div style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: '2px' }}>剩餘時間</div>
            <div style={{ color: timeColor, fontSize: '1.4rem', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', transition: 'color 0.2s' }} data-testid="text-timer">{timeStr}</div>
          </div>

          <div style={{
            background: 'rgba(0,0,0,0.65)',
            border: '1px solid rgba(0,229,255,0.25)',
            borderRadius: '8px',
            padding: '8px 14px',
            backdropFilter: 'blur(4px)',
            minWidth: '110px',
          }}>
            <div style={{ color: 'rgba(0,229,255,0.6)', fontSize: '0.65rem', letterSpacing: '0.15em', marginBottom: '4px' }}>生命值</div>
            <div style={{
              height: '6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${healthPct}%`,
                background: healthPct > 60 ? '#00ff88' : healthPct > 30 ? '#ffaa00' : '#ff3366',
                borderRadius: '3px',
                transition: 'width 0.3s ease, background 0.3s ease',
              }} data-testid="bar-health" />
            </div>
            <div style={{ color: '#fff', fontSize: '0.75rem', marginTop: '3px', textAlign: 'right' }}>
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} style={{ color: i < health ? '#ff3366' : 'rgba(255,255,255,0.2)', marginLeft: '2px' }}>❤</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          boxShadow: '0 0 4px rgba(0,0,0,0.8)',
        }} />
      </div>

      {mapVisible && (
        <Minimap
          mazeData={mazeData}
          playerStateRef={playerStateRef}
          exploredGridRef={exploredGridRef}
        />
      )}

      <DamageOverlay health={health} maxHealth={3} />

      {isLocked && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          background: 'rgba(0,0,0,0.55)',
          border: '1px solid rgba(0,229,255,0.18)',
          borderRadius: '8px',
          padding: '6px 14px',
          color: 'rgba(180,220,255,0.7)',
          fontSize: '0.75rem',
          letterSpacing: '0.05em',
          pointerEvents: 'none',
          backdropFilter: 'blur(4px)',
        }}>
          WASD / 方向鍵移動 ・ 滑鼠視角 ・ 按 [ESC] 釋放游標 ・ 按 [P] 開關地圖
        </div>
      )}

      {isPaused && (
        <div
          data-testid="overlay-pause"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 80,
            background: 'rgba(5,8,15,0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            fontSize: '2.6rem',
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: '#00e5ff',
            textShadow: '0 0 20px rgba(0,229,255,0.6)',
            marginBottom: '1.2rem',
          }}>
            遊戲暫停
          </div>
          <div style={{
            fontSize: '1rem',
            color: 'rgba(220,236,255,0.85)',
            marginBottom: '0.8rem',
          }}>
            點擊畫面任意處以重新鎖定滑鼠、繼續探索
          </div>
          <div style={{
            fontSize: '0.8rem',
            color: 'rgba(180,220,255,0.5)',
            letterSpacing: '0.08em',
          }}>
            計時器與紅怪已暫停 ・ 按 [ESC] 隨時可再次離開
          </div>
        </div>
      )}
    </>
  );
}
