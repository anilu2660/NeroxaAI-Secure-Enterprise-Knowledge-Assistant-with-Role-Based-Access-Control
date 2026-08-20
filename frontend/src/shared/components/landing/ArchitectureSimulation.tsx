import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Code2,
  Fingerprint,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  ExternalLink,
  Flame,
  Binary,
  HardDrive,
  Activity,
} from "lucide-react";

type ScenarioId = "rag_query" | "cache_hit" | "doc_ingest" | "rbac_block";

interface WorkflowNode {
  id: string;
  name: string;
  category: "source" | "gateway" | "security" | "storage" | "ai" | "output";
  icon: any;
  sublabel: string;
  config: Record<string, any>;
  inputSchema: any;
  outputSchema: any;
}

const ALL_NODES: Record<string, WorkflowNode> = {
  client: {
    id: "client",
    name: "Client Ingress",
    category: "source",
    icon: Layers,
    sublabel: "React 19 + TanStack",
    config: { transport: "HTTP/2 REST + SSE", encryption: "TLS 1.3" },
    inputSchema: { query: "What is our reimbursement cap?", user_id: "usr_fin_489" },
    outputSchema: { session_id: "ses_9a82b", token_count: 8 },
  },
  doc_source: {
    id: "doc_source",
    name: "Document Upload",
    category: "source",
    icon: FolderOpen,
    sublabel: "PDF / DOCX / TXT",
    config: { max_file_size: "50MB", allowed_formats: ["pdf", "docx", "txt"] },
    inputSchema: { filename: "Global_Expense_Policy_2025.pdf", size_bytes: 2849120 },
    outputSchema: { status: "received", buffer_ready: true },
  },
  gateway: {
    id: "gateway",
    name: "FastAPI Gateway",
    category: "gateway",
    icon: Server,
    sublabel: "JWT & 2FA Auth",
    config: { rate_limit: "100 req/min", auth: "Bearer JWT + Twilio SMS" },
    inputSchema: { bearer_token: "eyJhbGciOiJIUzI1Ni...", client_ip: "10.0.4.12" },
    outputSchema: { claims: { role: "Finance_Manager", dept: "Finance", clearance: 3 } },
  },
  rbac_engine: {
    id: "rbac_engine",
    name: "Deterministic RBAC",
    category: "security",
    icon: ShieldCheck,
    sublabel: "Deny-by-Default ACL",
    config: { policy_engine: "Query-Time Filtering", isolation: "Multi-Tenant" },
    inputSchema: { user_dept: "Finance", target_scope: "Finance Knowledge" },
    outputSchema: { authorized: true, filter_clause: 'department == "Finance"' },
  },
  dedup_chunker: {
    id: "dedup_chunker",
    name: "SHA-256 & Chunker",
    category: "security",
    icon: Binary,
    sublabel: "512-Token Overlap",
    config: { chunk_size: 512, chunk_overlap: 64, hasher: "SHA-256" },
    inputSchema: { raw_text_chars: 48200, doc_id: "doc_8f94e21" },
    outputSchema: { sha256_hash: "e3b0c44298fc1c...", total_chunks: 48, dedup_status: "unique" },
  },
  embedder: {
    id: "embedder",
    name: "Embeddings Engine",
    category: "ai",
    icon: Cpu,
    sublabel: "BAAI/bge-small-en-v1.5",
    config: { dimension: 384, pooling: "cls", normalize: true },
    inputSchema: { batch_size: 48, text_length_avg: 480 },
    outputSchema: { embeddings_shape: [48, 384], vectors_computed: 48 },
  },
  redis_cache: {
    id: "redis_cache",
    name: "Redis Semantic Cache",
    category: "storage",
    icon: Zap,
    sublabel: "Similarity Threshold > 0.95",
    config: { cache_engine: "Redis Stack", ttl: "3600s", distance_metric: "cosine" },
    inputSchema: { query_vector: "[0.042, -0.198, ...]" },
    outputSchema: { cache_status: "MISS", similarity: 0.74, proceed_to_vector_db: true },
  },
  qdrant_db: {
    id: "qdrant_db",
    name: "Qdrant Vector DB",
    category: "storage",
    icon: Database,
    sublabel: "HNSW Cosine Search",
    config: { collection: "enterprise_kb", hnsw_ef: 128, m: 16 },
    inputSchema: { filter: { must: [{ key: "department", match: { value: "Finance" } }] }, top_k: 25 },
    outputSchema: { hits_count: 25, top_match_score: 0.942, latency_ms: 32 },
  },
  reranker: {
    id: "reranker",
    name: "BAAI Cross-Encoder",
    category: "ai",
    icon: Activity,
    sublabel: "BGE Reranker-Large",
    config: { score_threshold: 0.70, final_top_k: 5 },
    inputSchema: { candidate_pairs: 25 },
    outputSchema: { reranked_chunks: 5, top_confidence: "98.4%", false_positives_eliminated: 20 },
  },
  ollama_llm: {
    id: "ollama_llm",
    name: "Local Ollama LLM",
    category: "ai",
    icon: Cpu,
    sublabel: "Air-Gapped Qwen 2.5",
    config: { model: "qwen2.5:7b-instruct", temperature: 0.0, context_window: 8192 },
    inputSchema: { prompt_tokens: 1840, system_context_chunks: 5 },
    outputSchema: { synthesized_tokens: 142, citations_bound: 2, finish_reason: "stop" },
  },
  audit_logger: {
    id: "audit_logger",
    name: "Security Audit Log",
    category: "security",
    icon: Fingerprint,
    sublabel: "Cryptographic Ledger",
    config: { storage: "PostgreSQL WAL + Append-Only", retention: "7 Years" },
    inputSchema: { event_type: "RBAC_VIOLATION_403", actor_id: "usr_mkt_102" },
    outputSchema: { event_id: "aud_9102", hash: "0x892a...c1e9", immutable_commit: true },
  },
  output_stream: {
    id: "output_stream",
    name: "Verifiable Response",
    category: "output",
    icon: FileText,
    sublabel: "SSE Stream + Citations",
    config: { format: "Markdown + Page Provenance Badges", delivery: "Instant" },
    inputSchema: { answer_text: "Per Section 4.2 of the Global Expense Policy...", citations: ["p.14", "p.3"] },
    outputSchema: { status: 200, latency_total_ms: 142 },
  },
};

