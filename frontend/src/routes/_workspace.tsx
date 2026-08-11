import { Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Navbar } from "@/shared/components/landing/Navbar";
import { WorkspaceBackground } from "@/shared/components/layout/WorkspaceBackground";

import { WorkspaceSidebar } from "@/shared/components/layout/WorkspaceSidebar";
import { useAuth } from "@/auth/auth-context";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});

/**
 * Client-side prototype gate. When real JWT auth arrives, swap the session
 * source in `useAuth` — this layout does not change.
 */
function WorkspaceLayout() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

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

  // Every authenticated surface shares ONE background treatment, defined once
  // in WorkspaceBackground (the Account page's original effect). No route may
  // introduce its own colors, glow, or grid.
  const isWorkspaceSurface =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/documents") ||
    pathname === "/users" ||
    pathname === "/audit" ||
    pathname === "/access" ||
    pathname === "/upload" ||
    pathname === "/dashboard" ||
    pathname === "/assistant" ||
    pathname === "/account";

  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      {isWorkspaceSurface && <WorkspaceBackground />}

      <div className="relative">
        <Navbar />
        <div className="mx-auto flex w-full max-w-[1400px] gap-5 px-5 pb-10 sm:px-8">
          <div className="hidden lg:block">
            <div className="sticky top-6">
              <WorkspaceSidebar />
            </div>
          </div>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
