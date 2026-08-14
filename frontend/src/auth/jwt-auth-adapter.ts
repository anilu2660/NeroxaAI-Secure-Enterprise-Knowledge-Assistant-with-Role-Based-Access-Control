import type { AuthProviderAdapter, AuthUser, Credentials, Role, Session } from "./types";
import { permissionsForRole, roleLabelFor } from "@/roles/permissions";

const TOKEN_KEY = "neroxa.token";
const SESSION_KEY = "neroxa.session";

interface BackendTokenResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  role: string;
  department: string;
}

interface BackendUserAuthInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  is_active: boolean;
  created_at: string;
}

function normalizeRole(backendRole: string): Role {
  return backendRole?.toLowerCase() === "admin" ? "ADMIN" : "USER";
}

function parseApiError(data: any, defaultMsg: string): string {
  if (!data) return defaultMsg;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) {
    const first = data.detail[0];
    return first?.msg ? `${first.msg}` : defaultMsg;
  }
  if (data.message) return data.message;
  return defaultMsg;
}

function createSession(userAuth: BackendUserAuthInfo, accessToken = ""): Session {
  const role = normalizeRole(userAuth.role);
  const user: AuthUser = {
    id: userAuth.id,
    name: userAuth.full_name || userAuth.email.split("@")[0] || "User",
    email: userAuth.email,
    role,
    department: userAuth.department || "General",
    roleLabel: roleLabelFor(role, userAuth.department || "General"),
  };

  return {
    user,
    permissions: permissionsForRole(role),
    accessToken,
    expiresAt: null,
  };
}

function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistSession(session: Session, token?: string) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    return;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    return;
  }
}

async function fetchCurrentUser(token?: string): Promise<Session | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch("/api/v1/auth/me", {
      headers,
      credentials: "include",
    });

    if (!response.ok) return null;

    const userData: BackendUserAuthInfo = await response.json();
    return createSession(userData, token || "");
  } catch {
    return null;
  }
}

export const jwtAuthAdapter: AuthProviderAdapter = {
  async restore(): Promise<Session | null> {
    const session = await fetchCurrentUser(getStoredToken() || undefined);
    if (session) {
      persistSession(session, getStoredToken() || undefined);
      return session;
    }

    clearSession();
    return null;
  },

  async signIn({ email, password }: Credentials): Promise<Session> {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(parseApiError(data, "Invalid email or password."));
    }

    const tokenResponse: BackendTokenResponse = data;
    const session = await fetchCurrentUser(tokenResponse.access_token);

    if (!session) {
      throw new Error("Authentication succeeded, but the user session could not be established.");
    }

    persistSession(session, tokenResponse.access_token);
    return session;
  },

  async signUp({ email, password, name }: Credentials): Promise<Session> {
    const registerResponse = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email: email.trim(),
        password,
        full_name: name?.trim() || email.split("@")[0] || "User",
        department: "General",
      }),
    });

    const regData = await registerResponse.json().catch(() => null);

    if (!registerResponse.ok) {
      throw new Error(parseApiError(regData, "Registration failed. Please try again."));
    }

    return this.signIn({ email, password });
  },

  async signOut(): Promise<void> {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      clearSession();
    }
  },
};

export async function setSessionFromToken(token: string): Promise<Session> {
  const session = await fetchCurrentUser(token);
  if (!session) throw new Error("Failed to authenticate token.");
  persistSession(session, token);
  return session;
}
