import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your identity — Vault" },
      {
        name: "description",
        content: "Create a Vault account in seconds. Your keys, your identity.",
      },
    ],
  }),
  component: () => <AuthForm mode="signup" />,
});
