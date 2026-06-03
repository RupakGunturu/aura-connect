import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, signupSchema } from "@/lib/schemas";

/* ─── Design tokens ─── */
const t = {
  page:          "#0d0e11",
  card:          "#13151a",
  input:         "#0f1116",
  border:        "rgba(255,255,255,0.09)",
  borderFocus:   "rgba(96,165,250,0.55)",
  borderHover:   "rgba(96,165,250,0.3)",
  text:          "#f0f2f5",
  textMuted:     "rgba(240,242,245,0.42)",
  textFaint:     "rgba(240,242,245,0.28)",
  brand:         "#1d4ed8",
  brandHover:    "#1e40af",
  link:          "#60a5fa",
  linkHover:     "#93c5fd",
  destructive:   "#f87171",
  destructiveBg: "rgba(239,68,68,0.09)",
  destructiveBdr:"rgba(239,68,68,0.28)",
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

/* ─── Text / email field ─── */
function Field({ label, value, onChange, type = "text", placeholder, autoComplete }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: t.input,
          border: `0.5px solid ${focused ? t.borderFocus : t.border}`,
          borderRadius: 12,
          padding: "12px 14px",
          fontSize: 14, color: t.text,
          fontFamily: t.font,
          outline: "none",
          transition: "border-color 0.15s",
          WebkitAppearance: "none",
        }}
      />
    </div>
  );
}

/* ─── Password field with toggle ─── */
function PasswordField({ value, onChange, placeholder, autoComplete, isSignup }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 20 }}>
      <Label>Password</Label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: t.input,
            border: `0.5px solid ${focused ? t.borderFocus : t.border}`,
            borderRadius: 12,
            padding: "12px 44px 12px 14px",
            fontSize: 14, color: t.text,
            fontFamily: t.font,
            outline: "none",
            transition: "border-color 0.15s",
            WebkitAppearance: "none",
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((v) => !v)}
          style={{
            position: "absolute", right: 13, top: "50%",
            transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(240,242,245,0.3)",
            display: "flex", alignItems: "center", padding: 0,
            transition: "color 0.15s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "rgba(240,242,245,0.65)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "rgba(240,242,245,0.3)"}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
export function AuthForm({ mode }) {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [handle, setHandle] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    const schema = isSignup ? signupSchema : loginSchema;
    const parsed = schema.safeParse(
      isSignup ? { email, password, handle } : { email, password }
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setBusy(true);
    try {
      const body = isSignup
        ? {
            email: parsed.data.email,
            password: parsed.data.password,
            profile: { name: parsed.data.handle, handle: parsed.data.handle },
          }
        : parsed.data;
      const data = await api(isSignup ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
        credentials: "include",
      });
      if (isSignup) {
        toast.success("Account created! Please sign in.");
        navigate("/login");
        return;
      }
      setSession(data.accessToken, data.user);
      toast.success("Welcome back");
      const redirectPath = sessionStorage.getItem("redirect_after_login");
      sessionStorage.removeItem("redirect_after_login");
      navigate(redirectPath || (data.user.onboardingComplete ? "/chat" : "/onboarding"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: t.page,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "32px 16px 48px",
      fontFamily: t.font,
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>

        {/* Logo */}
        <Link to="/" style={{
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
          padding: "28px 22px 24px",
        }}>
          {/* Header */}
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: t.text,
            letterSpacing: "-0.025em", margin: 0, marginBottom: 5,
          }}>
            {isSignup ? "Create your identity" : "Welcome back"}
          </h1>
          <p style={{
            fontSize: 13, color: t.textMuted, lineHeight: 1.55,
            margin: 0, marginBottom: 26,
          }}>
            {isSignup
              ? "Choose a handle. Pick a password. We'll handle the rest."
              : "Sign in to your private channel."}
          </p>

          <form onSubmit={onSubmit}>
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@domain.com"
              autoComplete="email"
            />

            {isSignup && (
              <Field
                label="Handle"
                value={handle}
                onChange={(v) => setHandle(v.toLowerCase())}
                placeholder="stardust_rebel"
                autoComplete="username"
              />
            )}

            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder={isSignup ? "8 characters or more" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

            {/* Error */}
            {error && (
              <div style={{
                background: t.destructiveBg,
                border: `0.5px solid ${t.destructiveBdr}`,
                borderRadius: 10,
                padding: "10px 13px",
                marginBottom: 14,
                display: "flex", alignItems: "flex-start", gap: 8,
                fontSize: 13, color: t.destructive, lineHeight: 1.45,
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
                transition: "background 0.15s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = t.brandHover; }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = busy ? "rgba(29,78,216,0.5)" : t.brand; }}
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
                  {isSignup ? "Creating account…" : "Signing in…"}
                </>
              ) : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          {/* Footer */}
          <p style={{
            textAlign: "center", fontSize: 12,
            color: t.textFaint, marginTop: 20,
          }}>
            {isSignup ? (
              <>
                Already on Vault?{" "}
                <Link to="/login" style={{ color: t.link, fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = t.linkHover}
                  onMouseLeave={(e) => e.currentTarget.style.color = t.link}
                >
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link to="/signup" style={{ color: t.link, fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = t.linkHover}
                  onMouseLeave={(e) => e.currentTarget.style.color = t.link}
                >
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}