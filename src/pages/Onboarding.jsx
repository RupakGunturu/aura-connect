import { useState, useRef } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Design tokens (dark-only) ─── */
const t = {
  page:          "#0d0e11",
  card:          "#13151a",
  input:         "#0f1116",
  border:        "rgba(255,255,255,0.09)",
  borderFocus:   "rgba(96,165,250,0.5)",
  borderHover:   "rgba(96,165,250,0.28)",
  text:          "#f0f2f5",
  textMuted:     "rgba(240,242,245,0.42)",
  textFaint:     "rgba(240,242,245,0.25)",
  brand:         "#1d4ed8",
  brandHover:    "#1e40af",
  destructive:   "#ef4444",
  destructiveBg: "rgba(239,68,68,0.1)",
  divider:       "rgba(255,255,255,0.06)",
  font:          "'SF Pro Text','Segoe UI',system-ui,sans-serif",
};

/* ─── Field label ─── */
function Label({ children }) {
  return (
    <span style={{
      display: "block",
      fontSize: 10, fontWeight: 700,
      letterSpacing: "0.1em", textTransform: "uppercase",
      color: t.textFaint, marginBottom: 7,
      fontFamily: t.font,
    }}>
      {children}
    </span>
  );
}

/* ─── Section heading ─── */
function SectionTitle({ children }) {
  return (
    <p style={{
      fontSize: 10, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      color: t.textFaint, marginBottom: 10,
      fontFamily: t.font,
    }}>
      {children}
    </p>
  );
}

/* ─── Thin divider ─── */
function Divider() {
  return <div style={{ height: "0.5px", background: t.divider, margin: "20px 0" }} />;
}

/* ─── Shared input style ─── */
const inputStyle = {
  width: "100%",
  background: t.input,
  border: `0.5px solid ${t.border}`,
  borderRadius: 12,
  padding: "11px 14px",
  fontSize: 14,
  color: t.text,
  fontFamily: t.font,
  outline: "none",
  transition: "border-color 0.15s",
};

/* ─── Step indicator ─── */
function StepDots({ current = 2, total = 3 }) {
  const colors = { done: "#22c55e", active: "#3b82f6", pending: "rgba(255,255,255,0.15)" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20 }}>
      {Array.from({ length: total }, (_, i) => {
        const state = i + 1 < current ? "done" : i + 1 === current ? "active" : "pending";
        return (
          <div key={i} style={{
            width: state === "active" ? 18 : 6,
            height: 6, borderRadius: 99,
            background: colors[state],
            transition: "width 0.2s",
          }} />
        );
      })}
      <span style={{ fontSize: 11, color: t.textFaint, marginLeft: 2, fontFamily: t.font, letterSpacing: "0.04em" }}>
        Step {current} of {total}
      </span>
    </div>
  );
}

