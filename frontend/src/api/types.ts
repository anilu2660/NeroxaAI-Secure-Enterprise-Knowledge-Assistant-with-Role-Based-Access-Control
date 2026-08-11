/**
 * Data contracts shared by the UI and the (future) FastAPI backend.
 * Keep presentation components dependent on these types only — never on mocks.
 */

import type { Permission, Role } from "@/auth/types";

export interface DocumentSummary {
  id: string;
  title: string;
  department: string;
  updatedLabel: string;
  rbacProtected: boolean;
}

/**
 * A document row in the knowledge library. `prototype: true` means the record
 * is a controlled UI fixture, not real organizational data.
 */
export interface DocumentRecord {
  id: string;
  title: string;
  description: string;
  department: string;
  documentType: string;
  /** Configured access scope label, e.g. "All Employees", "Finance Team". */
  accessScope: string;
  /** True when the scope is narrower than the whole organization. */
  accessRestricted: boolean;
  updatedLabel: string;
  updatedBy: string;
  kind: string;
  pageCount: number | null;
  /** Version string when the fixture genuinely carries one, else null. */
  version: string | null;
  /** Longer "About this Document" summary when available, else null. */
  about: string | null;
  prototype: boolean;
  /** Direct backend binary endpoint URL for native Adobe PDF viewing. */
  rawUrl?: string | null;
}

/** One block of controlled document-preview content rendered on a page canvas. */
export interface DocumentPreviewBlock {
  id: string;
  type: "heading" | "subheading" | "paragraph" | "list" | "note" | "table";
  text?: string;
  items?: string[];
  table?: { headers: string[]; rows: string[][] };
}

/**
 * A controlled preview representation of one document page. This is NOT a real
 * PDF render — no PDF bytes or storage backend exist in this codebase.
 */
export interface DocumentPreviewPage {
  documentId: string;
  page: number;
  sectionLabel: string;
  blocks: DocumentPreviewBlock[];
  /** Ids of blocks referenced by a prototype citation on this page. */
  citedBlockIds: string[];
}

export interface DocumentQuery {
  search?: string;
  department?: string;
  documentType?: string;
  accessScope?: string;
}

export interface DocumentFilterOptions {
  departments: string[];
  documentTypes: string[];
  accessScopes: string[];
}

export interface Citation {
  id: string;
  documentId: string;
  documentTitle: string;
  page?: number;
  /** Owning department / access scope of the cited document, when known. */
  department?: string;
  /** File kind badge, e.g. "PDF". */
  kind?: string;
  /** Short referenced passage, when the prototype fixture supplies one. */
  snippet?: string;
}

export interface ActivityEntry {
  id: string;
  kind: "retrieval" | "query" | "upload" | "share" | "delete" | "admin" | "login";
  label: string;
  actor: string;
  timeLabel: string;
  /** Result context id used to deep-link into the AI Assistant later. */
  resultId: string;
}

/**
 * Knowledge metrics. `null` means the backend has not reported a value yet —
 * the UI must render an empty state instead of a placeholder number.
 */
export interface KnowledgeOverview {
  accessibleDocuments: number | null;
  recentQueries24h: number | null;
  activeDepartments: number | null;
  indexedKnowledge: string | null;
}

export interface ReasoningModelOption {
  id: string;
  name: string;
  /** Compact label shown in the switcher, e.g. "Llama 3 · Local". */
  shortLabel: string;
  tier: "local" | "cloud";
  provider: string;
  detail: string;
  /** False when the provider is not connected in this deployment. */
  available: boolean;
}

/**
 * Result of a question submitted through the assistant service boundary.
 * `status` states plainly where the content came from so the UI can never
 * present prototype text as production inference.
 */
export type AssistantAnswerStatus = "no-provider" | "prototype-fixture" | "live";

