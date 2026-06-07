export default function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="size-8 animate-spin rounded-full border-2 border-border border-t-foreground" />
    </div>
  );
}
