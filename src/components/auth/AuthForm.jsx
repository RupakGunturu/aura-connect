import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { loginSchema, signupSchema } from "@/lib/schemas";

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
    const parsed = schema.safeParse(isSignup ? { email, password, handle } : { email, password });
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
      });
      if (isSignup) {
        toast.success("Account created! Please sign in.");
        navigate("/login");
        return;
      }
      setSession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
      toast.success("Welcome back");
      navigate(data.user.onboardingComplete ? "/chat" : "/onboarding");
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
        <Link to="/" className="mb-10 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/40">
            <div className="size-3 rounded-full bg-brand" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Vault</span>
        </Link>

        <div className="glass-card rounded-3xl border border-border p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignup ? "Create your identity" : "Welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup
              ? "Choose a handle. Pick a password. We'll handle the rest."
              : "Sign in to your private channel."}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
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
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder={isSignup ? "8 characters or more" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
            />

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
              {busy ? "…" : isSignup ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isSignup ? (
              <>
                Already on Vault?{" "}
                <Link to="/login" className="font-semibold text-foreground hover:text-brand">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link to="/signup" className="font-semibold text-foreground hover:text-brand">
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

function Field({ label, value, onChange, type = "text", placeholder, autoComplete }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />
    </label>
  );
}