export interface AssistantAnswer {
  id: string;
  query: string;
  answer: string;
  status: AssistantAnswerStatus;
  /** Short supporting reference lines rendered under the answer body. */
  keyReferences: string[];
  citations: Citation[];
  /** False while no retrieval backend has grounded the answer. */
  grounded: boolean;
  /** Human-readable retrieval status, e.g. "Retrieved securely (RBAC filtered)". */
  retrievalStatus: string;
  /** ISO timestamp of when the answer was produced. */
  createdAt: string;
  /** Reasoning model that produced the answer — null when none is configured. */
  modelId: string | null;
  modelLabel: string | null;
}

/** One question/answer exchange in the assistant conversation. */
export interface AssistantTurn {
  id: string;
  question: string;
  askedAt: string;
  answer: AssistantAnswer | null;
}

export interface AssistantCapability {
  id: "rbac" | "secure-retrieval" | "local-ai";
  title: string;
  description: string;
  /** Honest implementation state, e.g. "Not connected", "Prototype". */
  status: string;
}

export interface AccessScopeItem {
  label: string;
  granted: boolean;
}

export interface AccessProfile {
  scope: AccessScopeItem[];
  /** Configured capabilities — not backend-verified runtime results. */
  securityStatus: AccessScopeItem[];
  knowledgeAccess: string;
}

/**
 * A tool the assistant may use once a backend supports it. `available: false`
 * means nothing executes — the selection is carried through the service
 * boundary only, so the UI must present it as prototype configuration.
 */
export interface AssistantToolOption {
  id: string;
  label: string;
  detail: string;
  available: boolean;
}

/** Attachment metadata carried with a question (no upload endpoint exists). */
export interface AssistantAttachment {
  id: string;
  name: string;
  sizeLabel: string;
  kind: "document" | "image";
}

/* ------------------------------------------------------------------ *
 * Admin console contracts
 * ------------------------------------------------------------------ */

/**
 * One operational metric on the Admin Dashboard. `value: null` means the
 * owning service is not connected, so the UI must render "Unavailable" with
 * the `unavailableReason` instead of inventing a number.
 */
export interface AdminMetric {
  id: "total-users" | "total-documents" | "recent-uploads" | "recent-activity";
  label: string;
  value: string | null;
  /** Why the value is missing, e.g. "User directory not connected". */
  unavailableReason: string;
  /** Short tooltip/help text describing what the metric will report. */
  hint: string;
}

/** Administrative audit/system event. Empty until an audit backend exists. */
export interface AdminActivityEntry {
  id: string;
  label: string;
  actor: string;
  timeLabel: string;
}

/**
 * Repository summary for the Document Management Overview card. All counts are
 * null while no document service is connected.
 */
export interface AdminDocumentOverview {
  totalDocuments: number | null;
  indexedDocuments: number | null;
  pendingReview: number | null;
  /** Honest status line, e.g. "Document service not connected". */
  status: string;
}

/** Security/administrator context shown on the Admin Dashboard. */
export interface AdminSecurityContext {
  /** Session-derived title, e.g. "Administrator access". */
  title: string;
  /** Frontend-only role state description — never a backend guarantee. */
  roleStateLabel: string;
  /** Explicit enforcement status of the current build. */
  enforcementLabel: string;
  auditingLabel: string;
}

/* ------------------------------------------------------------------ *
 * Admin user management contracts
 * ------------------------------------------------------------------ */

export type ManagedUserStatus = "active" | "inactive" | "disabled";

/**
 * One organizational account as the User Management surface consumes it.
 * `prototype: true` marks the record as a controlled UI fixture — no identity
 * service, database, or JWT claim source is connected in this codebase.
 */
export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  /** Constrained to the existing application roles — never template roles. */
  role: Role;
  department: string;
  /** Organization the account belongs to, as assigned by an administrator. */
  organization: string;
  /**
   * Knowledge-access boundary that will eventually drive RBAC-filtered
   * retrieval. Held as frontend configuration only; nothing enforces it yet.
   */
  accessScope: string[];
  status: ManagedUserStatus;
  /** Null when no sign-in history is available (no auth backend records it). */
  lastSignInLabel: string | null;
  prototype: boolean;
}

