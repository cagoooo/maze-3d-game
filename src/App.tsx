import { lazy, Suspense } from "react";
import { MazeGame } from "./game/MazeGame";

const AdminPage = lazy(() =>
  import("./admin/AdminPage").then((m) => ({ default: m.AdminPage })),
);

function App() {
  const isAdmin =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("admin") === "true";

  if (isAdmin) {
    return (
      <Suspense
        fallback={
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0a0a1a",
              color: "#00e5ff",
            }}
          >
            載入後台…
          </div>
        }
      >
        <AdminPage />
      </Suspense>
    );
  }

  return <MazeGame />;
}

export default App;