interface ScenarioConfig {
  id: ScenarioId;
  name: string;
  badge: string;
  description: string;
  path: string[];
  timing: number[];
  logs: string[];
  finalMetric: string;
}

const SCENARIOS: Record<ScenarioId, ScenarioConfig> = {
  rag_query: {
    id: "rag_query",
    name: "Grounded RAG Query Flow",
    badge: "Primary RAG Flow · 142ms",
    description:
      "A Finance Manager asks a policy question. Request passes through JWT 2FA, is filtered at query time by the RBAC engine, retrieves candidate chunks from Qdrant, is reranked by the BAAI Cross-Encoder, and is synthesized locally by Ollama with page citations.",
    path: ["client", "gateway", "rbac_engine", "redis_cache", "qdrant_db", "reranker", "ollama_llm", "output_stream"],
    timing: [8, 14, 18, 24, 56, 82, 128, 142],
    logs: [
      "Client Ingress: POST /api/v1/rag/query received from Finance Manager",
      "FastAPI Gateway: JWT validated, Twilio 2FA session authenticated",
      "RBAC Engine: Authorized boundary verified for [Finance Knowledge]",
      "Redis Cache: Cache MISS (0.74 similarity) -> Forwarding to vector search",
      "Qdrant DB: Filtered HNSW dense search retrieved 25 candidates (match: 0.942)",
      "Cross-Encoder: BAAI reranking pruned 20 false positives, retained Top-5",
      "Local Ollama: Qwen2.5 synthesized grounded response with Section 4.2 citation",
      "Response Stream: 200 OK delivered with interactive citation badges",
    ],
    finalMetric: "142ms Total Latency",
  },
  cache_hit: {
    id: "cache_hit",
    name: "Semantic Cache Hit (< 25ms)",
    badge: "Redis Hit · 22ms",
    description:
      "A repeated or semantically equivalent query arrives. The Redis vector cache detects 0.998 cosine similarity, bypassing Qdrant and Ollama entirely, returning an instant cited response in 22ms with 0 GPU utilization.",
    path: ["client", "gateway", "rbac_engine", "redis_cache", "output_stream"],
    timing: [6, 11, 15, 20, 22],
    logs: [
      "Client Ingress: POST /api/v1/rag/query received from Staff Engineer",
      "FastAPI Gateway: Session claims verified",
      "RBAC Engine: Engineering department scope approved",
      "Redis Cache: CACHE_HIT (0.998 semantic match) -> GPU/LLM bypassed",
      "Response Stream: Instant cached response returned with verified source provenance",
    ],
    finalMetric: "22ms Total Latency (0 GPU Cost)",
  },
  doc_ingest: {
    id: "doc_ingest",
    name: "Document Ingestion & Chunking",
    badge: "Ingestion Pipeline · 48 Chunks",
    description:
      "An administrator uploads a 42-page PDF policy manual. FastAPI verifies SHA-256 hash deduplication, recursively splits the text into 512-token chunks with 64-token overlap, computes 384-dimensional BGE embeddings, and upserts them to Qdrant.",
    path: ["doc_source", "gateway", "dedup_chunker", "embedder", "qdrant_db"],
    timing: [12, 24, 48, 110, 158],
    logs: [
      "Document Upload: Global_Expense_Policy_2025.pdf (2.8MB) uploaded",
      "FastAPI Gateway: File format validated and scanned",
      "SHA-256 Chunker: Hash computed, split into 48 overlapping 512-token segments",
      "Embedder: BAAI/bge-small-en batch generated 48 dense 384-d vectors",
      "Qdrant DB: Vector payloads successfully indexed with HNSW links",
    ],
    finalMetric: "158ms (48 Vectors Indexed)",
  },
  rbac_block: {
    id: "rbac_block",
    name: "Zero-Trust RBAC Interception (403)",
    badge: "Security Block · 24ms",
    description:
      "An unauthorized employee attempts to query Executive Compensation vectors. The RBAC engine instantly rejects the query before vector search or LLM prompts occur, and records an immutable forensic event to the audit log.",
    path: ["client", "gateway", "rbac_engine", "audit_logger"],
    timing: [6, 12, 18, 24],
    logs: [
      "Client Ingress: Target query for Executive Compensation bands",
      "FastAPI Gateway: Token decoded (User: Marketing Specialist, Level 1)",
      "RBAC Engine: ACCESS_DENIED. Clearance Level 3 required for Target Vector",
      "Security Audit: Forensic 403 event #9102 immutably recorded to disk",
    ],
    finalMetric: "403 Forbidden (0 Vectors Leaked)",
  },
};

