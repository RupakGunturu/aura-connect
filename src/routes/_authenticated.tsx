import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { ready, token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !token) {
      navigate({ to: "/login" });
    }
  }, [ready, token, navigate]);

  if (!ready || !token || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
