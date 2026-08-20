import type { AssistantToolOption } from "@/api/types";

/**
 * Assistant tool catalog — configurable search & AI capabilities.
 */
export const assistantTools: AssistantToolOption[] = [
  {
    id: "web-search",
    label: "Web search",
    detail: "Live SerpAPI Google search engine",
    available: true,
  },
  {
    id: "citations",
    label: "Source citations",
    detail: "Attach grounded source references & snippets",
    available: true,
  },
  {
    id: "chart-generator",
    label: "Charts & Tables",
    detail: "Interactive visual charts & data visualizer",
    available: true,
  },
  {
    id: "executive-summary",
    label: "Executive Summary",
    detail: "TL;DR concise key takeaways & decisions",
    available: true,
  },
  {
    id: "compliance-checker",
    label: "Policy Compliance",
    detail: "Audit scenarios against internal rules & gates",
    available: true,
  },
  {
    id: "action-planner",
    label: "Action Planner",
    detail: "Extract structured checklists, deadlines & tasks",
    available: true,
  },
  {
    id: "calculator",
    label: "Math & Calculator",
    detail: "Deterministic computational solver",
    available: true,
  },
  {
    id: "sql-generator",
    label: "SQL & Code Generator",
    detail: "Generate schema-valid queries & technical scripts",
    available: true,
  },
  {
    id: "file-analysis",
    label: "Attachment analysis",
    detail: "Read attached documents and images",
    available: true,
  },
];

export const defaultToolIds: string[] = ["citations"];

/** File types the composer accepts for attachments. */
export const acceptedDocumentTypes = ".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.pptx";
export const acceptedImageTypes = "image/png,image/jpeg,image/webp,image/gif";
