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

async function fetchCurrentUser(token?: string): Promise<Session | null> {
  if (!token) return null;

  const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
  const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/me` : "/api/v1/auth/me";

  try {
    const response = await fetch(targetUrl, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    if (!response.ok) return null;
    const userData: BackendUserAuthInfo = await response.json();
    return createSession(userData, token);
  } catch {
    return null;
  }
}

export const jwtAuthAdapter: AuthProviderAdapter = {
  async restore(): Promise<Session | null> {
    const token = getStoredToken();
    const cached = getStoredSession();

    if (!token) return null;

    const session = await fetchCurrentUser(token);
    if (session) {
      persistSession(session, token);
      return session;
    }

    clearSession();
    return cached ? null : null;
  },

  async signIn({ email, password }: Credentials): Promise<Session> {
    const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/login` : "/api/v1/auth/login";

    let response: Response;
    try {
      response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      throw new Error(
        "Backend API is unreachable. Configure VITE_API_URL with your Railway FastAPI URL and redeploy the frontend.",
      );
    }

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(parseApiError(data, "Invalid email or password."));
    }

    const tokenResponse: BackendTokenResponse = data;
    const session = await fetchCurrentUser(tokenResponse.access_token);
    if (!session) {
      throw new Error("Login succeeded but the backend identity could not be verified.");
    }

    persistSession(session, tokenResponse.access_token);
    return session;
  },

  async signUp({ email, password, name }: Credentials): Promise<Session> {
    const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
    const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/register` : "/api/v1/auth/register";

    let registerResponse: Response;
    try {
      registerResponse = await fetch(targetUrl, {
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
    } catch {
      throw new Error(
        "Backend API is unreachable. Configure VITE_API_URL with your Railway FastAPI URL and redeploy the frontend.",
      );
    }

    const regData = await registerResponse.json().catch(() => null);
    if (!registerResponse.ok) {
      throw new Error(parseApiError(regData, "Registration failed. Please try again."));
    }

    return this.signIn({ email, password, name });
  },

  async signOut(): Promise<void> {
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
      const targetUrl = apiUrl ? `${apiUrl}/api/v1/auth/logout` : "/api/v1/auth/logout";
      const token = getStoredToken();
      await fetch(targetUrl, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
      });
    } catch {
      /* clear local session even when the server is unreachable */
    } finally {
      clearSession();
    }
  },
};

export async function setSessionFromToken(token: string): Promise<Session> {
  const session = await fetchCurrentUser(token);
  if (!session) {
    throw new Error("Failed to authenticate token with the backend.");
  }
  persistSession(session, token);
  return session;
}
