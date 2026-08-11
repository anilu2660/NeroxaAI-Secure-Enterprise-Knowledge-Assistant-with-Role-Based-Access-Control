import type {
  AdminDocument,
  AdminDocumentScopeOption,
  CanonicalDocument,
  DocumentRecord,
  DocumentSummary,
} from "@/api/types";

/**
 * PROTOTYPE DOCUMENT CATALOG — the single source of truth for every document
 * record in this build.
 *
 * Admin -> Document Management writes here, and the user-facing Documents
 * library, Document Details page, and dashboard "Recent Documents" panel all
 * read the same record back through `@/api/workspace-service`. There is no
 * storage provider, metadata database, parsing pipeline, or vector index in
 * this codebase: these are labelled UI fixtures, `indexed` is always false, and
 * `storageKey`/`indexId` stay null because nothing has been stored or indexed.
 *
 * When the real backend arrives, replace the read/write helpers below with API
 * calls — the `CanonicalDocument` shape and every projection stay the same.
 */

/**
 * Access-scope vocabulary for documents. It deliberately uses the SAME labels
 * as user access scopes (`prototypeAccessScopeVocabulary`) so a document's
 * scope and a user's scope can actually be compared.
 */
export const documentAccessScopeOptions: AdminDocumentScopeOption[] = [
  { label: "General Knowledge", kind: "organization" },
  { label: "Engineering Knowledge", kind: "department" },
  { label: "Product Knowledge", kind: "department" },
  { label: "Marketing Knowledge", kind: "department" },
  { label: "Sales Knowledge", kind: "department" },
  { label: "Finance Knowledge", kind: "department" },
  { label: "Operations Knowledge", kind: "department" },
  { label: "Security Knowledge", kind: "restricted" },
];

export function scopeKindFor(label: string) {
  return documentAccessScopeOptions.find((option) => option.label === label)?.kind ?? "restricted";
}

function seed(): CanonicalDocument[] {
  return [];
}

/**
 * Prototype store, persisted to this browser only (same treatment as the user
 * directory) so an administrator's metadata edit or catalog registration is
 * still there after a reload. It is NOT a database: no file bytes, no storage
 * provider, no index.
 */
const STORAGE_KEY = "neroxa.documents.catalog";

let catalog: CanonicalDocument[] | null = null;

function load(): CanonicalDocument[] {
  if (catalog) return catalog;
  if (typeof window === "undefined") {
    catalog = seed();
    return catalog;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as CanonicalDocument[]) : null;
    catalog = Array.isArray(parsed) && parsed.length > 0 ? parsed : seed();
  } catch {
    catalog = seed();
  }
  return catalog;
}

function save(next: CanonicalDocument[]) {
  catalog = next;
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — the catalog stays in memory for this page */
  }
}

export function listCatalog(): CanonicalDocument[] {
  return load();
}

export function findCatalogDocument(documentId: string): CanonicalDocument | null {
  return load().find((doc) => doc.id === documentId) ?? null;
}

/** Applies a patch to one record and returns the updated canonical document. */
export function patchCatalogDocument(
  documentId: string,
  patch: Partial<CanonicalDocument>,
): CanonicalDocument | null {
  let updated: CanonicalDocument | null = null;
  save(
    load().map((doc) => {
      if (doc.id !== documentId) return doc;
      updated = { ...doc, ...patch };
      return updated;
    }),
  );
  return updated;
}

export function removeCatalogDocument(documentId: string): CanonicalDocument | null {
  const removed = findCatalogDocument(documentId);
  save(load().filter((doc) => doc.id !== documentId));
  return removed;
}

/** Unique catalog id derived from a document name. */
function catalogId(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "document";
  let id = base;
  let counter = 2;
  while (taken.has(id)) id = `${base}-${counter++}`;
  return id;
}

/**
 * Registers a METADATA-ONLY catalog record from the admin upload form. The file
 * itself is never read, stored, parsed, or indexed — `storageKey`, `indexId`,
 * `pageCount`, and `about` stay null and `indexed` stays false, so every surface
 * shows this record as a prototype entry with no retrievable content.
 */
export function registerCatalogDocument(input: {
  title: string;
  description: string;
  department: string;
  documentType: string;
  accessScopeLabel: string;
  accessScopeKind: CanonicalDocument["accessScopeKind"];
  fileKind: CanonicalDocument["fileKind"];
  sizeLabel: string | null;
  updatedBy: string;
}): CanonicalDocument {
  const current = load();
  const now = new Date();
  const doc: CanonicalDocument = {
    id: catalogId(input.title, new Set(current.map((entry) => entry.id))),
    title: input.title,
    description: input.description || "Metadata registered by an administrator. No file stored.",
    department: input.department,
    documentType: input.documentType,
    accessScopeLabel: input.accessScopeLabel,
    accessScopeKind: input.accessScopeKind,
    fileKind: input.fileKind,
    pageCount: null,
    version: null,
    about: null,
    updatedDateLabel: now.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    updatedTimeLabel: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    updatedBy: input.updatedBy,
    archived: false,
    sizeLabel: input.sizeLabel,
    storageKey: null,
    indexId: null,
    indexed: false,
    prototype: true,
  };
  save([doc, ...current]);
  return doc;
}

/* ---------------------------- projections ---------------------------- */

/** User-facing library row. */
export function toDocumentRecord(doc: CanonicalDocument): DocumentRecord {
  return {
    id: doc.id,
    title: doc.title,
    description: doc.description,
    department: doc.department,
    documentType: doc.documentType,
    accessScope: doc.accessScopeLabel,
    accessRestricted: doc.accessScopeKind !== "organization",
    updatedLabel: doc.updatedDateLabel ?? "Unavailable",
    updatedBy: doc.updatedBy,
    kind: doc.fileKind,
    pageCount: doc.pageCount,
    version: doc.version,
    about: doc.about,
    prototype: doc.prototype,
  };
}

/** Administrative repository row. */
export function toAdminDocument(doc: CanonicalDocument): AdminDocument {
  return {
    id: doc.id,
    name: doc.title,
    description: doc.description,
    department: doc.department,
    documentType: doc.documentType,
    fileKind: doc.fileKind,
    accessScopeLabel: doc.accessScopeLabel,
    accessScopeKind: doc.accessScopeKind,
    status: doc.archived ? "archived" : "available",
    updatedDateLabel: doc.updatedDateLabel,
    updatedTimeLabel: doc.updatedTimeLabel,
    pageCount: doc.pageCount,
    sizeLabel: doc.sizeLabel,
    storageKey: doc.storageKey,
    indexId: doc.indexId,
    prototype: doc.prototype,
  };
}

/** Dashboard "Recent Documents" summary row. */
export function toDocumentSummary(doc: CanonicalDocument): DocumentSummary {
  return {
    id: doc.id,
    title: doc.title,
    department: doc.department,
    updatedLabel: doc.updatedDateLabel ?? "Unavailable",
    rbacProtected: doc.accessScopeKind !== "organization",
  };
}
