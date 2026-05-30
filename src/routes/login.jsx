import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Vault" },
      { name: "description", content: "Sign in to your private Vault channel." },
    ],
  }),
  component: () => <AuthForm mode="login" />,
});
