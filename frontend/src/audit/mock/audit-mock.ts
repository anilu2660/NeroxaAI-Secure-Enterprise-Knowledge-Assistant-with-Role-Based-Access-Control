import type { AuditFilterOptions, AuditServiceStatus } from "@/api/types";

/**
 * Truthful audit service state. There is no audit collector, store, or API in
 * the prototype, so no event source exists to read from.
 */
export const prototypeAuditServiceStatus: AuditServiceStatus = {
  state: "not_connected",
  label: "Audit service not connected",
  detail:
    "Audit logging is not operational yet. Once the audit service is connected, administrative, access, document, and security events will be recorded and appear here.",
};

/**
 * Filter vocabulary only — configuration the frontend can offer today, not
 * evidence that any matching event exists. A connected service is expected to
 * return the real facet values instead.
 */
export const prototypeAuditFilterOptions: AuditFilterOptions = {
  eventTypes: [
    "Authentication",
    "Administrative Action",
    "Access Event",
    "Document Change",
    "Security Event",
    "System Event",
  ],
  actors: [],
  resources: ["User", "Document", "Role", "Access Scope", "Session", "System"],
  categories: [
    "Identity & Access",
    "User Management",
    "Document Management",
    "Knowledge Retrieval",
    "Security",
    "Platform",
  ],
  results: ["Success", "Failure", "Denied", "Pending"],
  severities: ["Info", "Low", "Medium", "High", "Critical"],
};
