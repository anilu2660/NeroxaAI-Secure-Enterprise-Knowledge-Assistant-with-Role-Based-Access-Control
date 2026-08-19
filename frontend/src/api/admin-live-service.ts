import type { AdminActivityEntry, AdminDocumentOverview, AdminMetric } from "./types";
import { getApiUrl } from "./workspace-service";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("neroxa.token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson(path: string) {
  const response = await fetch(getApiUrl(path), {
    headers: { ...authHeaders(), Accept: "application/json" },
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`${response.status} ${response.statusText}${detail ? `: ${detail.slice(0, 180)}` : ""}`);
  }
  return response.json();
}

const auditPath = "/api/v1/admin/audit-logs/";

export async function getLiveAdminMetrics(): Promise<AdminMetric[]> {
  const [users, documents, audit] = await Promise.all([
    getJson("/api/v1/users/"),
    getJson("/api/v1/documents/"),
    getJson(auditPath),
  ]);

  return [
    { id: "total-users", label: "Total Users", value: String(Array.isArray(users) ? users.length : 0), unavailableReason: "", hint: "Active user accounts managed in PostgreSQL database." },
    { id: "total-documents", label: "Total Documents", value: String(Array.isArray(documents) ? documents.length : 0), unavailableReason: "", hint: "Indexed documents stored in PostgreSQL and represented in Qdrant." },
    { id: "recent-uploads", label: "Recent Uploads", value: String(Array.isArray(documents) ? documents.length : 0), unavailableReason: "", hint: "Documents currently indexed by the backend ingestion pipeline." },
    { id: "recent-activity", label: "Recent Activity", value: String(Array.isArray(audit) ? audit.length : 0), unavailableReason: "", hint: "Audit events currently stored in PostgreSQL." },
  ];
}

export async function getLiveAdminActivity(): Promise<AdminActivityEntry[]> {
  const logs = await getJson(auditPath);
  if (!Array.isArray(logs)) return [];
  return logs.slice(0, 10).map((log: any) => ({
    id: log.id,
    label: `${log.event_type}: ${log.action}${log.resource ? ` (${log.resource})` : ""}`,
    actor: log.user_email || "System",
    timeLabel: log.created_at ? new Date(log.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "Recently",
  }));
}

export async function getLiveAdminDocumentOverview(): Promise<AdminDocumentOverview> {
  const documents = await getJson("/api/v1/documents/");
  const total = Array.isArray(documents) ? documents.length : 0;
  return {
    totalDocuments: total,
    indexedDocuments: total,
    pendingReview: 0,
    status: "PostgreSQL records loaded · Qdrant indexing is handled by the backend",
  };
}

export async function getDependencyHealth(): Promise<any> {
  return getJson("/health/dependencies");
}
