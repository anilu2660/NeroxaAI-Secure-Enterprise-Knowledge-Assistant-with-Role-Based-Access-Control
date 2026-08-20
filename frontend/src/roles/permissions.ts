import type { Permission, Role } from "@/auth/types";

/**
 * Role -> capability map for this build. It is the ONE place the prototype
 * decides what a role can do, so the session, the Account page, the permission
 * matrix, and the sidebar can never disagree.
 *
 * When the backend + JWT arrive, the token's claims replace this map; every
 * consumer keeps reading `Permission[]`.
 */
export const PERMISSIONS_BY_ROLE: Record<Role, Permission[]> = {
  // Uploading is an ADMIN-only capability in the NeroxaAI architecture.
  USER: ["documents:read", "assistant:query"],
  ADMIN: [
    "documents:read",
    "documents:upload",
    "assistant:query",
    "users:manage",
    "audit:read",
    "access:manage",
  ],
};

export function permissionsForRole(role: Role): Permission[] {
  return [...(PERMISSIONS_BY_ROLE[role] ?? PERMISSIONS_BY_ROLE["USER"])];
}

/** Display label shown under the user's name across the workspace. */
export function roleLabelFor(role: Role, department: string): string {
  const title = role === "ADMIN" ? "Administrator" : "Employee";
  return department ? `${department} · ${title}` : title;
}

/** Human-readable capability names used on the Account page. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "workspace:access": "Access authenticated workspace",
  "documents:read": "Browse and open permitted documents",
  "documents:upload": "Upload documents to the knowledge base",
  "documents:manage": "Manage document metadata and lifecycle",
  "assistant:query": "Ask the AI knowledge assistant",
  "users:manage": "Manage organizational users and roles",
  "audit:read": "Review audit and security events",
  "access:manage": "Review roles, permissions, and access scopes",
};
