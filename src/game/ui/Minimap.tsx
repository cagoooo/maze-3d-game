import { useEffect, useRef } from "react";
import type { MazeData } from "../maze/MazeGenerator";

export interface PlayerState {
  gx: number;
  gz: number;
  yaw: number;
}

interface MinimapProps {
  mazeData: MazeData;
  playerStateRef: React.MutableRefObject<PlayerState>;
  exploredGridRef: React.MutableRefObject<boolean[][]>;
}

const CELL_PX = 14;

export function Minimap({ mazeData, playerStateRef, exploredGridRef }: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const W = mazeData.width;
    const H = mazeData.height;
    const dpr = window.devicePixelRatio || 1;
    const cssW = W * CELL_PX;
    const cssH = H * CELL_PX;
    cvs.width = cssW * dpr;
    cvs.height = cssH * dpr;
    cvs.style.width = `${cssW}px`;
    cvs.style.height = `${cssH}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let rafId = 0;

    const draw = () => {
      ctx.fillStyle = "#05080f";
      ctx.fillRect(0, 0, cssW, cssH);

      const explored = exploredGridRef.current;
      for (let z = 0; z < H; z++) {
        const row = explored[z];
        if (!row) continue;
        for (let x = 0; x < W; x++) {
          if (!row[x]) continue;
          const isWall = mazeData.grid[z]?.[x] === 1;
          ctx.fillStyle = isWall ? "#2b3a5c" : "rgba(220,236,255,0.85)";
          ctx.fillRect(x * CELL_PX, z * CELL_PX, CELL_PX, CELL_PX);
        }
      }

      ctx.strokeStyle = "rgba(0,229,255,0.18)";
      ctx.lineWidth = 1;
      ctx.strokeRect(0.5, 0.5, cssW - 1, cssH - 1);

      const { gx, gz, yaw } = playerStateRef.current;
      const px = gx * CELL_PX + CELL_PX / 2;
      const pz = gz * CELL_PX + CELL_PX / 2;

      ctx.save();
      ctx.translate(px, pz);
      ctx.rotate(-yaw);
      ctx.fillStyle = "#ff3366";
      ctx.shadowColor = "rgba(255,51,102,0.9)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      rafId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [mazeData, playerStateRef, exploredGridRef]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "72px",
        left: "20px",
        zIndex: 55,
        background: "rgba(0,0,0,0.75)",
        border: "1px solid rgba(0,229,255,0.3)",
        borderRadius: "10px",
        padding: "8px 10px 10px",
        backdropFilter: "blur(4px)",
        pointerEvents: "none",
        userSelect: "none",
      }}
    >
      <div
        style={{
          color: "rgba(0,229,255,0.7)",
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          marginBottom: "6px",
          textAlign: "center",
        }}
      >
        雷達小地圖
      </div>
      <canvas
        ref={canvasRef}
        data-testid="canvas-minimap"
        style={{ display: "block", borderRadius: "4px" }}
      />
    </div>
  );
}

