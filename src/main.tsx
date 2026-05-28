import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./ErrorBoundary";
import { injectImmersiveKeyframes } from "./game/ui/theme";
import { installChunkErrorHandler } from "./chunkErrorRecovery";
import "./index.css";

// 最早期裝：在 React 還沒 mount 前發生的 dynamic import 失敗也能接住
installChunkErrorHandler();
injectImmersiveKeyframes();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
