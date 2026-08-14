import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import { getVisibleNavigation } from "@/shared/navigation/workspace-navigation";

export function WorkspaceSidebar() {
  const { session, signOut, can } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const identity = profile ?? session?.user ?? null;
  const navigation = getVisibleNavigation(can);
  const workspaceItems = navigation.filter((item) => item.section === "workspace");
  const adminItems = navigation.filter((item) => item.section === "administration");

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="flex min-h-[calc(100vh-6.5rem)] w-[224px] shrink-0 flex-col rounded-2xl border border-hairline bg-card/70 p-2.5 shadow-menu backdrop-blur-xl">
      <div className="mb-3 flex items-center gap-2.5 px-2.5 py-1.5">
        <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-sm">N</span>
        <div className="min-w-0">
          <p className="font-display text-[13px] font-semibold tracking-tight text-foreground">NeroxaAI</p>
          <p className="truncate text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">Knowledge workspace</p>
        </div>
      </div>

      <nav aria-label="Workspace navigation" className="space-y-4">
        <NavSection label="Workspace" items={workspaceItems} />
        {adminItems.length > 0 ? <NavSection label="Administration" items={adminItems} /> : null}
      </nav>

      <div className="mt-auto pt-5">
        <div className="h-px bg-hairline" />
        <Link to="/account" className="mt-3 flex items-center gap-2.5 rounded-xl px-1.5 py-2.5 transition-colors hover:bg-accent/50">
          {identity?.avatarUrl ? (
            <img src={identity.avatarUrl} alt={identity.name} className="size-8 shrink-0 rounded-full border border-primary/40 object-cover" />
          ) : (
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-medium text-foreground">
              {identity?.name.slice(0, 1).toUpperCase() ?? ""}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[12px] text-foreground">{identity?.name ?? ""}</span>
            <span className="block truncate text-[10px] text-muted-foreground">{identity?.roleLabel ?? ""}</span>
          </span>
        </Link>
        <button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground">
          <LogOut className="size-3.5 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function NavSection({ label, items }: { label: string; items: ReturnType<typeof getVisibleNavigation> }) {
  if (items.length === 0) return null;

  return (
    <section>
      <p className="px-2.5 pb-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link key={item.to} to={item.to} activeProps={{ className: "bg-accent text-foreground shadow-sm" }} inactiveProps={{ className: "text-foreground/75 hover:bg-accent/60 hover:text-foreground" }} className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[12.5px] transition-colors">
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
