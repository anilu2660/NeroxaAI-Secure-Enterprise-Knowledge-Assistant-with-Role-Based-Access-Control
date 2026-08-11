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

function createSession(userAuth: BackendUserAuthInfo, accessToken: string): Session {
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
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function persistSession(session: Session, token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage disabled or quota exceeded */
  }
}

function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* noop */
  }
}

export const jwtAuthAdapter: AuthProviderAdapter = {
  async restore(): Promise<Session | null> {
    const token = getStoredToken();
    if (!token) return null;

    try {
      const response = await fetch("/api/v1/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        clearSession();
        return null;
      }

      const userData: BackendUserAuthInfo = await response.json();
      const session = createSession(userData, token);
      persistSession(session, token);
      return session;
    } catch (err) {
      // If server is unreachable or offline, attempt to load cached session from localStorage if available
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
          return JSON.parse(raw) as Session;
        }
      } catch {
        /* noop */
      }
      return null;
    }
  },

  async signIn({ email, password }: Credentials): Promise<Session> {
    const response = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(parseApiError(data, "Invalid email or password."));
    }

    const tokenResponse: BackendTokenResponse = data;
    const token = tokenResponse.access_token;

    // Fetch complete user profile from /me
    const meResponse = await fetch("/api/v1/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (meResponse.ok) {
      const userData: BackendUserAuthInfo = await meResponse.json();
      const session = createSession(userData, token);
      persistSession(session, token);
      return session;
    }

    // Fallback if /me endpoint fails immediately after login
    const fallbackUser: BackendUserAuthInfo = {
      id: tokenResponse.user_id,
      email: tokenResponse.email,
      full_name: email.split("@")[0] || "User",
      role: tokenResponse.role,
      department: tokenResponse.department,
      is_active: true,
      created_at: new Date().toISOString(),
    };
    const session = createSession(fallbackUser, token);
    persistSession(session, token);
    return session;
  },

  async signUp({ email, password, name }: Credentials): Promise<Session> {
    const registerResponse = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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

    // Automatically sign in upon successful registration
    return this.signIn({ email, password });
  },

  async signOut(): Promise<void> {
    clearSession();
  },
};

export async function setSessionFromToken(token: string): Promise<Session> {
  const response = await fetch("/api/v1/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to authenticate token.");
  }

  const userData: BackendUserAuthInfo = await response.json();
  const session = createSession(userData, token);
  persistSession(session, token);
  return session;
}
