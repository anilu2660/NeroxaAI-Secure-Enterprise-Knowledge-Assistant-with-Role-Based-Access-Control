import type { AssistantToolOption } from "@/api/types";

/**
 * Assistant tool catalog — product configuration for FUTURE backend tools.
 *
 * Nothing here executes: there is no retrieval service, no web-search
 * provider, and no OCR pipeline in this codebase. Every entry is therefore
 * marked `available: false` so the UI can show "Prototype" honestly. The
 * user's selection is still real controlled state and is passed through
 * `askAssistant()` so a future backend can consume it unchanged.
 */
export const assistantTools: AssistantToolOption[] = [
  {
    id: "web-search",
    label: "Web search",
    detail: "Search public web sources",
    available: false,
  },
  {
    id: "document-retrieval",
    label: "Document retrieval",
    detail: "Authorized knowledge-base lookup",
    available: false,
  },
  {
    id: "citations",
    label: "Source citations",
    detail: "Attach grounded source references",
    available: false,
  },
  {
    id: "file-analysis",
    label: "Attachment analysis",
    detail: "Read attached documents and images",
    available: false,
  },
];

/** Tool ids enabled by default — none, because no tool is connected. */
export const defaultToolIds: string[] = [];

/** File types the composer accepts for attachments. */
export const acceptedDocumentTypes = ".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.pptx";
export const acceptedImageTypes = "image/png,image/jpeg,image/webp,image/gif";
