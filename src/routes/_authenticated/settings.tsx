import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState, type ChangeEvent } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { profileSchema } from "@/lib/schemas";
import { disconnectSocket } from "@/lib/socket";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { token, user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null);
  const [busy, setBusy] = useState(false);

  function onAvatarFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      toast.error("Image too large — keep it under 200 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function save() {
    const parsed = profileSchema.safeParse({ bio, avatarUrl: avatarUrl ?? undefined });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const data = await api<{ user: { bio?: string; avatarUrl?: string } }>("/me", {
        method: "PATCH",
        token,
        body: JSON.stringify(parsed.data),
      });
      updateUser(data.user);
      toast.success("Profile updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  function doLogout() {
    disconnectSocket();
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-10">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your identity and session.
          </p>
        </div>

        <section className="glass-card rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Profile</h2>
          <div className="mt-6 flex flex-col items-start gap-6 md:flex-row md:items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="relative size-20 overflow-hidden rounded-full ring-1 ring-border"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={user?.handle} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center bg-card text-base font-semibold uppercase">
                  {user?.handle.slice(0, 2)}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 grid place-items-center bg-background/70 py-1 text-[10px] font-semibold uppercase tracking-widest">
                <Upload className="size-3" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarFile} />
            <div className="flex-1">
              <p className="text-sm font-semibold">@{user?.handle}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-3 text-sm outline-none focus:border-brand"
            />
          </label>

          <div className="mt-4 flex justify-end">
            <button
              onClick={save}
              disabled={busy}
              className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {busy ? "…" : "Save changes"}
            </button>
          </div>
        </section>

        <section className="glass-card rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Session</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Signing out disconnects the socket and clears your JWT from this device.
          </p>
          <button
            onClick={doLogout}
            className="mt-4 rounded-full border border-destructive/40 bg-destructive/10 px-5 py-2 text-sm font-semibold text-destructive hover:bg-destructive/20"
          >
            Sign out
          </button>
        </section>

        <section className="glass-card rounded-2xl border border-border p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Privacy</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Passwords are hashed with bcrypt (cost 12) before storage.</li>
            <li>• JWT auth, 7-day expiry. Stored locally; never sent to third parties.</li>
            <li>• All traffic is encrypted in transit (TLS) and at rest (MongoDB Atlas).</li>
            <li>• We do not collect analytics, IPs, or device metadata.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
