/**
 * Data contracts shared by the UI and the FastAPI backend.
 */

import type { Permission, Role } from "@/auth/types";
import type { AssistantQueryResponse } from "./assistant-types";

export interface DocumentSummary { id:string; title:string; department:string; updatedLabel:string; rbacProtected:boolean; }
export interface DocumentRecord { id:string; title:string; description:string; department:string; documentType:string; accessScope:string; accessRestricted:boolean; updatedLabel:string; updatedBy:string; kind:string; pageCount:number|null; version:string|null; about:string|null; prototype:boolean; rawUrl?:string|null; }
export interface DocumentPreviewBlock { id:string; type:"heading"|"subheading"|"paragraph"|"list"|"note"|"table"; text?:string; items?:string[]; table?:{headers:string[];rows:string[][]}; }
export interface DocumentPreviewPage { documentId:string; page:number; sectionLabel:string; blocks:DocumentPreviewBlock[]; citedBlockIds:string[]; }
export interface DocumentQuery { search?:string; department?:string; documentType?:string; accessScope?:string; }
export interface DocumentFilterOptions { departments:string[]; documentTypes:string[]; accessScopes:string[]; }
export interface Citation { id:string; documentId:string; documentTitle:string; page?:number; department?:string|null; kind?:string|null; snippet?:string|null; url?:string|null; type?:string|null; }
export interface ActivityEntry { id:string; kind:"retrieval"|"query"|"upload"|"share"|"delete"|"admin"|"login"; label:string; actor:string; timeLabel:string; resultId:string; }
export interface KnowledgeOverview { accessibleDocuments:number|null; recentQueries24h:number|null; activeDepartments:number|null; indexedKnowledge:string|null; }
export interface ReasoningModelOption { id:string; name:string; shortLabel:string; tier:"local"|"cloud"; provider:string; detail:string; available:boolean; }
export type AssistantAnswerStatus = "no-provider"|"prototype-fixture"|"live";
export interface AssistantAnswer { id:string; query:string; answer:string; status:AssistantAnswerStatus; keyReferences:string[]; citations:Citation[]; grounded:boolean; retrievalStatus:string; createdAt:string; modelId:string|null; modelLabel:string|null; execution?:AssistantQueryResponse|null; }
export interface AssistantTurn { id:string; question:string; askedAt:string; answer:AssistantAnswer|null; }
export interface AssistantCapability { id:"rbac"|"secure-retrieval"|"local-ai"; title:string; description:string; status:string; }
export interface AccessScopeItem { label:string; granted:boolean; }
export interface AccessProfile { scope:AccessScopeItem[]; securityStatus:AccessScopeItem[]; knowledgeAccess:string; }
export interface AssistantToolOption { id:string; label:string; detail:string; available:boolean; }
export interface AssistantAttachment { id:string; name:string; sizeLabel:string; kind:"document"|"image"; }
export interface AdminMetric { id:"total-users"|"total-documents"|"recent-uploads"|"recent-activity"; label:string; value:string|null; unavailableReason:string; hint:string; }
export interface AdminActivityEntry { id:string; label:string; actor:string; timeLabel:string; }
export interface AdminDocumentOverview { totalDocuments:number|null; indexedDocuments:number|null; pendingReview:number|null; status:string; }
export interface AdminSecurityContext { title:string; roleStateLabel:string; enforcementLabel:string; auditingLabel:string; }
export type ManagedUserStatus = "active"|"inactive"|"disabled"|"pending_approval";
export interface ManagedUser { id:string; name:string; email:string; role:Role; department:string; organization:string; accessScope:string[]; status:ManagedUserStatus; lastSignInLabel:string|null; prototype:boolean; requestedRole?:string|null; isApproved?:boolean; }
export interface ManagedUserQuery { search?:string; role?:Role|""; department?:string; status?:ManagedUserStatus|""; accessScope?:string; }
export interface ManagedUserFilterOptions { roles:Role[]; departments:string[]; statuses:ManagedUserStatus[]; accessScopes:string[]; }
export interface ManagedUserDraft { name:string; email:string; role:Role; department:string; organization:string; status:ManagedUserStatus; accessScope:string[]; requestedRole?:string|null; isApproved?:boolean; }
export interface UserProfile { id:string; name:string; email:string; role:Role; roleLabel:string; department:string; organization:string; accessScope:string[]; status:ManagedUserStatus; lastSignInLabel:string|null; permissions:Permission[]; managedInDirectory:boolean; source:"directory"|"session"; prototype:boolean; avatarUrl?:string|null; }
export interface ManagedUserMutationResult { user:ManagedUser|null; persisted:boolean; message:string; }
export type AdminDocumentScopeKind = "organization"|"department"|"restricted";
export type AdminDocumentStatus = "available"|"archived";
export interface AdminDocument { id:string; name:string; description:string; department:string; documentType:string; fileKind:string; accessScopeLabel:string; accessScopeKind:AdminDocumentScopeKind; status:AdminDocumentStatus; updatedDateLabel:string|null; updatedTimeLabel:string|null; pageCount:number|null; sizeLabel:string|null; storageKey:string|null; indexId:string|null; prototype:boolean; }
export interface AdminDocumentQuery { search?:string; department?:string; documentType?:string; accessScope?:string; status?:AdminDocumentStatus|""; }
export interface AdminDocumentFilterOptions { departments:string[]; documentTypes:string[]; accessScopes:string[]; statuses:AdminDocumentStatus[]; }
export interface AdminDocumentScopeOption { label:string; kind:AdminDocumentScopeKind; }
export interface AdminDocumentMutationResult { document:AdminDocument|null; persisted:boolean; message:string; }
export type DocumentServiceState = "not_connected"|"connected";
export interface DocumentServiceStatus { state:DocumentServiceState; label:string; detail:string; }
export interface SupportedFileKind { extension:string; label:string; mimeTypes:string[]; }
export interface DocumentUploadConstraints { supportedFiles:SupportedFileKind[]; acceptAttribute:string; maxSizeBytes:number; maxSizeLabel:string; }
export interface UploadWorkflowStage { id:string; label:string; owner:"frontend"|"backend"; state:"available"|"planned"; detail:string; }
export interface DocumentFileValidation { valid:boolean; errors:string[]; fileKindLabel:string|null; }
export interface DocumentUploadDraft { name:string; department:string; documentType:string; accessScopeLabel:string; description:string; }
export interface DocumentUploadPayload { name:string; department:string; documentType:string; accessScopeLabel:string; accessScopeKind:AdminDocumentScopeKind; description:string; originalFilename:string; mimeType:string; fileSizeBytes:number; uploadedByUserId:string; uploadedByName:string; uploadedByDepartment:string; preparedAtIso:string; }
export interface DocumentUploadPreparation { ready:boolean; fieldErrors:Partial<Record<keyof DocumentUploadDraft,string>>; payload:DocumentUploadPayload|null; }
export interface DocumentUploadSubmission { accepted:boolean; documentId:string|null; message:string; }
export type AuditServiceState = "not_connected"|"unavailable"|"connected";
export interface AuditServiceStatus { state:AuditServiceState; label:string; detail:string; }
export type AuditSeverity = "info"|"low"|"medium"|"high"|"critical";
export type AuditResult = "success"|"failure"|"denied"|"pending";
export interface AuditEvent { id:string; timestampIso:string; eventType:string; actorUserId:string; actorName:string; actorRole:string; action:string; actionLabel:string; resourceType:string; resourceId:string; resourceLabel:string; category:string; result:AuditResult; severity:AuditSeverity; metadata:Record<string,string>; }
export interface AuditEventQuery { search:string; fromIso:string; toIso:string; eventType:string; actor:string; resource:string; category:string; result:string; severity:string; sortBy:"timestamp"; sortDirection:"asc"|"desc"; page:number; pageSize:number; }
export interface AuditFilterOptions { eventTypes:string[]; actors:string[]; resources:string[]; categories:string[]; results:string[]; severities:string[]; }
export interface AuditEventPage { available:boolean; events:AuditEvent[]; total:number; page:number; pageSize:number; status:AuditServiceStatus; }
export type AccessControlServiceState = "connected"|"not_connected"|"unavailable";
export interface AccessControlServiceStatus { state:AccessControlServiceState; label:string; detail:string; }
export interface PermissionDefinition { key:string; label:string; description:string; group:"Workspace"|"Knowledge"|"Administration"; adminOnly:boolean; }
export interface RoleDefinition { key:string; label:string; description:string; permissions:string[]; accessScopes:string[]; departmentExamples:string[]; assignedUsers:number|null; editable:boolean; }
export interface AccessScopeDefinition { key:string; label:string; description:string; roles:string[]; departmentBound:boolean; }
export interface DepartmentDefinition { key:string; label:string; description:string; }
export interface AccessControlModel { status:AccessControlServiceStatus; roles:RoleDefinition[]; permissions:PermissionDefinition[]; accessScopes:AccessScopeDefinition[]; departments:DepartmentDefinition[]; resolutionChain:string[]; mutationsPersisted:boolean; }
export interface CanonicalDocument { id:string; title:string; description:string; department:string; documentType:string; accessScopeLabel:string; accessScopeKind:AdminDocumentScopeKind; fileKind:string; pageCount:number|null; version:string|null; about:string|null; updatedDateLabel:string|null; updatedTimeLabel:string|null; updatedBy:string; archived:boolean; sizeLabel:string|null; storageKey:string|null; indexId:string|null; indexed:boolean; prototype:boolean; }
export interface CitationServiceStatus { available:boolean; label:string; detail:string; }
