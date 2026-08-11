import type {
  AccessControlModel,
  AccessControlServiceStatus,
  AccessScopeDefinition,
  DepartmentDefinition,
  PermissionDefinition,
  RoleDefinition,
} from "@/api/types";

/**
 * Truthful state: there is no authorization service, database, or JWT claim
 * pipeline in the prototype, so no role or permission change can be persisted
 * or enforced. Role/permission *definitions* below mirror the existing
 * front-end Role and Permission model — they are the current source of truth,
 * not invented data.
 */
export const prototypeAccessControlStatus: AccessControlServiceStatus = {
  state: "not_connected",
  label: "Access control service not connected",
  detail:
    "Role and permission definitions shown here come from the application's current front-end model. Changes will be available when the authorization service is configured — nothing on this page currently enforces document access or knowledge retrieval.",
};

export const prototypePermissions: PermissionDefinition[] = [
  {
    key: "workspace:access",
    label: "User Workspace",
    description: "Sign in and use the authenticated workspace and account settings.",
    group: "Workspace",
    adminOnly: false,
  },
  {
    key: "assistant:query",
    label: "AI Assistant",
    description: "Ask questions and receive answers grounded in permitted knowledge.",
    group: "Knowledge",
    adminOnly: false,
  },
  {
    key: "documents:read",
    label: "Documents",
    description: "Browse and open documents allowed by role, department, and scope.",
    group: "Knowledge",
    adminOnly: false,
  },
  {
    key: "documents:upload",
    label: "Upload Document",
    description: "Add documents to the organizational knowledge base.",
    group: "Administration",
    adminOnly: true,
  },
  {
    key: "documents:manage",
    label: "Document Management",
    description: "Edit document metadata, access scope, and lifecycle status.",
    group: "Administration",
    adminOnly: true,
  },
  {
    key: "users:manage",
    label: "User Management",
    description: "Create users and assign role, department, and access scope.",
    group: "Administration",
    adminOnly: true,
  },
  {
    key: "audit:read",
    label: "Audit Logs",
    description: "Review administrative, access, document, and security events.",
    group: "Administration",
    adminOnly: true,
  },
  {
    key: "access:manage",
    label: "Access Control",
    description: "Review and eventually manage roles, permissions, and access scopes.",
    group: "Administration",
    adminOnly: true,
  },
];

export const prototypeAccessScopes: AccessScopeDefinition[] = [
  {
    key: "general",
    label: "General",
    description: "Organization-wide knowledge any authenticated member may retrieve.",
    roles: ["USER", "ADMIN"],
    departmentBound: false,
  },
  {
    key: "department",
    label: "Department",
    description: "Knowledge limited to a member's own department, such as Engineering or Finance.",
    roles: ["USER", "ADMIN"],
    departmentBound: true,
  },
  {
    key: "restricted",
    label: "Restricted",
    description:
      "Sensitive knowledge reserved for explicitly authorized members and administrators.",
    roles: ["ADMIN"],
    departmentBound: false,
  },
];

export const prototypeDepartments: DepartmentDefinition[] = [
  { key: "engineering", label: "Engineering", description: "Product and platform teams." },
  { key: "finance", label: "Finance", description: "Financial operations and reporting." },
  { key: "hr", label: "HR", description: "People operations and policy." },
  { key: "sales", label: "Sales", description: "Revenue and customer-facing teams." },
  { key: "it_security", label: "IT/Security", description: "Administration and security." },
];

/**
 * Mirrors the permission sets in `src/lib/auth/mock-auth-adapter.ts`.
 * `assignedUsers: null` because no directory service can be queried yet.
 */
export const prototypeRoles: RoleDefinition[] = [
  {
    key: "USER",
    label: "User",
    description:
      "Standard organizational member. Uses the workspace and retrieves knowledge permitted by their department and the access scope of each document.",
    permissions: ["workspace:access", "assistant:query", "documents:read"],
    accessScopes: ["general", "department"],
    departmentExamples: ["Engineering", "Finance", "HR", "Sales"],
    assignedUsers: null,
    editable: false,
  },
  {
    key: "ADMIN",
    label: "Administrator",
    description:
      "Manages users, documents, uploads, audit review, and access control in addition to all standard workspace capabilities.",
    permissions: [
      "workspace:access",
      "assistant:query",
      "documents:read",
      "documents:upload",
      "documents:manage",
      "users:manage",
      "audit:read",
      "access:manage",
    ],
    accessScopes: ["general", "department", "restricted"],
    departmentExamples: ["IT/Security"],
    assignedUsers: null,
    editable: false,
  },
];

export const prototypeResolutionChain = [
  "User",
  "Role",
  "Department",
  "Permissions",
  "Access Scope",
  "Document Access",
  "RBAC-Filtered Retrieval",
];

export const prototypeAccessControlModel: AccessControlModel = {
  status: prototypeAccessControlStatus,
  roles: prototypeRoles,
  permissions: prototypePermissions,
  accessScopes: prototypeAccessScopes,
  departments: prototypeDepartments,
  resolutionChain: prototypeResolutionChain,
  mutationsPersisted: false,
};
