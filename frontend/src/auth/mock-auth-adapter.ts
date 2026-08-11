import type { AuthProviderAdapter, AuthUser, Credentials, Role, Session } from "./types";
import { permissionsForRole, roleLabelFor } from "@/roles/permissions";
import {
  PROTOTYPE_ORGANIZATION,
  defaultAccessScope,
  findDirectoryUserByEmail,
  registerDirectoryUser,
} from "@/users/mock/users-directory";

const STORAGE_KEY = "neroxa.session";

function roleFor(email: string): Role {
  return /admin/i.test(email) ? "ADMIN" : "USER";
}

/** Derive a display name from the email local part — never a hardcoded person. */
function nameFromEmail(email: string): string {
  const local = email.trim().split("@")[0] ?? "";
  const words = local
    .split(/[._\-+\d]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));
  return words.join(" ") || "Workspace User";
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Resolves the signed-in identity from the user directory that Admin -> User
 * Management owns. An existing administered record ALWAYS wins: role,
 * department, and name come from what the admin assigned. An unknown email is
 * registered as a new directory record, so the account is administrable and
 * the Account page reads the same record as everyone else.
 */
function userFor(email: string, name?: string, prototypeRole?: Role): AuthUser {
  const existing = findDirectoryUserByEmail(email);
  if (existing) {
    return {
      id: existing.id,
      name: existing.name,
      email: existing.email,
      role: existing.role,
      department: existing.department,
      roleLabel: roleLabelFor(existing.role, existing.department),
    };
  }

  // PROTOTYPE ONLY: an explicit role selection from the login page decides the
  // role for a brand-new account. Delete this when the backend returns it.
  const role = prototypeRole ?? roleFor(email);
  const department = role === "ADMIN" ? "IT/Security" : "Engineering";
  const displayName = name?.trim() || nameFromEmail(email);
  const record = registerDirectoryUser({
    id: `usr_${slug(email) || slug(displayName) || "anon"}`,
    name: displayName,
    email: email.trim(),
    role,
    department,
    organization: PROTOTYPE_ORGANIZATION,
    accessScope: defaultAccessScope(role, department),
  });

  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    department: record.department,
    roleLabel: roleLabelFor(record.role, record.department),
  };
}

function persist(session: Session) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — session stays in memory */
  }
}

function sessionFor(user: AuthUser): Session {
  return {
    user,
    permissions: permissionsForRole(user.role),
    accessToken: "",
    expiresAt: null,
  };
}

/**
 * Prototype-only adapter: no network calls, no real tokens.
 * Replace with a JWT adapter that calls the FastAPI backend later.
 */
export const mockAuthAdapter: AuthProviderAdapter = {
  async restore() {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as Session;
      // Re-resolve against the directory so admin edits (role, department,
      // name) apply to the live session without a fresh sign-in.
      const user = userFor(stored.user.email, stored.user.name);
      return sessionFor(user);
    } catch {
      return null;
    }
  },

  async signIn({ email, prototypeRole }: Credentials) {
    const session = sessionFor(userFor(email, undefined, prototypeRole));
    persist(session);
    return session;
  },

  async signUp({ email, name, prototypeRole }: Credentials) {
    const session = sessionFor(userFor(email, name, prototypeRole));
    persist(session);
    return session;
  },

  async signOut() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  },
};
