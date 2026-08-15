import { Outlet, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { WorkspaceShell } from "@/shared/components/layout/WorkspaceShell";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "unauthenticated") navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  if (status !== "authenticated") {
    return (
      <div className="grid min-h-svh place-items-center bg-background">
        <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
          <span className="size-3.5 animate-spin rounded-full border border-border border-t-primary" />
          Restoring your workspace session…
        </div>
      </div>
    );
  }

  return (
    <WorkspaceShell>
      <Outlet />
    </WorkspaceShell>
  );
}
