import type { Permission, Role } from "@/auth/types";
import type { AssistantQueryResponse } from "./assistant-types";

export interface DocumentSummary {
  id: string;
  title: string;
  department: string;
  updatedLabel: string;
  rbacProtected: boolean;
}

export interface DocumentRecord {
  id: string;
  title: string;
  description: string;
  department: string;
  documentType: string;
  accessScope: string;
  accessRestricted: boolean;
  updatedLabel: string;
  updatedBy: string;
  kind: string;
  pageCount: number | null;
  version: string;
  about: string;
  prototype: boolean;
}

export interface Citation {
  id: string;
  documentId: string;
  documentTitle: string;
  page?: number;
  department?: string;
  kind?: string;
  snippet?: string;
}

export interface ActivityEntry {
  id: string;
  kind: "retrieval" | "query" | "upload" | "share" | "delete" | "admin" | "login";
  label: string;
  actor: string;
  timeLabel: string;
  resultId: string;
}

export interface KnowledgeOverview {
  accessibleDocuments: number | null;
  recentQueries24h: number | null;
  activeDepartments: number | null;
  indexedKnowledge: string | null;
}

export interface ReasoningModelOption {
  id: string;
  name: string;
  shortLabel: string;
  tier: "local" | "cloud";
  provider: string;
  detail: string;
  available: boolean;
}

export type AssistantAnswerStatus = "no-provider" | "prototype-fixture" | "live";

export interface AssistantAnswer {
  id: string;
  query: string;
  answer: string;
  status: AssistantAnswerStatus;
  keyReferences: string[];
  citations: Citation[];
  grounded: boolean;
  retrievalStatus: string;
  createdAt: string;
  modelId: string | null;
  modelLabel: string | null;
  execution: AssistantQueryResponse | null;
}

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
  status: string;
}

export interface AccessScopeItem {
  label: string;
  granted: boolean;
}

export interface AccessProfile {
  scope: AccessScopeItem[];
  securityStatus: AccessScopeItem[];
  knowledgeAccess: string;
}

export interface AssistantToolOption {
  id: string;
  label: string;
  detail: string;
  available: boolean;
}

export interface DocumentFileValidation {
  valid: boolean;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  reason?: string;
}

export interface DocumentUploadDraft {
  file: File | null;
  title: string;
  department: string;
  accessScope: string;
}

export interface DocumentUploadPayload {
  file: File;
  title?: string;
  department?: string;
  accessScope?: string;
}

export interface DocumentUploadPreparation {
  allowed: boolean;
  constraints: DocumentUploadConstraints;
}

export interface DocumentUploadSubmission {
  success: boolean;
  document?: DocumentRecord;
  error?: string;
}

export interface DocumentUploadConstraints {
  maxSizeMb: number;
  allowedTypes: string[];
}

export type UploadWorkflowStage = "idle" | "validating" | "uploading" | "processing" | "complete" | "error";

export interface DocumentPreviewBlock {
  id: string;
  type: "heading" | "paragraph";
  text: string;
}

export interface DocumentPreviewPage {
  documentId: string;
  page: number;
  sectionLabel: string;
  citedBlockIds: string[];
  blocks: DocumentPreviewBlock[];
}

export interface DocumentQuery {
  search?: string;
  department?: string;
}

export interface DocumentFilterOptions {
  departments: string[];
  documentTypes: string[];
  accessScopes: string[];
}

export interface AdminDocument extends DocumentRecord {}
export interface AdminDocumentFilterOptions extends DocumentFilterOptions {}
export interface AdminDocumentQuery extends DocumentQuery {}
export interface AdminDocumentScopeOption { label: string; value: string; }
export interface AdminDocumentStatus { id: string; status: string; }
export interface AdminDocumentMutationResult { success: boolean; document?: AdminDocument; error?: string; }
export interface AdminActivityEntry extends ActivityEntry {}
export interface AdminDocumentOverview extends KnowledgeOverview {}
export interface AdminMetric { label: string; value: string | number | null; detail?: string; }
export interface AdminSecurityContext { label: string; value: string; }
export interface ManagedUser { id: string; name: string; email: string; role: Role; department: string; status: string; accessScope: string[]; }
export interface ManagedUserDraft { name: string; email: string; role: Role; department: string; accessScope: string[]; }
export interface ManagedUserFilterOptions { roles: string[]; departments: string[]; statuses: string[]; }
export interface ManagedUserQuery { search?: string; role?: string; department?: string; status?: string; }
export interface ManagedUserMutationResult { success: boolean; user?: ManagedUser; error?: string; }
export type ManagedUserStatus = "active" | "inactive" | "pending";
export interface AccessControlModel { role: Role; permissions: Permission[]; }
export interface AccessControlServiceStatus { available: boolean; label: string; detail: string; }
export interface CitationServiceStatus { available: boolean; label: string; detail: string; }
export interface AuditEvent { id: string; action: string; actor: string; createdAt: string; detail?: string; }
export interface AuditEventPage { events: AuditEvent[]; total: number; page: number; pageSize: number; }
export interface AuditEventQuery { page?: number; pageSize?: number; search?: string; action?: string; actor?: string; }
export interface AuditFilterOptions { actions: string[]; actors: string[]; }
export interface AuditServiceStatus { available: boolean; label: string; detail: string; }
export interface UserProfile { id: string; name: string; email: string; role: Role; roleLabel: string; department: string; organization: string; accessScope: string[]; status: string; lastSignInLabel: string; permissions: Permission[]; managedInDirectory: boolean; avatarUrl?: string | null; }
