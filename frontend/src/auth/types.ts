/**
 * Auth domain contracts. These shapes are intentionally backend-agnostic:
 * the mock provider and a future JWT/FastAPI provider both satisfy them.
 */

export type Role = "USER" | "ADMIN";

export type Permission =
  | "documents:read"
  | "documents:upload"
  | "assistant:query"
  | "users:manage"
  | "audit:read"
  | "access:manage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  /** Display label shown under the user's name, e.g. "Engineering · Employee". */
  roleLabel: string;
  avatarUrl?: string;
}

export interface Session {
  user: AuthUser;
  permissions: Permission[];
  /** Real JWT once the backend is connected. Empty in the prototype. */
  accessToken: string;
  expiresAt: number | null;
}

export interface Credentials {
  email: string;
  password: string;
  name?: string;
  /**
   * PROTOTYPE ONLY: lets the login page demonstrate the USER and ADMIN
   * branches while no backend exists. Remove this field once the real
   * JWT/FastAPI response supplies the authoritative role.
   */
  prototypeRole?: Role;
}

/**
 * Swap the implementation (mock -> JWT/FastAPI) without touching the UI.
 */
export interface AuthProviderAdapter {
  restore(): Promise<Session | null>;
  signIn(credentials: Credentials): Promise<Session>;
  signUp(credentials: Credentials): Promise<Session>;
  signOut(): Promise<void>;
}

export const ROLE_HOME: Record<string, string> = {
  USER: "/dashboard",
  ADMIN: "/admin",
  user: "/dashboard",
  admin: "/admin",
  employee: "/dashboard",
};