/* ─── Toggle switch ─── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 99,
        background: checked ? t.brand : "rgba(255,255,255,0.1)",
        border: "none", cursor: "pointer",
        position: "relative", flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <span style={{
        position: "absolute",
        top: 3, left: 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff",
        transform: checked ? "translateX(18px)" : "translateX(0)",
        transition: "transform 0.2s",
        display: "block",
      }} />
    </button>
  );
}

/* ─── Main component ─── */
export default function Onboarding() {
  const { user, updateUser, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [bio, setBio] = useState(user?.profile?.bio ?? "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(user?.profile?.avatarUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  /* Focus states */
  const [focusBio, setFocusBio] = useState(false);
  const [hoverAvatar, setHoverAvatar] = useState(false);

  if (user?.onboardingComplete) {
    return <Navigate to="/chat" replace />;
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarDataUrl(ev.target?.result ?? "");
    reader.readAsDataURL(file);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api("/auth/onboarding", {
        method: "PATCH",
        body: JSON.stringify({ bio, avatarUrl: avatarDataUrl }),
        token,
      });
      updateUser(data.user);
      toast.success("Profile setup complete!");
      navigate("/chat");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const avatarInitials = user?.profile?.handle?.slice(0, 2)?.toUpperCase() ?? "?";

  return (
    <div style={{
      minHeight: "100vh",
      background: t.page,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px 16px 48px",
      fontFamily: t.font,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <Link to="/chat" style={{
          display: "inline-flex", alignItems: "center", gap: 9,
          marginBottom: 28, textDecoration: "none",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "rgba(29,78,216,0.15)",
            border: "0.5px solid rgba(96,165,250,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text, letterSpacing: "-0.01em" }}>
            Vault
          </span>
        </Link>

        {/* Card */}
        <div style={{
          background: t.card,
          border: `0.5px solid ${t.border}`,
          borderRadius: 20,
          padding: "24px 20px 22px",
        }}>
          <StepDots current={2} total={3} />

          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: t.text, letterSpacing: "-0.02em", margin: 0, marginBottom: 5 }}>
              Set up your profile
            </h1>
            <p style={{ fontSize: 13, color: t.textMuted, lineHeight: 1.5, margin: 0 }}>
              Customize how others see you and configure your privacy.
            </p>
          </div>

          <form onSubmit={onSubmit}>
            {/* ── Identity section ── */}
            <SectionTitle>Identity</SectionTitle>

            {/* Avatar */}
            <div style={{ marginBottom: 14 }}>
              <Label>Avatar</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onMouseEnter={() => setHoverAvatar(true)}
                onMouseLeave={() => setHoverAvatar(false)}
                style={{
                  ...inputStyle,
                  display: "flex", alignItems: "center", gap: 12,
                  cursor: "pointer",
                  borderColor: hoverAvatar ? t.borderHover : t.border,
                  padding: "10px 14px",
                }}
              >
                {avatarDataUrl ? (
                  <img
                    src={avatarDataUrl}
                    alt="Avatar preview"
                    style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `0.5px solid ${t.border}` }}
                  />
                ) : (
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", flexShrink: 0,
                    background: "#1e2128", border: `0.5px solid rgba(255,255,255,0.12)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 600, color: "rgba(240,242,245,0.45)",
                  }}>
                    {avatarInitials}
                  </div>
                )}
                <span style={{ fontSize: 14, color: t.textMuted }}>
                  {avatarDataUrl ? "Change photo" : "Upload a photo"}
                </span>
              </button>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: 4 }}>
              <Label>Bio</Label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                onFocus={() => setFocusBio(true)}
                onBlur={() => setFocusBio(false)}
                placeholder="A short intro about yourself…"
                maxLength={280}
                rows={3}
                style={{
                  ...inputStyle,
                  resize: "none",
                  lineHeight: 1.5,
                  borderColor: focusBio ? t.borderFocus : t.border,
                }}
              />
              <p style={{ fontSize: 11, color: t.textFaint, textAlign: "right", margin: "4px 0 10px" }}>
                {bio.length} / 280
              </p>
            </div>



            {/* Error */}
            {error && (
              <div style={{
                background: t.destructiveBg,
                border: `0.5px solid rgba(239,68,68,0.3)`,
                borderRadius: 10,
                padding: "10px 13px",
                marginBottom: 14,
                fontSize: 13, color: t.destructive,
                display: "flex", alignItems: "flex-start", gap: 8,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%", padding: "14px",
                background: busy ? "rgba(29,78,216,0.5)" : t.brand,
                border: "none", borderRadius: 13,
                fontSize: 15, fontWeight: 600, color: "#fff",
                cursor: busy ? "not-allowed" : "pointer",
                fontFamily: t.font, letterSpacing: "0.01em",
                transition: "opacity 0.15s, background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = t.brandHover; }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = t.brand; }}
            >
              {busy ? (
                <>
                  <span style={{
                    width: 14, height: 14, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderTop: "2px solid #fff",
                    animation: "spin 0.7s linear infinite",
                    display: "inline-block",
                  }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  Setting up…
                </>
              ) : "Complete setup"}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p style={{ fontSize: 12, color: t.textFaint, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
          You can update these settings anytime from your profile.
        </p>
      </div>
    </div>
  );
}