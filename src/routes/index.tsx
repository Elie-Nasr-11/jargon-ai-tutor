import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const user = window.localStorage.getItem("jargon_user");
      throw redirect({ to: user ? "/chat" : "/login" });
    }
    throw redirect({ to: "/login" });
  },
  component: () => null,
});