export interface ManagedUserQuery {
  search?: string;
  role?: Role | "";
  department?: string;
  status?: ManagedUserStatus | "";
  accessScope?: string;
}

export interface ManagedUserFilterOptions {
  roles: Role[];
  departments: string[];
  statuses: ManagedUserStatus[];
  accessScopes: string[];
}

/** Payload for create/update. Mirrors the future POST/PATCH request body. */
export interface ManagedUserDraft {
  name: string;
  email: string;
  role: Role;
  department: string;
  organization: string;
  status: ManagedUserStatus;
  accessScope: string[];
}

/**
 * The authenticated user's profile as every workspace surface consumes it
 * (Account page, sidebar profile, navbar, Your Access panel).
 *
 * It is always RESOLVED FROM ONE RECORD — the directory record an
 * administrator created or edited in User Management — never from separately
 * hardcoded profile data. When the backend + JWT land, `getUserProfile()`
 * returns the record from `GET /me` and this shape stays identical.
 */
export interface UserProfile {
  /** Directory record id, which is also the session user id. */
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Display label, e.g. "Engineering · Employee". */
  roleLabel: string;
  department: string;
  organization: string;
  accessScope: string[];
  status: ManagedUserStatus;
  lastSignInLabel: string | null;
  /** Capabilities the role grants in this build. Nothing is enforced yet. */
  permissions: Permission[];
  /** False when the signed-in account has no administered record yet. */
  managedInDirectory: boolean;
  source: "directory" | "session";
  prototype: boolean;
  /** Profile picture image data URL or avatar link. */
  avatarUrl?: string | null;
}

/**
 * Outcome of a prototype mutation. `persisted` is always false while no
 * backend exists, so the UI must never claim a database write happened.
 */
export interface ManagedUserMutationResult {
  user: ManagedUser | null;
  persisted: boolean;
  message: string;
}

/* --------------------------------------------------------------------------
 * Admin document repository (Document Management)
 * ------------------------------------------------------------------------ */

/** How wide the configured access scope is. Drives the scope badge. */
export type AdminDocumentScopeKind = "organization" | "department" | "restricted";

/**
 * Repository state of a document. "available" means the record is listed and
 * viewable; "archived" is an admin-side state. Anything the (absent) backend
 * would own — parsing, embedding, index health — is deliberately NOT modelled
 * as a status here so the UI cannot imply processing happened.
 */
export type AdminDocumentStatus = "available" | "archived";

/**
 * One row of the administrative document repository. Field names mirror the
 * future FastAPI payload; `storageKey`/`indexId` stay null until real storage
 * and indexing exist and are never surfaced as if populated.
 */
export interface AdminDocument {
  id: string;
  name: string;
  description: string;
  department: string;
  documentType: string;
  fileKind: string;
  accessScopeLabel: string;
  accessScopeKind: AdminDocumentScopeKind;
  status: AdminDocumentStatus;
  /** Null when no repository records an update timestamp. */
  updatedDateLabel: string | null;
  updatedTimeLabel: string | null;
  pageCount: number | null;
  sizeLabel: string | null;
  /** Storage/index identifiers — null until a real backend assigns them. */
  storageKey: string | null;
  indexId: string | null;
  prototype: boolean;
}

export interface AdminDocumentQuery {
  search?: string;
  department?: string;
  documentType?: string;
  accessScope?: string;
  status?: AdminDocumentStatus | "";
}

export interface AdminDocumentFilterOptions {
  departments: string[];
  documentTypes: string[];
  accessScopes: string[];
  statuses: AdminDocumentStatus[];
}

/** Access-scope vocabulary offered when reassigning a document's scope. */
export interface AdminDocumentScopeOption {
  label: string;
  kind: AdminDocumentScopeKind;
}

/**
 * Outcome of a prototype repository mutation. `persisted` is always false while
 * no backend exists, so the UI must never claim a stored write.
 */
export interface AdminDocumentMutationResult {
  document: AdminDocument | null;
  persisted: boolean;
  message: string;
}

