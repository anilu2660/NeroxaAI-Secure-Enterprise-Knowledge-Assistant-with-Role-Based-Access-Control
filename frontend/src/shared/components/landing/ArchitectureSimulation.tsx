import { useState, useEffect } from "react";
import {
  Play,
  RotateCcw,
  ShieldCheck,
  Server,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  XCircle,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";

type SimulationMode = "standard" | "cache_hit" | "rbac_blocked";

interface SimStep {
  nodeId: string;
  label: string;
  status: "idle" | "active" | "success" | "blocked";
  latencyMs: number;
  log: string;
}

export function ArchitectureSimulation() {
  const [mode, setMode] = useState<SimulationMode>("standard");
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  const getStepsForMode = (m: SimulationMode): SimStep[] => {
    switch (m) {
      case "standard":
        return [
          {
            nodeId: "client",
            label: "Client Request",
            status: "success",
            latencyMs: 8,
            log: 'POST /api/v1/rag/query · User: "Finance Manager"',
          },
          {
            nodeId: "gateway",
            label: "FastAPI Gateway",
            status: "success",
            latencyMs: 14,
            log: "JWT validated · Twilio 2FA verified · Session active",
          },
          {
            nodeId: "rbac",
            label: "RBAC Engine",
            status: "success",
            latencyMs: 18,
            log: 'Boundary matched: Dept="Finance", Tier="Level-2"',
          },
          {
            nodeId: "vector",
            label: "Qdrant Vector DB",
            status: "success",
            latencyMs: 46,
            log: "Dense Cosine Search + BAAI Reranker Top-5 retrieved",
          },
          {
            nodeId: "ollama",
            label: "Local Ollama LLM",
            status: "success",
            latencyMs: 78,
            log: "Synthesized grounded answer with p.14 citation",
          },
          {
            nodeId: "client",
            label: "Response Delivered",
            status: "success",
            latencyMs: 164,
            log: "Status 200 OK · Payload rendered with citation badge",
          },
        ];
      case "cache_hit":
        return [
          {
            nodeId: "client",
            label: "Client Request",
            status: "success",
            latencyMs: 6,
            log: 'POST /api/v1/rag/query · User: "Engineer"',
          },
          {
            nodeId: "gateway",
            label: "FastAPI Gateway",
            status: "success",
            latencyMs: 10,
            log: "JWT validated · Session authorized",
          },
          {
            nodeId: "rbac",
            label: "RBAC Engine",
            status: "success",
            latencyMs: 14,
            log: "Boundary cleared for Engineering department",
          },
          {
            nodeId: "cache",
            label: "Redis Semantic Cache",
            status: "success",
            latencyMs: 22,
            log: "CACHE_HIT: 0.998 semantic similarity match found in Redis",
          },
          {
            nodeId: "client",
            label: "Instant Cache Return",
            status: "success",
            latencyMs: 24,
            log: "Status 200 OK (Redis Hit) · GPU/LLM bypassed entirely",
          },
        ];
      case "rbac_blocked":
        return [
          {
            nodeId: "client",
            label: "Unauthorized Request",
            status: "success",
            latencyMs: 6,
            log: 'POST /api/v1/rag/query · Target: "Executive Payroll"',
          },
          {
            nodeId: "gateway",
            label: "FastAPI Gateway",
            status: "success",
            latencyMs: 11,
            log: "JWT validated (Marketing Specialist)",
          },
          {
            nodeId: "rbac",
            label: "RBAC Boundary Check",
            status: "blocked",
            latencyMs: 18,
            log: "DENIED: User lacks Tier-1 Executive Clearance",
          },
          {
            nodeId: "audit",
            label: "Security Audit Logger",
            status: "blocked",
            latencyMs: 21,
            log: "Immutable 403 Audit Event #9102 logged to disk",
          },
          {
            nodeId: "client",
            label: "Forbidden 403 Returned",
            status: "blocked",
            latencyMs: 25,
            log: "403 Forbidden · Zero vectors or LLM prompts exposed",
          },
        ];
    }
  };

  const steps = getStepsForMode(mode);

  // Auto progression when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveStepIndex((prev) => {
          if (prev < steps.length - 1) {
            const next = prev + 1;
            const nextStep = steps[next];
            if (nextStep) {
              setElapsedMs(nextStep.latencyMs);
            }
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 750);
    }
    return () => clearInterval(interval);
  }, [isPlaying, steps]);

  const handleStart = (newMode: SimulationMode) => {
    setMode(newMode);
    setActiveStepIndex(0);
    setElapsedMs(0);
    setIsPlaying(true);
  };

  const activeNodeId = steps[activeStepIndex]?.nodeId;

  return (
    <section id="architecture" className="relative mx-auto w-full max-w-[1280px] px-6 py-16">
      <div className="max-w-2xl">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
          System Architecture Simulation
        </span>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Interactive request &amp; token flow simulation.
        </h2>
        <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
          Simulate live queries across the NeroxaAI pipeline. Inspect how requests traverse through the Gateway, deterministic RBAC boundaries, semantic cache, vector store, and private local LLM.
        </p>
      </div>

      {/* Main Simulation Container */}
      <div className="mt-10 rounded-[10px] border border-border bg-card shadow-sm overflow-hidden">
        {/* Simulation Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border bg-secondary/40 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] font-semibold text-foreground">
              Simulation Scenario:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleStart("standard")}
                className={`rounded-[6px] border px-3 py-1 text-[11px] font-medium transition-colors ${
                  mode === "standard"
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Standard Vector Retrieval
              </button>
              <button
                type="button"
                onClick={() => handleStart("cache_hit")}
                className={`rounded-[6px] border px-3 py-1 text-[11px] font-medium transition-colors ${
                  mode === "cache_hit"
                    ? "border-primary bg-primary text-primary-foreground font-semibold"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Redis Semantic Cache Hit (&lt; 25ms)
              </button>
              <button
                type="button"
                onClick={() => handleStart("rbac_blocked")}
                className={`rounded-[6px] border px-3 py-1 text-[11px] font-medium transition-colors ${
                  mode === "rbac_blocked"
                    ? "border-destructive bg-destructive text-destructive-foreground font-semibold"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                }`}
              >
                Unauthorized Attempt (403 Blocked)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-[12px] text-foreground bg-background px-2.5 py-1 rounded-[6px] border border-border">
              <span className="text-muted-foreground text-[10px]">EXECUTION TIME:</span>
              <span className="font-bold text-primary">{elapsedMs}ms</span>
            </div>

            <button
              type="button"
              onClick={() => handleStart(mode)}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-secondary px-3 py-1 text-[11px] font-medium text-foreground hover:bg-secondary/80 border border-border"
            >
              <RotateCcw className="size-3" />
              Replay
            </button>
          </div>
        </div>

        {/* Visual Node Diagram Canvas */}
        <div className="p-6 lg:p-8 bg-secondary/15 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Node 1: Client Layer */}
            <div
              className={`rounded-[8px] border p-4 transition-all ${
                activeNodeId === "client"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">01. Ingress</span>
                <span className="size-2 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h4 className="font-display text-[13px] font-bold text-foreground">Client UI / REST</h4>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">React 19 + TanStack</p>
            </div>

            {/* Node 2: FastAPI Gateway */}
            <div
              className={`rounded-[8px] border p-4 transition-all ${
                activeNodeId === "gateway"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">02. Gateway</span>
                <Lock className="size-3 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Server className="size-4 text-primary" />
                <h4 className="font-display text-[13px] font-bold text-foreground">FastAPI Auth</h4>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">JWT &amp; Twilio 2FA</p>
            </div>

            {/* Node 3: RBAC Middleware */}
            <div
              className={`rounded-[8px] border p-4 transition-all ${
                activeNodeId === "rbac" || activeNodeId === "audit"
                  ? mode === "rbac_blocked"
                    ? "border-destructive bg-destructive/10 shadow-sm ring-1 ring-destructive"
                    : "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">03. Security</span>
                <ShieldCheck className="size-3 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <ShieldCheck
                  className={`size-4 ${mode === "rbac_blocked" ? "text-destructive" : "text-primary"}`}
                />
                <h4 className="font-display text-[13px] font-bold text-foreground">RBAC Evaluator</h4>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Deterministic ACL</p>
            </div>

            {/* Node 4: Cache & Vector Engine */}
            <div
              className={`rounded-[8px] border p-4 transition-all ${
                activeNodeId === "vector" || activeNodeId === "cache"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">04. Retrieval</span>
                <Database className="size-3 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Database className="size-4 text-primary" />
                <h4 className="font-display text-[13px] font-bold text-foreground">Qdrant &amp; Redis</h4>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Cosine + BGE Reranker</p>
            </div>

            {/* Node 5: Private Ollama LLM */}
            <div
              className={`rounded-[8px] border p-4 transition-all ${
                activeNodeId === "ollama"
                  ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-muted-foreground">05. Synthesis</span>
                <Cpu className="size-3 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Cpu className="size-4 text-primary" />
                <h4 className="font-display text-[13px] font-bold text-foreground">Local Ollama</h4>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Air-Gapped Qwen 2.5</p>
            </div>
          </div>

          {/* Live Step Execution Console */}
          <div className="rounded-[8px] border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="font-mono text-[11px] font-bold uppercase text-muted-foreground">
                Step-by-Step Packet Trace ({activeStepIndex + 1} of {steps.length})
              </span>
              <span className="font-mono text-[11px] text-primary">
                Active Node: {steps[activeStepIndex]?.label}
              </span>
            </div>

            <div className="space-y-1.5">
              {steps.slice(0, activeStepIndex + 1).map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between font-mono text-[11.5px] p-1.5 rounded-[4px] bg-secondary/30"
                >
                  <div className="flex items-center gap-2">
                    {step.status === "blocked" ? (
                      <XCircle className="size-3.5 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span className="text-foreground font-semibold">[{step.label}]</span>
                    <span className="text-muted-foreground">{step.log}</span>
                  </div>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    +{step.latencyMs}ms
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
