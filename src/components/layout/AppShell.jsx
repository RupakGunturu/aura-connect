import { Link, useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, Phone, User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { disconnectSocket } from "@/lib/socket";

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;

  function handleLogout() {
    disconnectSocket();
    logout();
    navigate("/login");
  }

  const items = [
    { to: "/chat", icon: MessageCircle, label: "Messages", match: "/chat" },
    { to: "/calls", icon: Phone, label: "Calls", match: "/calls" },
    {
      to: `/profile/${user?.profile?.handle ?? ""}`,
      icon: User,
      label: "Profile",
      match: "/profile",
    },
  ];

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="ambient-glow pointer-events-none absolute inset-0" />
      {/* Desktop sidebar */}
      <aside className="relative z-10 hidden w-16 shrink-0 flex-col items-center gap-3 border-r border-border bg-background/40 py-6 backdrop-blur-md md:flex">
        <Link to="/chat" className="flex size-10 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/40">
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
          <Avatar user={user} />
        </div>
      </aside>

      <main className="relative z-10 flex min-w-0 flex-1 overflow-y-auto max-md:pb-16">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-border bg-background/80 px-4 py-2 backdrop-blur-md md:hidden">
        <Link
          to="/chat"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
            pathname.startsWith("/chat") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <MessageCircle className="size-5" />
          <span>Messages</span>
        </Link>
        <Link
          to="/calls"
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
            pathname.startsWith("/calls") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <Phone className="size-5" />
          <span>Calls</span>
        </Link>
        <Link
          to={`/profile/${user?.profile?.handle ?? ""}`}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] ${
            pathname.startsWith("/profile") ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          <User className="size-5" />
          <span>Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] text-muted-foreground"
        >
          <LogOut className="size-5" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
}

function Avatar({ user }) {
  const avatarUrl = user?.profile?.avatarUrl;
  const handle = user?.profile?.handle ?? "?";
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={handle}
        className="size-10 rounded-full object-cover ring-1 ring-border"
      />
    );
  }
  return (
    <div className="grid size-10 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
      {handle.slice(0, 2)}
    </div>
  );
}
