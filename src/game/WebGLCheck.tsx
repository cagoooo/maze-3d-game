import { useEffect, useState } from "react";

export function useWebGLSupport() {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      setSupported(!!gl);
    } catch {
      setSupported(false);
    }
  }, []);

  return supported;
}

export function NoWebGLScreen() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a1a",
        color: "#fff",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
      <h2 style={{ fontSize: "1.5rem", color: "#00e5ff", marginBottom: "0.75rem" }}>
        不支援 WebGL
      </h2>
      <p style={{ color: "rgba(200,220,255,0.6)", maxWidth: "380px", lineHeight: 1.6 }}>
        您的瀏覽器不支援 WebGL，無法執行 3D 遊戲。
        <br />
        請使用 Chrome、Firefox 或 Edge 的最新版本，並確保已啟用硬體加速。
      </p>
    </div>
  );
}
