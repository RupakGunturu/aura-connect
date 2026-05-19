import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, MessageCircle, Shield, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vault — Private messaging in a sealed glass envelope" },
      {
        name: "description",
        content:
          "A privacy-first communication platform. Real-time 1:1 chat, presence, typing indicators, and an encryption-first architecture.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-brand/30">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-border bg-background/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-brand/15 ring-1 ring-brand/40">
              <div className="size-3 rounded-full bg-brand" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Vault</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#privacy" className="text-sm font-medium text-muted-foreground hover:text-foreground">Privacy</a>
            <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">Features</a>
            <a href="#security" className="text-sm font-medium text-muted-foreground hover:text-foreground">Security</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              Get Access
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-24">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-3 py-1">
            <span className="flex size-2 animate-pulse rounded-full bg-brand" />
            <span className="text-xs font-medium tracking-wide text-muted-foreground">
              V1.0 is now live
            </span>
          </div>
          <h1 className="mx-auto max-w-[20ch] text-balance text-4xl font-semibold leading-tight md:text-6xl">
            Your messages belong in a sealed glass envelope.
          </h1>
          <p className="mx-auto mt-8 max-w-[56ch] text-pretty text-lg text-muted-foreground">
            Vault is a communication platform designed for privacy first. No
            metadata harvesting, no unencrypted storage — just pure connection.
          </p>
          <div className="mt-10 flex items-center justify-center gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              Create your identity
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-border bg-card/30 px-6 py-3 text-sm font-medium hover:bg-card/60"
            >
              I have an account
            </Link>
          </div>
        </section>

        {/* Workspace mockup */}
        <section className="mx-auto mt-20 max-w-6xl px-6">
          <div className="glass-card relative aspect-[16/10] overflow-hidden rounded-3xl ring-1 ring-border shadow-2xl">
            <div className="absolute inset-y-0 left-0 flex">
              <div className="flex w-16 flex-col items-center gap-6 border-r border-border py-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/40">
                  <div className="size-4 rounded-sm bg-brand" />
                </div>
                <div className="size-10 rounded-xl bg-muted/40" />
                <div className="size-10 rounded-xl bg-muted/40" />
              </div>
              <div className="hidden w-72 flex-col border-r border-border bg-background/30 md:flex">
                <div className="p-6">
                  <h3 className="text-sm font-semibold">Conversations</h3>
                </div>
                <div className="flex-1 space-y-1 px-3">
                  {[
                    { name: "Elena Vance", preview: "The audit is complete.", time: "2m", active: true, online: true },
                    { name: "Marcus Thorne", preview: "Shared a file with you", time: "1h", active: false, online: false },
                    { name: "Priya Rao", preview: "Let's sync tomorrow", time: "Yest", active: false, online: true },
                  ].map((c) => (
                    <div
                      key={c.name}
                      className={`flex items-center gap-3 rounded-lg p-3 ${
                        c.active ? "bg-card/60 ring-1 ring-border" : ""
                      }`}
                    >
                      <div className="relative size-10 shrink-0 rounded-full bg-muted/60" />
                      {c.online && (
                        <span className="absolute ml-7 mt-7 size-2.5 rounded-full border-2 border-background bg-brand" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{c.preview}</p>
                      </div>
                      <span className="ml-auto text-[10px] text-muted-foreground">{c.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute inset-y-0 left-16 right-0 flex flex-col md:left-[352px]">
              <div className="flex h-16 items-center justify-between border-b border-border px-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Elena Vance</span>
                  <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand">
                    End-to-End Encrypted
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <div className="mx-auto max-w-2xl space-y-6">
                  <div className="flex justify-center">
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                      Today
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-8 shrink-0 rounded-full bg-muted/60" />
                    <div className="bubble-them rounded-2xl rounded-tl-none px-4 py-2.5">
                      <p className="text-sm">
                        I've just finalized the architectural overview for the private cloud transition.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row-reverse items-start gap-3">
                    <div className="bubble-me rounded-2xl rounded-tr-none px-4 py-2.5 ring-1 ring-brand/15">
                      <p className="text-sm">Looks solid. Verifying hash signatures now.</p>
                      <div className="mt-1 flex justify-end">
                        <span className="text-[10px] text-brand/80">12:44 PM</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="size-8 shrink-0 rounded-full bg-muted/60" />
                    <div className="bubble-them rounded-2xl rounded-tl-none px-4 py-2.5">
                      <div className="flex gap-1 py-1.5">
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto mt-32 max-w-6xl px-6">
          <h2 className="mx-auto max-w-[20ch] text-balance text-center text-3xl font-semibold md:text-4xl">
            Communication tools that respect you.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "Encryption-first",
                body: "TLS in transit, encrypted at rest. Passwords hashed with bcrypt — never stored in plain text.",
              },
              {
                icon: MessageCircle,
                title: "Real-time presence",
                body: "Typing indicators, read receipts, online/offline — all delivered over Socket.io.",
              },
              {
                icon: Shield,
                title: "Minimal metadata",
                body: "We don't track who you talk to, when, or from where. Only what's necessary to deliver a message.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="glass-card rounded-2xl border border-border p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand/15 ring-1 ring-brand/30">
                  <f.icon className="size-5 text-brand" />
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Security */}
        <section id="security" className="mx-auto mt-32 max-w-4xl px-6 text-center">
          <Zap className="mx-auto size-6 text-brand" />
          <h2 className="mt-4 text-balance text-3xl font-semibold md:text-4xl">
            Built for small private communities.
          </h2>
          <p className="mx-auto mt-6 max-w-[60ch] text-pretty text-muted-foreground">
            Vault runs on a stack you can audit: React on the frontend, Node + Express + Socket.io on the backend, MongoDB Atlas with at-rest encryption for storage. JWT auth. Rate-limited APIs. Helmet-hardened headers.
          </p>
          <div className="mt-10">
            <Link
              to="/signup"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground transition-transform hover:scale-[1.02]"
            >
              Start your first conversation
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-background py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded bg-brand/15 ring-1 ring-brand/30" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vault Protocol · 2026
            </span>
          </div>
          <div className="flex gap-6 text-xs font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Manifesto</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
