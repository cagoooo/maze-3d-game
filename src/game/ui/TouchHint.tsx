/**
 * 觸控裝置第一次玩時的引導提示。
 * 玩家做出第一個動作（搖桿移動 / 視角拖曳）後由 MazeGame 寫 localStorage 後不再顯示。
 */
export function TouchHint() {
  return (
    <>
      <style>{`
        @keyframes mazeHintPulse {
          0%, 100% { opacity: 0.45; transform: translateY(0); }
          50%      { opacity: 1;    transform: translateY(-4px); }
        }
        @keyframes mazeHintArrow {
          0%, 100% { opacity: 0.45; transform: translateX(0); }
          50%      { opacity: 1;    transform: translateX(6px); }
        }
      `}</style>

      {/* 左下：搖桿提示 */}
      <div
        data-testid="hint-joystick"
        style={{
          position: "fixed",
          left: "180px",
          bottom: "70px",
          zIndex: 70,
          color: "#00e5ff",
          fontSize: "0.95rem",
          fontWeight: 700,
          background: "rgba(0,12,28,0.78)",
          border: "1px solid rgba(0,229,255,0.45)",
          borderRadius: "10px",
          padding: "10px 16px",
          letterSpacing: "0.05em",
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
          boxShadow: "0 0 12px rgba(0,229,255,0.25)",
          animation: "mazeHintPulse 1.6s ease-in-out infinite",
        }}
      >
        ← 拖動搖桿移動
      </div>

      {/* 右側：視角拖曳提示 */}
      <div
        data-testid="hint-look"
        style={{
          position: "fixed",
          right: "20px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 70,
          color: "#00e5ff",
          fontSize: "0.95rem",
          fontWeight: 700,
          background: "rgba(0,12,28,0.78)",
          border: "1px solid rgba(0,229,255,0.45)",
          borderRadius: "10px",
          padding: "12px 16px",
          letterSpacing: "0.05em",
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
          boxShadow: "0 0 12px rgba(0,229,255,0.25)",
          animation: "mazeHintArrow 1.6s ease-in-out infinite",
          writingMode: "vertical-rl",
          textOrientation: "mixed",
        }}
      >
        滑動右側畫面轉視角
      </div>
    </>
  );
}
