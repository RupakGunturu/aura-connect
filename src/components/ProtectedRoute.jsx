import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

function LoadingSpinner() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && user.onboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
