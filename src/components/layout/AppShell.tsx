import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { MessageCircle, User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { disconnectSocket } from "@/lib/socket";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate({ to: "/login" });
  }

  const items = [
    { to: "/chat", icon: MessageCircle, label: "Messages", match: "/chat" },
    {
      to: `/profile/${user?.handle ?? ""}`,
      icon: User,
      label: "Profile",
      match: "/profile",
    },
    { to: "/settings", icon: Settings, label: "Settings", match: "/settings" },
  ] as const;

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="ambient-glow pointer-events-none absolute inset-0" />
      {/* Icon rail */}
      <aside className="relative z-10 flex w-16 shrink-0 flex-col items-center gap-3 border-r border-border bg-background/40 py-6 backdrop-blur-md">
        <Link to="/" className="flex size-10 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/40">
          <div className="size-4 rounded-sm bg-brand" />
        </Link>
        <div className="my-2 h-px w-8 bg-border" />
        {items.map((item) => {
          const active = pathname.startsWith(item.match);
          return (
            <Link
              key={item.label}
              to={item.to}
              title={item.label}
              className={`grid size-10 place-items-center rounded-xl transition-colors ${
                active
                  ? "bg-card text-foreground ring-1 ring-border"
                  : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
              }`}
            >
              <item.icon className="size-4" />
            </Link>
          );
        })}
        <div className="mt-auto flex flex-col items-center gap-3">
          <button
            onClick={handleLogout}
            title="Log out"
            className="grid size-10 place-items-center rounded-xl text-muted-foreground hover:bg-card/60 hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
          <Avatar user={user!} />
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}

function Avatar({ user }: { user: { handle: string; avatarUrl?: string | null } }) {
  if (user.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={user.handle}
        className="size-10 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <div className="grid size-10 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
      {user.handle.slice(0, 2)}
    </div>
  );
}
