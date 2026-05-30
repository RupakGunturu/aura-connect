import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { profileSchema } from "@/lib/schemas";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { ready, token, user, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && !token) navigate({ to: "/login" });
  }, [ready, token, navigate]);

  useEffect(() => {
    if (user) {
      setBio(user.bio ?? "");
      setAvatarUrl(user.avatarUrl ?? null);
    }
  }, [user]);

  async function onAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024) {
      toast.error("Image too large — keep it under 200 KB for now.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result);
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
      const data = await api("/me", {
        method: "PATCH",
        token,
        body: JSON.stringify(parsed.data),
      });
      updateUser(data.user);
      toast.success("Profile saved");
      navigate({ to: "/chat" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="ambient-glow absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="glass-card rounded-3xl border border-border p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            How the people you talk to will see you. You can change this any time.
          </p>

          <div className="mt-8 flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative size-24 overflow-hidden rounded-full ring-1 ring-border"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Your avatar" className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center bg-card text-lg font-semibold uppercase">
                  {user?.handle.slice(0, 2)}
                </div>
              )}
              <div className="absolute inset-0 hidden place-items-center bg-background/70 text-xs font-semibold text-foreground group-hover:grid">
                <Upload className="size-4" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onAvatarFile} />
            <p className="mt-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              @{user?.handle}
            </p>
          </div>

          <label className="mt-8 block">
            <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Bio
            </span>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              rows={3}
              placeholder="A line or two about yourself…"
              className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
            />
            <p className="mt-1 text-right text-[10px] text-muted-foreground">{bio.length}/280</p>
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate({ to: "/chat" })}
              className="flex-1 rounded-2xl border border-border bg-card/30 py-3 text-sm font-medium hover:bg-card/60"
            >
              Skip
            </button>
            <button
              onClick={save}
              disabled={busy}
              className="flex-1 rounded-2xl bg-brand py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {busy ? "…" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
