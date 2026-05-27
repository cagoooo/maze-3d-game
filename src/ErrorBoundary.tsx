import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a14 50%, #0a0a1a 100%)",
          color: "#fff",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "'Noto Sans TC', 'Microsoft JhengHei', sans-serif",
        }}
      >
        <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>😵</div>
        <h2
          style={{
            color: "#ff3366",
            marginBottom: "0.75rem",
            fontSize: "1.6rem",
            fontWeight: 900,
            letterSpacing: "0.1em",
            textShadow: "0 0 20px rgba(255,51,102,0.5)",
          }}
        >
          遊戲發生錯誤
        </h2>
        <p
          style={{
            color: "rgba(200,220,255,0.65)",
            maxWidth: "460px",
            lineHeight: 1.7,
            marginBottom: "1.5rem",
            fontSize: "0.95rem",
          }}
        >
          請點下方按鈕重新載入。若反覆發生，請截圖回報給阿凱老師。
        </p>
        <pre
          style={{
            background: "rgba(255,51,102,0.08)",
            border: "1px solid rgba(255,51,102,0.3)",
            borderRadius: "8px",
            padding: "0.9rem 1.1rem",
            maxWidth: "90vw",
            maxHeight: "30vh",
            overflow: "auto",
            color: "rgba(255,180,200,0.8)",
            fontSize: "0.78rem",
            textAlign: "left",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {this.state.error.message}
        </pre>
        <button
          onClick={this.handleReload}
          style={{
            marginTop: "1.5rem",
            padding: "0.85rem 2.2rem",
            background: "linear-gradient(135deg, #00e5ff, #0066ff)",
            border: "none",
            borderRadius: "50px",
            color: "#0a0a1a",
            fontWeight: 700,
            fontSize: "1rem",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,229,255,0.4)",
            letterSpacing: "0.05em",
          }}
        >
          重新載入
        </button>
        <div
          style={{
            marginTop: "2rem",
            color: "rgba(180,220,255,0.35)",
            fontSize: "0.72rem",
            letterSpacing: "0.05em",
          }}
        >
          Made with ❤️ by{" "}
          <a
            href="https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "rgba(0,229,255,0.6)", textDecoration: "none" }}
          >
            阿凱老師
          </a>
          （桃園市龍潭區石門國民小學）
        </div>
      </div>
    );
  }
}
