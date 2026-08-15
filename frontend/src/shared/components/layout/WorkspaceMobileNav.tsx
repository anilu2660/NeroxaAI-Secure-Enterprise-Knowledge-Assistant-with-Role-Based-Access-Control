import { Link } from "@tanstack/react-router";
import { getVisibleNavigation } from "@/shared/navigation/workspace-navigation";
import { useAuth } from "@/auth/auth-context";

export function WorkspaceMobileNav() {
  const { can } = useAuth();
  const items = getVisibleNavigation(can).filter((item) => item.section === "workspace").slice(0, 4);

  return (
    <nav aria-label="Mobile workspace navigation" className="fixed inset-x-3 bottom-3 z-50 flex items-center justify-around rounded-2xl border border-hairline bg-card/90 p-1.5 shadow-menu backdrop-blur-xl lg:hidden">
      {items.map((item) => (
        <Link key={item.to} to={item.to} activeProps={{ className: "bg-accent text-foreground" }} inactiveProps={{ className: "text-muted-foreground" }} className="flex min-w-16 flex-col items-center gap-1 rounded-xl px-2.5 py-2 text-[9px] transition-colors">
          <item.icon className="size-4" />
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
