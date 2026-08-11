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
    <section className="rounded-2xl border border-hairline bg-card/60 p-4 backdrop-blur-xl">
      <h2 className="font-display text-[15px] font-medium tracking-tight text-foreground">
        Administrative Controls
      </h2>
      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
        Core administrative functions and governance
      </p>

      <ul className="mt-3 space-y-2">
        {controls.map((control) => (
          <li key={control.to}>
            <Link
              to={control.to}
              className="group flex items-start gap-3 rounded-xl border border-hairline bg-secondary/25 px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-hairline bg-card/70 text-primary">
                <control.icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] text-foreground">{control.label}</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                  {control.description}
                </span>
              </span>
              <ChevronRight className="mt-1.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
