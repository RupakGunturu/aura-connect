import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export const Route = createFileRoute("/_authenticated/profile/$handle")({
  component: ProfilePage,
});

function ProfilePage() {
  const { handle } = Route.useParams();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api(`/users/${handle}`, { token })
      .then((d) => setProfile(d.user))
      .catch((e) => setError(e instanceof Error ? e.message : "Not found"))
      .finally(() => setLoading(false));
  }, [handle, token]);

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-10">
      <div className="mx-auto w-full max-w-2xl">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error || !profile ? (
          <div className="glass-card rounded-2xl border border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No profile found for @{handle}.</p>
          </div>
        ) : (
          <>
            <div className="glass-card relative overflow-hidden rounded-3xl border border-border p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.handle}
                    className="size-28 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="grid size-28 place-items-center rounded-full bg-card text-2xl font-semibold uppercase ring-1 ring-border">
                    {profile.handle.slice(0, 2)}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">@{profile.handle}</h1>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {profile.online ? "online now" : profile.lastSeen ? `last seen ${new Date(profile.lastSeen).toLocaleString()}` : "offline"}
                  </p>
                </div>
                {profile.bio && (
                  <p className="max-w-md text-pretty text-sm text-muted-foreground">{profile.bio}</p>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
                  <Lock className="size-2.5" /> Conversations are end-to-end encrypted
                </span>
              </div>
            </div>

            {user?.handle === profile.handle && (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                This is your profile. Update it from{" "}
                <a href="/settings" className="font-semibold text-foreground hover:text-brand">
                  Settings
                </a>
                .
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
