import { createFileRoute } from "@tanstack/react-router";
import { ChatEmptyState } from "./chat";

export const Route = createFileRoute("/_authenticated/chat/")({
  component: ChatEmptyState,
});
