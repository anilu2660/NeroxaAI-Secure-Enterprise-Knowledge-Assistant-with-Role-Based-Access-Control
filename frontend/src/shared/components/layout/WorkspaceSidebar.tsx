import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  FolderCog,
  KeyRound,
  LayoutGrid,
  LogOut,
  ScrollText,
  Sparkles,
  UploadCloud,
  Users,
} from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";

const userNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/documents", label: "Documents", icon: FileText },
] as const;

// Upload is ADMIN-only: it is reached from the Admin Console, never the USER nav.
const adminNavItems = [
  { to: "/admin", label: "Admin Dashboard", icon: LayoutGrid },
  { to: "/users", label: "User Management", icon: Users },
  { to: "/admin/documents", label: "Document Management", icon: FolderCog },
  { to: "/upload", label: "Upload Document", icon: UploadCloud },
  { to: "/audit", label: "Audit Logs", icon: ScrollText },
  { to: "/access", label: "Access Control", icon: KeyRound },
] as const;

export function WorkspaceSidebar() {
  const { session, signOut } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  // Identity is the administered user record; the session only says who it is.
  const identity = profile ?? session?.user ?? null;
  const isAdmin = identity?.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <aside className="flex w-[204px] shrink-0 flex-col rounded-2xl border border-hairline bg-card/70 p-2.5 shadow-menu backdrop-blur-xl">
      {isAdmin ? (
        <p className="px-2.5 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-primary">
          Admin Console
        </p>
      ) : null}
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{ className: "bg-accent text-foreground" }}
            inactiveProps={{ className: "text-foreground/80 hover:bg-accent/60" }}
            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-[13px] transition-colors"
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-5">
        <div className="h-px bg-hairline" />
        <Link
          to="/account"
          className="mt-3 flex items-center gap-2.5 rounded-xl px-1 py-2 transition-colors hover:bg-accent/50"
        >
          {identity?.avatarUrl ? (
            <img
              src={identity.avatarUrl}
              alt={identity.name}
              className="size-7 shrink-0 rounded-full border border-primary/40 object-cover"
            />
          ) : (
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[12px] font-medium text-foreground">
              {identity?.name.slice(0, 1).toUpperCase() ?? ""}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-[12.5px] text-foreground">
              {identity?.name ?? ""}
            </span>
            <span className="block truncate text-[10.5px] text-muted-foreground">
              {identity?.roleLabel ?? ""}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1.5 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-foreground/85 transition-colors hover:bg-accent/60"
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
