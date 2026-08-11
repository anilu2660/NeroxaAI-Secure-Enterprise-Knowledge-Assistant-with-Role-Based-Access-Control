import type { DocumentPreviewPage } from "@/api/types";

/**
 * Controlled page-preview content for the document viewer.
 *
 * Document RECORDS live in `documents-catalog.ts` (the single source of truth);
 * this file only holds authored page content, because there are no PDF bytes,
 * storage provider, or render service in this codebase. Only the pages authored
 * here can be shown; every other page renders an honest "preview unavailable"
 * state. Keyed `${documentId}:${page}`.
 *
 * NOTE: there are deliberately NO citation fixtures here. Citations may only
 * come from a real retrieval service — none is connected, so the UI shows an
 * honest "retrieval not connected" state instead of authored citation text.
 */
export const prototypeDocumentPreviews: Record<string, DocumentPreviewPage> = {
  "finance-policy:14": {
    documentId: "finance-policy",
    page: 14,
    sectionLabel: "6. Expense Management and Approvals",
    citedBlockIds: [],
    blocks: [
      { id: "fp14-title", type: "heading", text: "6. Expense Management and Approvals" },
      {
        id: "fp14-intro",
        type: "paragraph",
        text: "All business expenses must be reasonable, necessary, and aligned with organizational objectives. Expenses must be pre-approved as per the authorization matrix defined below.",
      },
      { id: "fp14-auth-matrix", type: "subheading", text: "6.1 Authorization Matrix" },
      {
        id: "fp14-auth-intro",
        type: "paragraph",
        text: "The following table defines approval limits and corresponding authorization levels.",
      },
      {
        id: "fp14-auth-table",
        type: "table",
        table: {
          headers: ["Expense Type", "Up to ₹25,000", "₹25,001 – ₹1,00,000", "Above ₹1,00,000"],
          rows: [
            ["Travel & Accommodation", "Team Lead", "Finance Manager", "Finance Director"],
            ["Vendor Payments", "Finance Manager", "Finance Director", "CFO"],
            ["Software & Subscriptions", "Team Lead", "Finance Manager", "Finance Director"],
            ["Capex Purchases", "Finance Manager", "Finance Director", "CFO"],
          ],
        },
      },
      {
        id: "fp14-note",
        type: "note",
        text: "All expenses above ₹1,00,000 require CFO approval.",
      },
      { id: "fp14-reporting", type: "subheading", text: "6.2 Expense Reporting" },
      {
        id: "fp14-reporting-list",
        type: "list",
        items: [
          "All expenses must be reported within 5 working days.",
          "Supporting documents are mandatory for reimbursement.",
          "Failure to comply may result in delayed or rejected claims.",
        ],
      },
    ],
  },
};
