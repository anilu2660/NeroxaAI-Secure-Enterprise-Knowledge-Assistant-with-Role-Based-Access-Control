import type { AuthProviderAdapter, AuthUser, Credentials, Role, Session } from "./types";
import { permissionsForRole, roleLabelFor } from "@/roles/permissions";

const TOKEN_KEY = "neroxa.token";
const SESSION_KEY = "neroxa.session";

interface BackendTokenResponse { access_token: string; token_type: string; user_id: string; email: string; role: string; department: string; }
interface BackendUserAuthInfo { id: string; email: string; full_name: string; role: string; department: string; is_active: boolean; is_approved?: boolean; requested_role?: string | null; created_at: string; }

function normalizeRole(backendRole: string): Role { return backendRole?.toLowerCase() === "admin" ? "ADMIN" : "USER"; }
function parseApiError(data: any, defaultMsg: string): string {
  if (!data) return defaultMsg;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail) && data.detail.length > 0) return data.detail[0]?.msg || defaultMsg;
  if (data.message) return data.message;
  return defaultMsg;
}
function createSession(userAuth: BackendUserAuthInfo, accessToken = ""): Session {
  const role = normalizeRole(userAuth.role);
  const user: AuthUser = { id: userAuth.id, name: userAuth.full_name || userAuth.email.split("@")[0] || "User", email: userAuth.email, role, department: userAuth.department || "General", roleLabel: roleLabelFor(role, userAuth.department || "General") };
  return { user, permissions: permissionsForRole(role), accessToken, expiresAt: null };
}
function getStoredToken(): string | null { if (typeof window === "undefined") return null; try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } }
function persistSession(session: Session, token?: string) { try { if (token) sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch { return; } }
function clearSession() { try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(SESSION_KEY); } catch { return; } }
function getApiBaseUrl(): string { return String(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, ""); }
function apiUrl(path: string): string { const base = getApiBaseUrl(); return `${base}${path.startsWith("/") ? path : `/${path}`}`; }
function requireApiUrl(): string { const base = getApiBaseUrl(); if (!base) throw new Error("Backend API URL is not configured. Set VITE_API_URL in Vercel to your Railway FastAPI URL and redeploy the frontend."); return base; }
async function responseData(response: Response): Promise<any> { const type = response.headers.get("content-type") || ""; if (type.includes("application/json")) return response.json().catch(() => null); const text = await response.text().catch(() => ""); return text ? { message: text.slice(0, 500) } : null; }

async function fetchCurrentUser(token?: string): Promise<Session> {
  if (!token) throw new Error("Authentication token is missing.");
  requireApiUrl();
  let response: Response;
  try {
    response = await fetch(apiUrl("/api/v1/auth/me"), { method: "GET", headers: { Accept: "application/json", Authorization: `Bearer ${token}` }, credentials: "include", cache: "no-store" });
  } catch {
    throw new Error("Backend API is unreachable. Check VITE_API_URL, the Railway deployment, and CORS configuration.");
  }
  const data = await responseData(response);
  if (!response.ok) {
    if (response.status === 401) { clearSession(); throw new Error("Backend rejected the authentication token (401). Please sign in again."); }
    if (response.status === 403) throw new Error(parseApiError(data, "Your account is not allowed to access the workspace."));
    throw new Error(parseApiError(data, `Backend authentication failed (HTTP ${response.status}).`));
  }
  return createSession(data as BackendUserAuthInfo, token);
}

export const jwtAuthAdapter: AuthProviderAdapter = {
  async restore(): Promise<Session | null> {
    const token = getStoredToken();
    if (!token) return null;
    try { const session = await fetchCurrentUser(token); persistSession(session, token); return session; }
    catch { clearSession(); return null; }
  },

  async signIn({ email, password }: Credentials): Promise<Session> {
    requireApiUrl();
    let response: Response;
    try {
      response = await fetch(apiUrl("/api/v1/auth/login"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, credentials: "include", body: JSON.stringify({ email: email.trim(), password }) });
    } catch {
      throw new Error("Backend API is unreachable. Check VITE_API_URL, the Railway deployment, and CORS configuration.");
    }
    const data = await responseData(response);
    if (!response.ok) throw new Error(parseApiError(data, `Login failed (HTTP ${response.status}).`));
    const tokenResponse = data as BackendTokenResponse;
    if (!tokenResponse?.access_token) throw new Error("Backend login succeeded but no access token was returned.");
    const session = await fetchCurrentUser(tokenResponse.access_token);
    persistSession(session, tokenResponse.access_token);
    return session;
  },

  async signUp({ email, password, name }: Credentials): Promise<Session> {
    requireApiUrl();
    let response: Response;
    try {
      response = await fetch(apiUrl("/api/v1/auth/register"), { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, credentials: "include", body: JSON.stringify({ email: email.trim(), password, full_name: name?.trim() || email.split("@")[0] || "User", department: "General" }) });
    } catch {
      throw new Error("Backend API is unreachable. Check VITE_API_URL, the Railway deployment, and CORS configuration.");
    }
    const data = await responseData(response);
    if (!response.ok) throw new Error(parseApiError(data, `Registration failed (HTTP ${response.status}).`));
    throw new Error("Direct registration is disabled. Please use the OTP registration flow.");
  },

  async signOut(): Promise<void> { try { if (getApiBaseUrl()) await fetch(apiUrl("/api/v1/auth/logout"), { method: "POST", credentials: "include" }); } finally { clearSession(); } },
};

export async function setSessionFromToken(token: string): Promise<Session> { try { const session = await fetchCurrentUser(token); persistSession(session, token); return session; } catch (error) { clearSession(); throw error instanceof Error ? error : new Error("Failed to authenticate token with the backend."); } }
