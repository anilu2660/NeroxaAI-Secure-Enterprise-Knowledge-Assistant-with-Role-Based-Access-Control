import { Link } from "@tanstack/react-router";
import { ChevronRight, FolderCog, KeyRound, ScrollText, UploadCloud, Users } from "lucide-react";

/**
 * Administrative controls — the four ADMIN capabilities the dashboard links to.
 * Every entry routes through the existing authenticated route architecture.
 */
const controls = [
  {
    to: "/users",
    label: "User Management",
    description: "View, manage, and control user accounts, roles, and permissions",
    icon: Users,
  },
  {
    to: "/admin/documents",
    label: "Document Management",
    description: "Organize, review, and manage all organizational documents",
    icon: FolderCog,
  },
  {
    to: "/upload",
    label: "Upload Document",
    description: "Upload new documents to the knowledge repository",
    icon: UploadCloud,
  },
  {
    to: "/audit",
    label: "Audit Logs",
    description: "View system events, access logs, and administrative actions",
    icon: ScrollText,
  },
  {
    to: "/access",
    label: "Access Control",
    description: "Review roles, permissions, departments, and knowledge access scopes",
    icon: KeyRound,
  },
] as const;

export function AdminControlsPanel() {
  return (
    <section className="rounded-3xl border border-hairline bg-card/60 p-5 shadow-lg backdrop-blur-2xl transition-all hover:border-primary/30">
      <div className="pb-3 border-b border-hairline">
        <h2 className="font-display text-sm font-semibold tracking-tight text-foreground">
          Administrative Controls
        </h2>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Core administrative functions &amp; workspace governance
        </p>
      </div>

      <ul className="mt-3.5 space-y-2.5">
        {controls.map((control) => (
          <li key={control.to}>
            <Link
              to={control.to}
              className="group flex items-center gap-3.5 rounded-2xl border border-hairline bg-secondary/25 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-secondary/50 shadow-xs"
            >
              <span className="grid size-9.5 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-105">
                <control.icon className="size-4.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">
                  {control.label}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {control.description}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
