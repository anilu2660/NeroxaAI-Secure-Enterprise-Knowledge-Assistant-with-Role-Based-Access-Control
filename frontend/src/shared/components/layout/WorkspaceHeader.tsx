import { Bell } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assistant": "AI Assistant",
  "/documents": "Documents",
  "/upload": "Upload Document",
  "/users": "User Management",
  "/audit": "Audit Logs",
  "/access": "Access Control",
  "/account": "Account",
  "/admin": "Admin Dashboard",
  "/admin/documents": "Document Management",
};

export function WorkspaceHeader() {
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const identity = profile ?? session?.user ?? null;
  const initials = identity?.name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() ?? "N";
  const pageLabel = PAGE_LABELS[pathname] ?? "Workspace";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2 lg:hidden">
            <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">N</span>
            <span className="font-display text-sm font-semibold tracking-tight">NeroxaAI</span>
          </Link>
          <span className="hidden h-4 w-px bg-hairline lg:block" />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium text-foreground">{pageLabel}</p>
            <p className="hidden truncate text-[10px] text-muted-foreground sm:block">Secure enterprise knowledge workspace</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Link to="/account" className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8 border border-hairline">
              <AvatarImage src={identity?.avatarUrl} alt={identity?.name ?? "Account"} />
              <AvatarFallback className="bg-secondary text-[10px] font-medium">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
