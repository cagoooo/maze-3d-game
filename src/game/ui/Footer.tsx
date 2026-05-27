interface FooterProps {
  variant?: "light" | "dark";
  showVersion?: boolean;
}

const TEACHER_URL =
  "https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5";

export function Footer({ variant = "dark", showVersion = false }: FooterProps) {
  const baseColor =
    variant === "light" ? "rgba(60,90,140,0.65)" : "rgba(180,220,255,0.45)";
  const linkColor =
    variant === "light" ? "rgba(0,140,200,0.85)" : "rgba(0,229,255,0.75)";

  return (
    <footer
      style={{
        marginTop: "clamp(1.2rem, 3vh, 2rem)",
        paddingBottom: "0.5rem",
        textAlign: "center",
        color: baseColor,
        fontSize: "0.72rem",
        letterSpacing: "0.04em",
        lineHeight: 1.6,
      }}
    >
      Made with ❤️ by{" "}
      <a
        href={TEACHER_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: linkColor,
          textDecoration: "none",
          borderBottom: `1px dotted ${linkColor}`,
        }}
        data-testid="link-author"
      >
        阿凱老師
      </a>
      （桃園市龍潭區石門國民小學）
      {showVersion && (
        <div
          style={{
            marginTop: "0.35rem",
            color: variant === "light" ? "rgba(60,90,140,0.4)" : "rgba(180,220,255,0.3)",
            fontSize: "0.66rem",
          }}
          data-testid="text-version"
        >
          v{__APP_VERSION__}
        </div>
      )}
    </footer>
  );
}
