export default function TypingIndicator({ names }) {
  if (!names.length) return null;

  const text =
    names.length === 1
      ? `${names[0]} is typing...`
      : `${names[0]} and ${names.length - 1} other${names.length > 2 ? "s" : ""} are typing...`;

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground">
      <span className="flex items-center gap-0.5">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
      </span>
      <span>{text}</span>
    </div>
  );
}