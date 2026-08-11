import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import type { Permission, Role } from "@/auth/types";
import { Button } from "@/shared/components/ui/button";

/**
 * Single role/permission gate for authenticated surfaces.
 * Automatically grants access to ADMIN role and renders an inline Access Restricted panel
 * for unauthorized users without crashing the router.
 */
export function RoleGuard({
  role,
  permission,
  children,
}: {
  role?: Role;
  permission?: Permission;
  children: ReactNode;
}) {
  const { status, session, can } = useAuth();

  if (status !== "authenticated" || !session) {
    return (
      <div className="grid min-h-[60svh] place-items-center">
        <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
          <span className="size-3.5 animate-spin rounded-full border border-border border-t-primary" />
          Checking your access…
        </div>
      </div>
    );
  }

  const userRoleUpper = session.user.role?.toUpperCase();
  const isAdmin = userRoleUpper === "ADMIN" || session.permissions.includes("users:manage");

  const roleOk = !role || userRoleUpper === role.toUpperCase() || isAdmin;
  const permissionOk = !permission || can(permission) || isAdmin;

  if (!roleOk || !permissionOk) {
    return (
      <div className="flex min-h-[50svh] flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 shadow-xl backdrop-blur-xl">
          <ShieldAlert className="mx-auto size-12 text-destructive" />
          <h2 className="font-display text-xl font-semibold text-foreground">Access Restricted</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You require Administrator privileges to view or manage organizational roles &amp; permissions.
          </p>
          <Button onClick={() => (window.location.href = "/dashboard")} className="mt-2">
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
