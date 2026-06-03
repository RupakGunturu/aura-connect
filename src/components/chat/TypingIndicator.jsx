const dotStyle = (delay) => ({
  width: 5, height: 5, borderRadius: "50%",
  background: "rgba(96,165,250,0.55)",
  flexShrink: 0,
  animation: "vaultBounce 1.1s ease-in-out infinite",
  animationDelay: delay,
});

export default function TypingIndicator({ names }) {
  if (!names?.length) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing`
      : `${names[0]} and ${names.length - 1} other${names.length > 2 ? "s" : ""} are typing`;

  return (
    <>
      <style>{`
        @keyframes vaultBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "5px 16px",
        fontFamily: "'SF Pro Text','Segoe UI',system-ui,sans-serif",
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span style={dotStyle("0ms")} />
          <span style={dotStyle("160ms")} />
          <span style={dotStyle("320ms")} />
        </span>
        <span style={{
          fontSize: 12,
          color: "rgba(240,242,245,0.38)",
          letterSpacing: "0.01em",
        }}>
          {text}
        </span>
      </div>
    </>
  );
}