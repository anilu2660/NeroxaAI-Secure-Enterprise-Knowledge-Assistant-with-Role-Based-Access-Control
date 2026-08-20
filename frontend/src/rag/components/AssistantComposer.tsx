import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  BarChart3,
  Calculator,
  Cpu,
  Database,
  FileCode,
  FileSearch,
  FileText,
  Globe,
  ImagePlus,
  ListTodo,
  Paperclip,
  Quote,
  SendHorizontal,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Terminal,
  X,
} from "lucide-react";
import type { AssistantAttachment, AssistantToolOption } from "@/api/types";
import {
  acceptedDocumentTypes,
  acceptedImageTypes,
  defaultToolIds,
} from "@/rag/mock/assistant-tools";

export interface ComposerSubmission {
  question: string;
  attachments: File[];
  webSearch: boolean;
  toolIds: string[];
}

function sizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getToolIcon(toolId: string) {
  switch (toolId) {
    case "web-search":
      return <Globe className="size-3.5 text-sky-500" />;
    case "citations":
      return <Quote className="size-3.5 text-purple-500" />;
    case "chart-generator":
      return <BarChart3 className="size-3.5 text-emerald-500" />;
    case "executive-summary":
      return <FileText className="size-3.5 text-amber-500" />;
    case "compliance-checker":
      return <ShieldCheck className="size-3.5 text-rose-500" />;
    case "action-planner":
      return <ListTodo className="size-3.5 text-indigo-500" />;
    case "calculator":
      return <Calculator className="size-3.5 text-yellow-500" />;
    case "sql-generator":
      return <Terminal className="size-3.5 text-cyan-500" />;
    case "file-analysis":
      return <FileCode className="size-3.5 text-teal-500" />;
    default:
      return <Sparkles className="size-3.5 text-primary" />;
  }
}