/* ------------------------------------------------------------------ *
 * Administrative document upload (frontend preparation contract)
 *
 * These shapes describe the future FastAPI ingestion payload. Nothing here
 * asserts that a file was stored, parsed, chunked, embedded, or indexed —
 * `submitDocumentUpload` cannot succeed while the document service is absent.
 * ------------------------------------------------------------------ */

export type DocumentServiceState = "not_connected" | "connected";

export interface DocumentServiceStatus {
  state: DocumentServiceState;
  label: string;
  detail: string;
}

export interface SupportedFileKind {
  extension: string;
  label: string;
  mimeTypes: string[];
}

/** Constraints the frontend genuinely enforces before any backend exists. */
export interface DocumentUploadConstraints {
  supportedFiles: SupportedFileKind[];
  acceptAttribute: string;
  maxSizeBytes: number;
  maxSizeLabel: string;
}

/**
 * One stage of the intended ingestion pipeline. `owner` separates work the
 * browser can genuinely do from work only a backend can do; `state` is
 * "planned" for every backend stage until a service is connected. No stage is
 * ever reported as completed by the prototype.
 */
export interface UploadWorkflowStage {
  id: string;
  label: string;
  owner: "frontend" | "backend";
  state: "available" | "planned";
  detail: string;
}

/** Result of real, frontend-side file type/size validation. */
export interface DocumentFileValidation {
  valid: boolean;
  errors: string[];
  fileKindLabel: string | null;
}

/** Administrator-entered metadata, before validation. */
export interface DocumentUploadDraft {
  name: string;
  department: string;
  documentType: string;
  accessScopeLabel: string;
  description: string;
}

/**
 * The payload a future POST /admin/documents would receive. Storage, index,
 * and processing fields are intentionally absent — the backend owns them.
 */
export interface DocumentUploadPayload {
  name: string;
  department: string;
  documentType: string;
  accessScopeLabel: string;
  accessScopeKind: AdminDocumentScopeKind;
  description: string;
  originalFilename: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByDepartment: string;
  preparedAtIso: string;
}

/** Validation outcome for the metadata form plus the prepared payload. */
export interface DocumentUploadPreparation {
  ready: boolean;
  fieldErrors: Partial<Record<keyof DocumentUploadDraft, string>>;
  payload: DocumentUploadPayload | null;
}

/**
 * Outcome of attempting the real ingestion call. While the document service is
 * absent this is always `accepted: false` with `documentId: null` — there is no
 * simulated success path.
 */
export interface DocumentUploadSubmission {
  accepted: boolean;
  documentId: string | null;
  message: string;
}

/* ------------------------------------------------------------------ *
 * Audit logs
 *
 * The shape a future FastAPI audit API is expected to return. Nothing in
 * the prototype produces audit records: the service reports its state and
 * returns an empty page so the UI can stay honest.
 * ------------------------------------------------------------------ */

export type AuditServiceState = "not_connected" | "unavailable" | "connected";

export interface AuditServiceStatus {
  state: AuditServiceState;
  label: string;
  detail: string;
}

export type AuditSeverity = "info" | "low" | "medium" | "high" | "critical";
export type AuditResult = "success" | "failure" | "denied" | "pending";

/** One persisted audit event. Never contains secrets, tokens or credentials. */
export interface AuditEvent {
  id: string;
  timestampIso: string;
  eventType: string;
  actorUserId: string;
  actorName: string;
  actorRole: string;
  action: string;
  actionLabel: string;
  resourceType: string;
  resourceId: string;
  resourceLabel: string;
  category: string;
  result: AuditResult;
  severity: AuditSeverity;
  /** Non-sensitive supplementary fields the backend chooses to expose. */
  metadata: Record<string, string>;
}

/** Frontend filter state; maps one-to-one onto future query parameters. */
export interface AuditEventQuery {
  search: string;
  fromIso: string;
  toIso: string;
  eventType: string;
  actor: string;
  resource: string;
  category: string;
  result: string;
  severity: string;
  sortBy: "timestamp";
  sortDirection: "asc" | "desc";
  page: number;
  pageSize: number;
}

