import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function Onboarding() {
  const { user, updateUser, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [bio, setBio] = useState(user?.profile?.bio ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(user?.profile?.avatarUrl ?? "");
  const [privacyMode, setPrivacyMode] = useState("private");
  const [allowUnknownMessages, setAllowUnknownMessages] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (user?.onboardingComplete) {
    navigate("/chat", { replace: true });
    return null;
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarDataUrl(ev.target?.result ?? "");
    reader.readAsDataURL(file);
  }

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api("/auth/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ bio, avatarUrl: avatarDataUrl, privacyMode, allowUnknownMessages }),
        token,
      });
      updateUser(data.user);
      toast.success("Profile setup complete!");
      navigate("/chat");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="ambient-glow absolute inset-0" />
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/chat" className="mb-10 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/40">
            <div className="size-3 rounded-full bg-brand" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Vault</span>
        </Link>

        <div className="glass-card rounded-3xl border border-border p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Customize how others see you and your privacy preferences.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Bio
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell the world about yourself..."
                maxLength={280}
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
              />
              <span className="mt-1 block text-right text-[10px] text-muted-foreground">
                {bio.length}/280
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Avatar
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={handleAvatarClick}
                className="flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 px-4 py-3 text-sm outline-none transition-colors hover:border-brand"
              >
                {avatarDataUrl ? (
                  <img
                    src={avatarDataUrl}
                    alt="Avatar preview"
                    className="size-10 rounded-full object-cover ring-1 ring-border"
                  />
                ) : (
                  <div className="grid size-10 place-items-center rounded-full bg-card text-xs font-semibold uppercase ring-1 ring-border">
                    {user?.profile?.handle?.slice(0, 2) ?? "?"}
                  </div>
                )}
                <span className="text-muted-foreground">
                  {avatarDataUrl ? "Change avatar" : "Upload an image"}
                </span>
              </button>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Privacy Mode
              </span>
              <select
                value={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.value)}
                className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
              >
                <option value="public">Public — anyone can message you</option>
                <option value="friends">Friends — only people you know</option>
                <option value="private">Private — invite only</option>
              </select>
            </label>

            <label className="flex items-center justify-between rounded-xl border border-border bg-background/50 px-4 py-3">
              <span className="text-sm">Allow unknown messages</span>
              <button
                type="button"
                role="switch"
                aria-checked={allowUnknownMessages}
                onClick={() => setAllowUnknownMessages((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  allowUnknownMessages ? "bg-brand" : "bg-border"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform ${
                    allowUnknownMessages ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </label>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-2xl bg-brand py-3.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-brand/10 transition-transform hover:scale-[1.01] disabled:opacity-60"
            >
              {busy ? "…" : "Complete setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
