import bgSecure from "@/assets/bg-secure.jpg";
import bgRbac from "@/assets/bg-rbac.jpg";
import bgSemantic from "@/assets/bg-semantic.jpg";
import bgCitations from "@/assets/bg-citations.jpg";

export type FeatureId = "secure" | "rbac" | "semantic" | "citations";

export type FeatureRow = {
  label: string;
  meta?: string;
  state?: "allowed" | "blocked";
};

export type FeatureState = {
  id: FeatureId;
  pill: string;
  background: string;
  query: string;
  resultTitle: string;
  badge: string;
  metaRows?: { label: string; value: string }[];
  listTitle: string;
  rows: FeatureRow[];
  responseTitle: string;
  responseBody: string;
  tagsTitle?: string;
  tags?: string[];
  status: string;
  inputPlaceholder: string;
};

export const FEATURE_STATES: Record<FeatureId, FeatureState> = {
  secure: {
    id: "secure",
    pill: "Secure Retrieval",
    background: bgSecure,
    query: "What is the reimbursement policy?",
    resultTitle: "Secure Retrieval Results",
    badge: "RBAC VERIFIED",
    listTitle: "Retrieved sources",
    rows: [
      { label: "Finance Policy.pdf", meta: "PDF" },
      { label: "Finance Guidelines.pdf", meta: "PDF" },
      { label: "Employee Handbook.pdf", meta: "PDF" },
    ],
    responseTitle: "AI Response",
    responseBody:
      "Based on the retrieved Finance Policy documents, eligible employees can claim approved business expenses according to the organization's reimbursement guidelines.",
    tagsTitle: "Cited Sources",
    tags: ["Finance Policy.pdf · Page 18", "Finance Guidelines.pdf · Page 7"],
    status: "Verified Sources",
    inputPlaceholder: "Ask another question...",
  },
  rbac: {
    id: "rbac",
    pill: "RBAC Protected",
    background: bgRbac,
    query: "Show me the Finance department's reimbursement policy.",
    resultTitle: "Access Verification",
    badge: "✓ RBAC VERIFIED",
    metaRows: [
      { label: "User", value: "Alex Morgan" },
      { label: "Role", value: "Finance" },
      { label: "Department", value: "Finance" },
    ],
    listTitle: "Access control list",
    rows: [
      { label: "Finance Policy.pdf", meta: "✓ ALLOWED", state: "allowed" },
      { label: "Finance Guidelines.pdf", meta: "✓ ALLOWED", state: "allowed" },
      { label: "General Policy.pdf", meta: "✓ ALLOWED", state: "allowed" },
      { label: "HR Salary Report.pdf", meta: "✕ BLOCKED", state: "blocked" },
      { label: "Engineering SOP.pdf", meta: "✕ BLOCKED", state: "blocked" },
    ],
    responseTitle: "Authorized Knowledge Retrieved",
    responseBody:
      "You have access to the Finance department's reimbursement policies. Relevant authorized documents were retrieved successfully.",
    tagsTitle: "Access Scope",
    tags: ["Finance + General"],
    status: "✓ RBAC Verified",
    inputPlaceholder: "Ask another question...",
  },
  semantic: {
    id: "semantic",
    pill: "Semantic Search",
    background: bgSemantic,
    query: "How can employees claim travel expenses?",
    resultTitle: "Semantic Search Results",
    badge: "Relevant Context Found",
    listTitle: "Ranked matches",
    rows: [
      { label: "Finance Policy.pdf", meta: "98% relevant" },
      { label: "Travel Guidelines.pdf", meta: "94% relevant" },
      { label: "Expense Handbook.pdf", meta: "89% relevant" },
      { label: "Employee Benefits.pdf", meta: "73% relevant" },
    ],
    responseTitle: "AI Response",
    responseBody:
      "Travel expense claims are processed according to the organization's approved reimbursement and travel guidelines. The retrieved Finance Policy provides the most relevant information for this request.",
    tagsTitle: "Matched by Meaning",
    tags: ["Travel expenses", "Reimbursement", "Business travel", "Expense claims"],
    status: "Relevant Context Found",
    inputPlaceholder: "Ask another question...",
  },
  citations: {
    id: "citations",
    pill: "Source Citations",
    background: bgCitations,
    query: "What does the Data Security Policy say about access control?",
    resultTitle: "Verified AI Answer",
    badge: "✓ Sources Verified",
    listTitle: "Cited Sources",
    rows: [
      { label: "Data Security Policy v2.3", meta: "Page 12" },
      { label: "Access Control Guidelines", meta: "Page 7" },
      { label: "Compliance Overview 2024", meta: "Page 19" },
    ],
    responseTitle: "NeroxaAI",
    responseBody:
      "The Data Security Policy requires access to organizational resources to be controlled according to user roles and permissions.",
    tagsTitle: "Supporting evidence",
    tags: ["3 supporting sources"],
    status: "✓ Sources Verified",
    inputPlaceholder: "Ask another question...",
  },
};

export const FEATURE_ORDER: FeatureId[] = ["secure", "rbac", "semantic", "citations"];
