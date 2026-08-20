import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  FolderCog,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  ScrollText,
  Shield,
  Sparkles,
  UploadCloud,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { getVisibleNavigation } from "@/shared/navigation/workspace-navigation";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";

export function WorkspaceMobileNav() {
  const { can, signOut } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const allVisible = getVisibleNavigation(can);
  const workspaceItems = allVisible.filter((item) => item.section === "workspace");
  const adminItems = allVisible.filter((item) => item.section === "administration");

  // Primary bottom bar tabs (Dashboard, Assistant, Documents, Upload or Access)
  const bottomTabs = [
    { to: "/dashboard" as const, label: "Home", icon: LayoutDashboard },
    ...(can("assistant:query")
      ? [{ to: "/assistant" as const, label: "Assistant", icon: Sparkles, isPrimary: true }]
      : []),
    ...(can("documents:read")
      ? [{ to: "/documents" as const, label: "Docs", icon: allVisible.find((i) => i.to === "/documents")?.icon || LayoutDashboard }]
      : []),
    ...(can("documents:upload")
      ? [{ to: "/upload" as const, label: "Upload", icon: UploadCloud }]
      : can("access:manage")
        ? [{ to: "/access" as const, label: "Access", icon: KeyRound }]
        : []),
  ].slice(0, 4);

  const handleLogout = async () => {
    setDrawerOpen(false);
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <>
      {/* Slide-Up Mobile Navigation Drawer Modal */}
      {drawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="All workspace pages"
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in-50 duration-200"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="grid size-8 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Shield className="size-4.5" />
                </div>
                <div>
                  <h3 className="font-display text-[14px] font-bold text-foreground">
                    Workspace Navigation
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {profile?.roleLabel ?? "Enterprise Workspace"} · {profile?.department ?? ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="grid size-8 place-items-center rounded-lg border border-border bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Workspace Section */}
            <div className="space-y-1.5">
              <span className="block text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-1">
                Workspace
              </span>
              <div className="grid grid-cols-2 gap-2">
                {workspaceItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-2 rounded-xl p-2.5 text-[12.5px] font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "border border-border bg-secondary/30 text-foreground hover:bg-secondary"
                      }`}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Administration Section */}
            {adminItems.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10.5px] font-mono font-bold uppercase tracking-wider text-muted-foreground px-1">
                  Administration
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {adminItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={() => setDrawerOpen(false)}
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-[12.5px] font-medium transition-colors ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                            : "border border-border bg-secondary/30 text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* User & Settings Footer */}
            <div className="border-t border-border pt-3 space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12px] font-medium text-foreground">Appearance Theme</span>
                <ThemeToggle />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/account"
                  onClick={() => setDrawerOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/30 py-2.5 text-[12.5px] font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <UserCircle2 className="size-4 text-primary" />
                  Your Profile
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 py-2.5 text-[12.5px] font-medium text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Nav Bar on Mobile */}
      <nav
        aria-label="Mobile workspace navigation"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl border border-border/80 bg-card/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl lg:hidden"
      >
        {bottomTabs.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex min-w-[58px] flex-col items-center gap-0.5 rounded-xl py-1.5 px-2 text-[10px] font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              }`}
            >
              <Icon className={`size-4 ${item.isPrimary && !isActive ? "text-primary animate-pulse" : ""}`} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}

        {/* More Drawer Trigger */}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={`flex min-w-[58px] flex-col items-center gap-0.5 rounded-xl py-1.5 px-2 text-[10px] font-medium transition-all cursor-pointer ${
            drawerOpen
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground active:scale-95"
          }`}
        >
          <Menu className="size-4" />
          <span>Menu</span>
        </button>
      </nav>
    </>
  );
}