export interface AuditFilterOptions {
  eventTypes: string[];
  actors: string[];
  resources: string[];
  categories: string[];
  results: string[];
  severities: string[];
}

/**
 * A page of audit events. `available: false` means the service could not be
 * queried at all — distinct from a real query that returned zero rows.
 */
export interface AuditEventPage {
  available: boolean;
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  status: AuditServiceStatus;
}

/* ------------------------------------------------------------------ *
 * Access Control / Roles & Permissions
 * ------------------------------------------------------------------ */

export type AccessControlServiceState = "connected" | "not_connected" | "unavailable";

export interface AccessControlServiceStatus {
  state: AccessControlServiceState;
  label: string;
  detail: string;
}

/** A capability an administrator can reason about, keyed by the Permission model. */
export interface PermissionDefinition {
  /** Matches the `Permission` union when the capability already exists. */
  key: string;
  label: string;
  description: string;
  group: "Workspace" | "Knowledge" | "Administration";
  /** True when this capability is administrative and never grantable to USER. */
  adminOnly: boolean;
}

export interface RoleDefinition {
  /** Matches the `Role` union: USER | ADMIN. */
  key: string;
  label: string;
  description: string;
  /** Permission keys granted to this role today. */
  permissions: string[];
  /** Access scopes this role may retrieve from once RBAC is enforced. */
  accessScopes: string[];
  /** Departments observed for this role in the current prototype session model. */
  departmentExamples: string[];
  /** Real assigned-user count, or null when no directory service can answer. */
  assignedUsers: number | null;
  editable: boolean;
}

export interface AccessScopeDefinition {
  key: string;
  label: string;
  description: string;
  /** Role keys able to retrieve documents in this scope. */
  roles: string[];
  /** True when scope membership depends on the user's department. */
  departmentBound: boolean;
}

export interface DepartmentDefinition {
  key: string;
  label: string;
  description: string;
}

/** Everything the Access Control page renders, from one service contract. */
export interface AccessControlModel {
  status: AccessControlServiceStatus;
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  accessScopes: AccessScopeDefinition[];
  departments: DepartmentDefinition[];
  /** Ordered conceptual chain: User -> ... -> RBAC-Filtered Retrieval. */
  resolutionChain: string[];
  /** True only when a change made here is genuinely persisted somewhere. */
  mutationsPersisted: boolean;
}

/* ------------------------------------------------------------------ *
 * Canonical document record (single source of truth)
 *
 * ONE record per document for the whole product. The user-facing library
 * (`DocumentRecord`), the administrative repository (`AdminDocument`), and the
 * dashboard summary (`DocumentSummary`) are all PROJECTIONS of this record, so
 * an administrator's edit can never disagree with what a user sees.
 *
 * Fields a real backend owns (storage key, index id, indexing state) stay
 * null/false here: nothing in this codebase stores or indexes anything.
 * ------------------------------------------------------------------ */

export interface CanonicalDocument {
  id: string;
  title: string;
  description: string;
  /** Organizational ownership — from the shared department vocabulary. */
  department: string;
  documentType: string;
  /**
   * Knowledge boundary, expressed with the SAME vocabulary as user access
   * scopes (e.g. "Finance Knowledge"), so scope comparisons are meaningful.
   */
  accessScopeLabel: string;
  accessScopeKind: AdminDocumentScopeKind;
  fileKind: string;
  pageCount: number | null;
  version: string | null;
  about: string | null;
  updatedDateLabel: string | null;
  updatedTimeLabel: string | null;
  updatedBy: string;
  /** Admin-side lifecycle flag. Archived rows stay out of the user library. */
  archived: boolean;
  sizeLabel: string | null;
  /** Backend-owned identifiers — null until real storage/indexing exists. */
  storageKey: string | null;
  indexId: string | null;
  /** False while no parsing/embedding/vector pipeline has ever run. */
  indexed: boolean;
  prototype: boolean;
}

/** Honest state of the citation/retrieval service behind AI answers. */
export interface CitationServiceStatus {
  available: boolean;
  label: string;
  detail: string;
}
