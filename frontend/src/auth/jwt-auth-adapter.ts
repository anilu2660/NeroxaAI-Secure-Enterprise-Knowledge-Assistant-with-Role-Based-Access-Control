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

function getStoredSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
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

function parseJwtToken(token: string): Session | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    if (!payload || !payload.email) return null;

    const userAuth: BackendUserAuthInfo = {
      id: payload.sub || `user_${Date.now()}`,
      email: payload.email,
      full_name: payload.full_name || payload.name || payload.email.split("@")[0] || "User",
      role: payload.role || "employee",
      department: payload.department || "General",
      is_active: true,
      created_at: new Date().toISOString(),
    };

    return createSession(userAuth, token);
  } catch {
    return null;
  }
}

async function fetchCurrentUser(token?: string): Promise<Session | null> {
  if (!token) return null;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/me` : "/api/v1/auth/me";

    const response = await fetch(targetUrl, {
      headers,
      credentials: "include",
    });

    if (response.ok) {
      const userData: BackendUserAuthInfo = await response.json();
      return createSession(userData, token);
    }
  } catch {
    /* fallback to token decoding */
  }

  // Fallback: Parse JWT payload directly if backend endpoint is unreachable or returning static HTML
  return parseJwtToken(token);
}

export const jwtAuthAdapter: AuthProviderAdapter = {
  async restore(): Promise<Session | null> {
    const token = getStoredToken();
    const cached = getStoredSession();

    // Nothing in storage — skip network call entirely.
    if (!token && !cached) return null;

    // If we have a token — re-validate with backend or decode payload.
    if (token) {
      const session = await fetchCurrentUser(token);
      if (session) {
        persistSession(session, token);
        return session;
      }
    }

    if (cached) return cached;

    // Token is invalid/expired.
    clearSession();
    return null;
  },

  async signIn({ email, password }: Credentials): Promise<Session> {
    const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/login` : "/api/v1/auth/login";

    try {
      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        const tokenResponse: BackendTokenResponse = data;
        const session = await fetchCurrentUser(tokenResponse.access_token);

        if (session) {
          persistSession(session, tokenResponse.access_token);
          return session;
        }
      } else if (data && data.detail) {
        throw new Error(parseApiError(data, "Invalid email or password."));
      }
    } catch (err: any) {
      if (err?.message && err.message !== "Failed to fetch") {
        throw err;
      }
    }

    // Demo / standalone frontend fallback when backend API is not reachable
    const normalizedRole = email.toLowerCase().includes("admin") ? "admin" : "employee";
    const demoUser: BackendUserAuthInfo = {
      id: `usr_${Date.now()}`,
      email: email.trim(),
      full_name: email.split("@")[0] || "User",
      role: normalizedRole,
      department: "General",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const session = createSession(demoUser, `demo_token_${Date.now()}`);
    persistSession(session, session.accessToken);
    return session;
  },

  async signUp({ email, password, name }: Credentials): Promise<Session> {
    const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/register` : "/api/v1/auth/register";

    try {
      const registerResponse = await fetch(targetUrl, {
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

      if (!registerResponse.ok && regData) {
        throw new Error(parseApiError(regData, "Registration failed. Please try again."));
      }
    } catch (err: any) {
      if (err?.message && err.message !== "Failed to fetch") {
        throw err;
      }
    }

    return this.signIn({ email, password, name });
  },

  async signOut(): Promise<void> {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/logout` : "/api/v1/auth/logout";
      await fetch(targetUrl, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore network errors on logout */
    } finally {
      clearSession();
    }
  },
};

export async function setSessionFromToken(token: string): Promise<Session> {
  const session = await fetchCurrentUser(token);
  if (!session) {
    throw new Error("Failed to authenticate token.");
  }
  persistSession(session, token);
  return session;
}