export function ArchitectureSimulation() {
  const [activeScenario, setActiveScenario] = useState<ScenarioId>("rag_query");
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("rbac_engine");

  const scenario = SCENARIOS[activeScenario];
  const activeNodeId = scenario.path[currentStepIndex] ?? scenario.path[0]!;
  const selectedNode = ALL_NODES[selectedNodeId] || ALL_NODES["rbac_engine"]!;

  // Auto-play timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      const delay = Math.max(250, 800 / speed);
      interval = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev < scenario.path.length - 1) {
            const next = prev + 1;
            const nextNode = scenario.path[next];
            if (nextNode) setSelectedNodeId(nextNode);
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, delay);
    }
    return () => clearInterval(interval);
  }, [isPlaying, scenario.path, speed]);

  const handleScenarioChange = (id: ScenarioId) => {
    setActiveScenario(id);
    setCurrentStepIndex(0);
    const firstNode = SCENARIOS[id].path[0] || "client";
    setSelectedNodeId(firstNode);
    setIsPlaying(true);
  };

  const handleStepForward = () => {
    if (currentStepIndex < scenario.path.length - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      const nextNode = scenario.path[next];
      if (nextNode) setSelectedNodeId(nextNode);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    const firstNode = scenario.path[0] || "client";
    setSelectedNodeId(firstNode);
  };

  // Node position coordinates for clean SVG flow connections
  const NODE_LAYOUT: { [key: string]: { col: number; row: number } } = {
    client: { col: 1, row: 1 },
    doc_source: { col: 1, row: 2 },
    gateway: { col: 2, row: 1 },
    rbac_engine: { col: 3, row: 1 },
    dedup_chunker: { col: 2, row: 2 },
    redis_cache: { col: 4, row: 1 },
    embedder: { col: 3, row: 2 },
    qdrant_db: { col: 4, row: 2 },
    reranker: { col: 5, row: 1 },
    ollama_llm: { col: 5, row: 2 },
    audit_logger: { col: 3, row: 3 },
    output_stream: { col: 6, row: 1 },
  };

  return (
    <section id="architecture" className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 py-12 sm:py-16">
      {/* Section Header */}
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          Interactive Architecture Simulation
        </span>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
          Visual request &amp; token flow workflow engine.
        </h2>
        <p className="mt-2.5 sm:mt-3 text-[13px] sm:text-[14px] leading-relaxed text-muted-foreground">
          Simulate real-time requests traversing the Nexora AI zero-trust pipeline. Inspect node inputs, outputs, query-time vector boundaries, and local inference telemetry.
        </p>
      </div>

      {/* Main n8n-Style Workflow Canvas Container */}
      <div className="mt-8 sm:mt-10 rounded-[10px] border border-border bg-card shadow-sm overflow-hidden">
        {/* Top Workflow Control Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-border bg-secondary/40 px-3 sm:px-4 py-2.5 sm:py-3">
          {/* Scenario Trigger Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="font-mono text-[10.5px] sm:text-[11px] font-semibold text-muted-foreground mr-1 shrink-0">
              WORKFLOW:
            </span>
            {(Object.keys(SCENARIOS) as ScenarioId[]).map((id) => {
              const sc = SCENARIOS[id];
              const isActive = activeScenario === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleScenarioChange(id)}
                  className={`shrink-0 rounded-[6px] border px-2.5 py-1 text-[10.5px] sm:text-[11px] font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "border-primary bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  {sc.name}
                </button>
              );
            })}
          </div>

          {/* Playback Controls & Telemetry */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1 rounded-[6px] border border-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? "Pause simulation" : "Play simulation"}
                className="grid size-7 place-items-center rounded-[4px] bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5 ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleStepForward}
                disabled={isPlaying || currentStepIndex >= scenario.path.length - 1}
                title="Step forward"
                className="grid size-7 place-items-center rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-40 cursor-pointer"
              >
                <SkipForward className="size-3.5" />
              </button>

              <button
                type="button"
                onClick={handleReset}
                title="Reset workflow"
                className="grid size-7 place-items-center rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              >
                <RotateCcw className="size-3.5" />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex items-center rounded-[6px] border border-border bg-background p-0.5 font-mono text-[10px]">
              {[1, 2].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-1.5 py-0.5 rounded-[3px] transition-colors cursor-pointer ${
                    speed === s ? "bg-secondary text-foreground font-bold" : "text-muted-foreground"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Latency Telemetry Chip */}
            <div className="flex items-center gap-1.5 font-mono text-[10.5px] sm:text-[11px] bg-background px-2 sm:px-2.5 py-1 rounded-[6px] border border-border shrink-0">
              <span className="text-muted-foreground text-[9.5px] sm:text-[10px]">LATENCY:</span>
              <span className="font-bold text-primary">
                +{scenario.timing[currentStepIndex] || 0}ms
              </span>
            </div>
          </div>
        </div>

        {/* Workflow Canvas Body (Split: Node Grid + Inspector Drawer) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Node Grid Canvas Area */}
          <div className="p-3.5 sm:p-5 lg:col-span-8 bg-secondary/10 space-y-4 sm:space-y-6">
            {/* Canvas Header Status Banner */}
            <div className="flex items-center justify-between rounded-[6px] border border-border bg-background px-3 py-2 text-[10.5px] sm:text-[11px] font-mono">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`size-2 shrink-0 rounded-full ${
                    isPlaying ? "bg-emerald-500 animate-pulse" : "bg-primary"
                  }`}
                />
                <span className="font-semibold text-foreground truncate">{scenario.badge}</span>
              </div>
              <span className="text-muted-foreground shrink-0">
                Step {currentStepIndex + 1}/{scenario.path.length}
              </span>
            </div>

            {/* Visual Node Grid (Interactive n8n Node Blocks) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {Object.values(ALL_NODES).map((node) => {
                const Icon = node.icon;
                const isInCurrentScenario = scenario.path.includes(node.id);
                const stepIndexInPath = scenario.path.indexOf(node.id);
                const isCurrentlyActive = scenario.path[currentStepIndex] === node.id;
                const isCompleted = isInCurrentScenario && stepIndexInPath <= currentStepIndex;
                const isSelected = selectedNodeId === node.id;
                const isBlockedNode = node.id === "audit_logger" && activeScenario === "rbac_block";

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative text-left rounded-[8px] border p-2.5 sm:p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-primary border-primary bg-card shadow-sm"
                        : isCurrentlyActive
                          ? "border-primary bg-primary/10 shadow-xs animate-pulse"
                          : isCompleted
                            ? isBlockedNode
                              ? "border-destructive/40 bg-destructive/5"
                              : "border-emerald-500/30 bg-emerald-500/5"
                            : "border-border bg-card/60 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* Node Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-[4px] ${
                            isCurrentlyActive
                              ? "bg-primary text-primary-foreground"
                              : isCompleted
                                ? isBlockedNode
                                  ? "bg-destructive/15 text-destructive"
                                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <span className="truncate font-display text-[11.5px] sm:text-[12px] font-bold text-foreground">
                          {node.name}
                        </span>
                      </div>

                      {/* Status Indicator Pill */}
                      {isCurrentlyActive ? (
                        <span className="size-2 rounded-full bg-primary animate-ping shrink-0" />
                      ) : isCompleted ? (
                        isBlockedNode ? (
                          <XCircle className="size-3.5 text-destructive shrink-0" />
                        ) : (
                          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                        )
                      ) : (
                        <span className="size-1.5 rounded-full bg-border shrink-0" />
                      )}
                    </div>

                    <p className="mt-1 text-[9.5px] sm:text-[10px] text-muted-foreground font-mono truncate">
                      {node.sublabel}
                    </p>

                    {/* Step Timing Tag */}
                    {isCompleted && stepIndexInPath !== -1 && (
                      <div className="mt-1.5 sm:mt-2 flex items-center justify-between border-t border-border/50 pt-1 text-[9px] sm:text-[9.5px] font-mono text-muted-foreground">
                        <span>STAGE 0{stepIndexInPath + 1}</span>
                        <span className="font-semibold text-foreground">
                          +{scenario.timing[stepIndexInPath]}ms
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Packet Execution Stream */}
            <div className="rounded-[8px] border border-border bg-background p-3 sm:p-3.5 space-y-2">
              <div className="flex items-center justify-between border-b border-border pb-1.5 text-[10px] sm:text-[10.5px] font-mono">
                <span className="text-muted-foreground uppercase font-bold truncate mr-2">
                  Trace ({currentStepIndex + 1}/{scenario.path.length})
                </span>
                <span className="text-primary font-semibold shrink-0">{scenario.finalMetric}</span>
              </div>
              <div className="space-y-1 max-h-24 sm:max-h-28 overflow-y-auto font-mono text-[10.5px] sm:text-[11px]">
                {scenario.logs.slice(0, currentStepIndex + 1).map((log, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 sm:gap-2 text-foreground/90 py-0.5">
                    <span className="text-muted-foreground text-[9.5px] sm:text-[10px] shrink-0">[{idx + 1}]</span>
                    <span className="break-words leading-tight">{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Node Inspector Drawer */}
          <div className="p-3.5 sm:p-5 lg:col-span-4 bg-background flex flex-col justify-between space-y-4">
            <div className="space-y-3 sm:space-y-4">
              {/* Selected Node Header */}
              <div className="flex items-center justify-between border-b border-border pb-2.5 sm:pb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Code2 className="size-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <h4 className="font-display text-[12.5px] sm:text-[13px] font-bold text-foreground truncate">
                      Node: {selectedNode.name}
                    </h4>
                    <p className="text-[9.5px] sm:text-[10px] text-muted-foreground font-mono truncate">
                      Category: {selectedNode.category.toUpperCase()}
                    </p>
                  </div>
                </div>
                <span className="rounded-[4px] border border-border bg-secondary/40 px-1.5 sm:px-2 py-0.5 font-mono text-[9.5px] sm:text-[10px] text-foreground shrink-0">
                  ID: {selectedNode.id}
                </span>
              </div>

              {/* Node Config Parameters */}
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-1">
                  Engine Parameters:
                </p>
                <div className="rounded-[6px] border border-border bg-secondary/20 p-2 sm:p-2.5 font-mono text-[10px] sm:text-[10.5px] space-y-1">
                  {Object.entries(selectedNode.config).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground truncate">{key}:</span>
                      <span className="text-foreground font-medium truncate">
                        {Array.isArray(val) ? val.join(", ") : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Schema / Payload */}
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-1">
                  Node Input Payload:
                </p>
                <div className="rounded-[6px] border border-border bg-secondary/30 p-2 sm:p-2.5 font-mono text-[10.5px] sm:text-[11px] overflow-x-auto max-h-24 sm:max-h-28">
                  <pre className="text-foreground/90">
                    {JSON.stringify(selectedNode.inputSchema, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Output Schema / Payload */}
              <div>
                <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-1">
                  Node Output Result:
                </p>
                <div className="rounded-[6px] border border-border bg-secondary/30 p-2 sm:p-2.5 font-mono text-[10.5px] sm:text-[11px] overflow-x-auto max-h-24 sm:max-h-28">
                  <pre className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {JSON.stringify(selectedNode.outputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Footer Trust Stamp */}
            <div className="pt-2.5 sm:pt-3 border-t border-border flex items-center justify-between text-[10px] sm:text-[10.5px] font-mono text-muted-foreground">
              <span>Deterministic Execution</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Air-Gapped
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
