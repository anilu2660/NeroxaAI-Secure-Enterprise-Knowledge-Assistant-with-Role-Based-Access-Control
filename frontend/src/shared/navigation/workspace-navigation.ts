import type { ComponentType } from "react";
import { FileText, FolderCog, KeyRound, LayoutDashboard, ScrollText, Sparkles, UploadCloud, Users } from "lucide-react";
import type { Permission } from "@/auth/types";

export type WorkspaceNavItem = {
  to:
    | "/dashboard"
    | "/assistant"
    | "/documents"
    | "/admin"
    | "/users"
    | "/admin/documents"
    | "/upload"
    | "/audit"
    | "/access";
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: Permission;
  section: "workspace" | "administration";
};

export const workspaceNavigation: WorkspaceNavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, section: "workspace" },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles, permission: "assistant:query", section: "workspace" },
  { to: "/documents", label: "Documents", icon: FileText, permission: "documents:read", section: "workspace" },
  { to: "/access", label: "Access Control", icon: KeyRound, permission: "access:manage", section: "workspace" },
  { to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, permission: "users:manage", section: "administration" },
  { to: "/users", label: "User Management", icon: Users, permission: "users:manage", section: "administration" },
  { to: "/admin/documents", label: "Document Management", icon: FolderCog, permission: "documents:upload", section: "administration" },
  { to: "/upload", label: "Upload Document", icon: UploadCloud, permission: "documents:upload", section: "administration" },
  { to: "/audit", label: "Audit Logs", icon: ScrollText, permission: "audit:read", section: "administration" },
];

export function getVisibleNavigation(can: (permission: Permission) => boolean): WorkspaceNavItem[] {
  return workspaceNavigation.filter((item) => !item.permission || can(item.permission));
}