export function AssistantComposer({
  onSubmit,
  onStop,
  pending,
  suggestions,
  activeModelLabel,
  tools,
}: {
  onSubmit: (submission: ComposerSubmission) => void;
  onStop?: () => void;
  pending: boolean;
  suggestions: string[];
  /** Label of the currently selected reasoning model, shown for transparency. */
  activeModelLabel?: string;
  /** Tool catalog from the service layer. */
  tools: AssistantToolOption[];
}) {
  const [question, setQuestion] = useState("");
  const [files, setFiles] = useState<{ file: File; meta: AssistantAttachment }[]>([]);
  const [webSearch, setWebSearch] = useState(false);
  const [toolIds, setToolIds] = useState<string[]>(() => defaultToolIds);
  const [toolsOpen, setToolsOpen] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toolsWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!toolsWrapperRef.current?.contains(event.target as Node)) {
        setToolsOpen(false);
      }
    }
    if (toolsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [toolsOpen]);

  const enabledToolCount = useMemo(() => {
    return tools.filter((tool) => {
      if (tool.id === "web-search") return webSearch;
      return toolIds.includes(tool.id);
    }).length;
  }, [tools, toolIds, webSearch]);

  const handleAddFiles = (incoming: FileList | null, kind: "document" | "image") => {
    if (!incoming?.length) return;
    const next: { file: File; meta: AssistantAttachment }[] = Array.from(incoming).map((file) => ({
      file,
      meta: {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        sizeLabel: sizeLabel(file.size),
        kind,
      },
    }));
    setFiles((prev) => [...prev, ...next]);
  };

  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.meta.id !== id));
  };

  const handleToggleGlobe = () => {
    setWebSearch((prev) => !prev);
  };

  const toggleTool = (tool: AssistantToolOption) => {
    if (tool.id === "web-search") {
      setWebSearch((prev) => !prev);
      return;
    }
    setToolIds((prev) =>
      prev.includes(tool.id) ? prev.filter((id) => id !== tool.id) : [...prev, tool.id],
    );
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!question.trim() || pending) return;

    onSubmit({
      question: question.trim(),
      attachments: files.map((f) => f.file),
      webSearch,
      toolIds,
    });
    setQuestion("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-3 px-1">
      <form
        onSubmit={handleSubmit}
        className="rounded-[10px] border border-border bg-card p-3 shadow-xs space-y-2.5"
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-1">
            {files.map(({ meta }) => (
              <span
                key={meta.id}
                className="inline-flex items-center gap-1.5 rounded-[4px] border border-border bg-secondary/40 px-2 py-1 font-mono text-[11px] text-foreground"
              >
                <Paperclip className="size-3 text-muted-foreground" />
                <span className="max-w-[140px] truncate">{meta.name}</span>
                <span className="text-[9.5px] text-muted-foreground">({meta.sizeLabel})</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(meta.id)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question grounded in authorized documents (Shift+Enter for new line)..."
          rows={2}
          disabled={pending}
          className="w-full resize-none bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none leading-relaxed"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2">
          {/* Left: Attachment & Tool Triggers */}
          <div className="flex items-center gap-1.5">
            <input
              ref={docInputRef}
              type="file"
              multiple
              accept={acceptedDocumentTypes}
              onChange={(e) => handleAddFiles(e.target.files, "document")}
              className="hidden"
            />
            <input
              ref={imageInputRef}
              type="file"
              multiple
              accept={acceptedImageTypes}
              onChange={(e) => handleAddFiles(e.target.files, "image")}
              className="hidden"
            />

            <button
              type="button"
              aria-label="Attach document"
              title="Attach document"
              onClick={() => docInputRef.current?.click()}
              className="grid size-7 place-items-center rounded-[4px] border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Paperclip className="size-3.5" />
            </button>

            <button
              type="button"
              aria-label="Attach image"
              title="Attach image"
              onClick={() => imageInputRef.current?.click()}
              className="grid size-7 place-items-center rounded-[4px] border border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <ImagePlus className="size-3.5" />
            </button>

            <button
              type="button"
              aria-label={webSearch ? "Disable web search" : "Enable web search"}
              aria-pressed={webSearch}
              title={webSearch ? "Web search: Enabled" : "Web search: Disabled"}
              onClick={handleToggleGlobe}
              className={`grid size-7 place-items-center rounded-[4px] border transition-colors cursor-pointer ${
                webSearch
                  ? "border-sky-500/50 bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold"
                  : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Globe className="size-3.5" />
            </button>

            <div ref={toolsWrapperRef} className="relative">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={toolsOpen}
                title="Configure search & AI tools"
                onClick={() => setToolsOpen((current) => !current)}
                className={`flex h-7 items-center gap-1.5 rounded-[4px] border px-2 text-[11px] font-medium transition-colors cursor-pointer ${
                  toolsOpen || enabledToolCount
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Settings2 className="size-3" />
                <span>Tools</span>
                {enabledToolCount ? (
                  <span className="font-mono text-[10px] font-bold text-primary">({enabledToolCount})</span>
                ) : null}
              </button>

              {toolsOpen && (
                <div
                  role="dialog"
                  aria-label="Assistant tools"
                  className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-[280px] rounded-[8px] border border-border bg-card p-3 shadow-lg"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] font-mono">
                    <span className="font-bold text-foreground">Pipeline Tools</span>
                    <span className="text-muted-foreground">{enabledToolCount} active</span>
                  </div>

                  <ul className="mt-2 max-h-[260px] space-y-1 overflow-y-auto pr-1">
                    {tools.map((tool) => {
                      const active =
                        tool.id === "web-search" ? webSearch : toolIds.includes(tool.id);
                      return (
                        <li key={tool.id}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            onClick={() => toggleTool(tool)}
                            className={`flex w-full items-center justify-between gap-2 rounded-[4px] p-2 text-left transition-colors cursor-pointer ${
                              active
                                ? "border border-primary/30 bg-primary/10"
                                : "border border-border/40 bg-secondary/20 hover:bg-secondary/40"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {getToolIcon(tool.id)}
                              <div className="min-w-0">
                                <span className="block truncate text-[11.5px] font-medium text-foreground">
                                  {tool.label}
                                </span>
                                <span className="block truncate text-[9.5px] text-muted-foreground font-mono">
                                  {tool.detail}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-[3px] px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase ${
                                active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              }`}
                            >
                              {active ? "ON" : "OFF"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {activeModelLabel && (
              <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[10.5px] text-muted-foreground rounded-[4px] border border-border bg-secondary/30 px-2 py-0.5">
                <Cpu className="size-3 text-primary" /> {activeModelLabel}
              </span>
            )}
          </div>

          {/* Right: Submit / Stop Button */}
          <div>
            {pending ? (
              <button
                type="button"
                onClick={onStop}
                aria-label="Stop generating"
                title="Stop generating"
                className="grid size-7 place-items-center rounded-[6px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
              >
                <Square className="size-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send query"
                disabled={!question.trim()}
                className="grid size-7 place-items-center rounded-[6px] bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.25)] border border-primary/40 hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <SendHorizontal className="size-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>

      <p className="text-center text-[11px] font-mono text-muted-foreground">
        Nexora AI queries are deterministic, air-gapped, and restricted to your authenticated clearance.
      </p>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-0.5">
          <span className="text-[11px] font-mono text-muted-foreground mr-1">Suggested:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                inputRef.current?.focus();
              }}
              className="rounded-[6px] border border-border bg-card px-2.5 py-1 text-[11px] text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
