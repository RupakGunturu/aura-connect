import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, ready } = useAuth();

  if (!ready) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireOnboarding && user.onboardingComplete === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
}
