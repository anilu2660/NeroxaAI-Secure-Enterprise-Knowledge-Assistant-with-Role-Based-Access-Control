import type { ManagedUser, ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import { prototypeManagedUsers } from "./users-mock";

/**
 * PROTOTYPE USER DIRECTORY — the single source of truth for every user record
 * in this build. Admin -> User Management writes here, and the authenticated
 * session, sidebar profile, Your Access panel, and Account page all read the
 * same record back through `@/api/workspace-service`.
 *
 * There is no identity service, database, or directory sync in this codebase:
 * records live in this browser only and nothing enforces them server-side.
 * When the real backend + JWT arrive, replace the read/write helpers below
 * with API calls — the shape (`ManagedUser`) and every consumer stay the same.
 */

const STORAGE_KEY = "neroxa.users.directory";

export const PROTOTYPE_ORGANIZATION = "NeroxaAI";

function seed(): ManagedUser[] {
  return [];
}

let directory: ManagedUser[] | null = null;

function load(): ManagedUser[] {
  return [];
}

function save(next: ManagedUser[]) {
  directory = next;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the directory stays in memory for this page */
  }
}

export function listDirectory(): ManagedUser[] {
  return load();
}

export function setDirectory(next: ManagedUser[]) {
  save(next);
}

export function findDirectoryUserById(userId: string): ManagedUser | null {
  return load().find((user) => user.id === userId) ?? null;
}

export function findDirectoryUserByEmail(email: string): ManagedUser | null {
  const needle = email.trim().toLowerCase();
  if (!needle) return null;
  return load().find((user) => user.email.trim().toLowerCase() === needle) ?? null;
}

/** Default knowledge scope for a newly seen account, based on its department. */
export function defaultAccessScope(role: Role, department: string): string[] {
  if (role === "ADMIN") return ["All Knowledge"];
  const label = `${department} Knowledge`;
  return department ? [label, "General Knowledge"] : ["General Knowledge"];
}

/**
 * Registers an account that signed in but has no directory record yet, so the
 * admin surface and the Account page immediately agree on one record.
 */
export function registerDirectoryUser(input: {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status?: ManagedUserStatus;
  organization?: string;
  accessScope?: string[];
}): ManagedUser {
  const user: ManagedUser = {
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    department: input.department,
    organization: input.organization ?? PROTOTYPE_ORGANIZATION,
    accessScope: input.accessScope ?? defaultAccessScope(input.role, input.department),
    status: input.status ?? "active",
    lastSignInLabel: null,
    prototype: true,
  };
  save([user, ...load().filter((entry) => entry.id !== user.id)]);
  return user;
}
