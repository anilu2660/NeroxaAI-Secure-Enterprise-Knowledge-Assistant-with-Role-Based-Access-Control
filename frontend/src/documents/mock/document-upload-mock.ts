import type {
  DocumentUploadConstraints,
  DocumentServiceStatus,
  UploadWorkflowStage,
} from "@/api/types";

/**
 * Frontend-enforced upload constraints. These are real: the browser checks
 * extension, MIME type, and size before anything else happens. They say
 * nothing about what a server would accept.
 */
export const prototypeUploadConstraints: DocumentUploadConstraints = {
  supportedFiles: [
    {
      extension: "PDF",
      label: "Portable Document Format",
      mimeTypes: ["application/pdf"],
    },
    {
      extension: "DOCX",
      label: "Microsoft Word Document",
      mimeTypes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    },
    {
      extension: "TXT",
      label: "Plain Text Document",
      mimeTypes: ["text/plain"],
    },
  ],
  acceptAttribute: ".pdf,.docx,.txt",
  maxSizeBytes: 50 * 1024 * 1024,
  maxSizeLabel: "50 MB",
};

export const prototypeDocumentServiceStatus: DocumentServiceStatus = {
  state: "connected",
  label: "Document ingestion service active",
  detail:
    "FastAPI document ingestion service is connected. Uploaded documents will be parsed, chunked, embedded, and indexed into Qdrant.",
};

/**
 * Ingestion pipeline stages.
 */
export const prototypeUploadWorkflow: UploadWorkflowStage[] = [
  {
    id: "select",
    label: "Select File",
    owner: "frontend",
    state: "available",
    detail: "Administrator chooses a local document.",
  },
  {
    id: "validate",
    label: "Validate",
    owner: "frontend",
    state: "available",
    detail: "Browser checks file type and size.",
  },
  {
    id: "metadata",
    label: "Metadata",
    owner: "frontend",
    state: "available",
    detail: "Name, department, type, access scope, description.",
  },
  {
    id: "upload",
    label: "Upload",
    owner: "backend",
    state: "available",
    detail: "Transfer to the document service endpoint.",
  },
  {
    id: "storage",
    label: "Storage",
    owner: "backend",
    state: "available",
    detail: "Persist the document in database storage.",
  },
  {
    id: "parse",
    label: "Parse",
    owner: "backend",
    state: "available",
    detail: "Extract text from the stored document.",
  },
  {
    id: "chunk",
    label: "Chunk",
    owner: "backend",
    state: "available",
    detail: "Split extracted text into retrievable segments.",
  },
  {
    id: "embed",
    label: "Embed",
    owner: "backend",
    state: "available",
    detail: "Generate embeddings for each segment.",
  },
  {
    id: "index",
    label: "Vector Index",
    owner: "backend",
    state: "available",
    detail: "Write vectors to the vector database.",
  },
  {
    id: "available",
    label: "Knowledge Available",
    owner: "backend",
    state: "available",
    detail: "Document becomes retrievable to authorized users.",
  },
];

/** Document-type vocabulary offered on the upload form. */
export const prototypeUploadDocumentTypes = [
  "Policy",
  "SOP",
  "Handbook",
  "Report",
  "Contract",
  "Specification",
  "Guideline",
];
