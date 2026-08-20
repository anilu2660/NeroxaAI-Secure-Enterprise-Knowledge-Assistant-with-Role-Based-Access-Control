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
      return <Globe className="size-4 text-sky-400" />;
    case "citations":
      return <Quote className="size-4 text-purple-400" />;
    case "chart-generator":
      return <BarChart3 className="size-4 text-emerald-400" />;
    case "executive-summary":
      return <FileText className="size-4 text-amber-400" />;
    case "compliance-checker":
      return <ShieldCheck className="size-4 text-rose-400" />;
    case "action-planner":
      return <ListTodo className="size-4 text-indigo-400" />;
    case "calculator":
      return <Calculator className="size-4 text-yellow-400" />;
    case "sql-generator":
      return <Terminal className="size-4 text-cyan-400" />;
    case "file-analysis":
      return <FileCode className="size-4 text-teal-400" />;
    default:
      return <Sparkles className="size-4 text-primary" />;
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
    if (!toolsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!toolsWrapperRef.current?.contains(event.target as Node)) setToolsOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setToolsOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [toolsOpen]);

  const addFiles = (picked: FileList | null, kind: AssistantAttachment["kind"]) => {
    if (!picked?.length) return;
    const next = Array.from(picked).map((file) => ({
      file,
      meta: {
        id: `${kind}_${file.name}_${file.size}`,
        name: file.name,
        sizeLabel: sizeLabel(file.size),
        kind,
      } satisfies AssistantAttachment,
    }));
    setFiles((current) => {
      const seen = new Set(current.map((entry) => entry.meta.id));
      return [...current, ...next.filter((entry) => !seen.has(entry.meta.id))];
    });
  };

  const removeFile = (id: string) => {
    setFiles((current) => current.filter((entry) => entry.meta.id !== id));
  };

  const toggleTool = (tool: AssistantToolOption) => {
    const isCurrentlyActive =
      tool.id === "web-search" ? webSearch : toolIds.includes(tool.id);
    const nextState = !isCurrentlyActive;

    if (tool.id === "web-search") {
      setWebSearch(nextState);
    }

    setToolIds((current) => {
      if (nextState) {
        return current.includes(tool.id) ? current : [...current, tool.id];
      }
      return current.filter((id) => id !== tool.id);
    });
  };

  const handleToggleGlobe = () => {
    const next = !webSearch;
    setWebSearch(next);
    setToolIds((current) =>
      next
        ? current.includes("web-search")
          ? current
          : [...current, "web-search"]
        : current.filter((id) => id !== "web-search"),
    );
  };

  const send = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || pending) return;
    onSubmit({
      question: trimmed,
      attachments: files.map((entry) => entry.file),
      webSearch,
      toolIds,
    });
    setQuestion("");
    setFiles([]);
    if (docInputRef.current) docInputRef.current.value = "";
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(question);
  };

  const enabledToolCount = useMemo(
    () => toolIds.length + (webSearch && !toolIds.includes("web-search") ? 1 : 0),
    [toolIds, webSearch],
  );

  return (
    <div className="space-y-3.5">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-hairline/80 bg-background/60 p-4.5 shadow-inner backdrop-blur-2xl focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/15 transition-all duration-300"
      >
        <label htmlFor="assistant-composer" className="sr-only">
          Ask NeroxaAI
        </label>
        <textarea
          id="assistant-composer"
          ref={inputRef}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send(question);
            }
          }}
          rows={2}
          placeholder="Ask NeroxaAI about your organization's knowledge…"
          className="w-full resize-none bg-transparent px-1.5 text-[14.5px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/75"
        />

        {files.length ? (
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {files.map((entry) => (
              <li
                key={entry.meta.id}
                className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-primary/15 py-1.5 pr-2 pl-3 text-[11.5px] font-semibold text-primary shadow-xs"
              >
                {entry.meta.kind === "image" ? (
                  <ImagePlus className="size-4 text-primary" />
                ) : (
                  <Paperclip className="size-4 text-primary" />
                )}
                <span className="max-w-[170px] truncate">{entry.meta.name}</span>
                <span className="text-[10px] text-muted-foreground">{entry.meta.sizeLabel}</span>
                <button
                  type="button"
                  onClick={() => removeFile(entry.meta.id)}
                  aria-label={`Remove ${entry.meta.name}`}
                  className="grid size-4.5 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/20 hover:text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <input
          ref={docInputRef}
          type="file"
          multiple
          accept={acceptedDocumentTypes}
          className="hidden"
          onChange={(event) => addFiles(event.target.files, "document")}
        />
        <input
          ref={imageInputRef}
          type="file"
          multiple
          accept={acceptedImageTypes}
          className="hidden"
          onChange={(event) => addFiles(event.target.files, "image")}
        />

        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-hairline/60">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-label="Attach document"
              title="Attach a document"
              onClick={() => docInputRef.current?.click()}
              className="grid size-9 place-items-center rounded-2xl border border-hairline/80 bg-secondary/35 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-primary transition-all shadow-xs active:scale-95"
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Attach image"
              title="Attach an image"
              onClick={() => imageInputRef.current?.click()}
              className="grid size-9 place-items-center rounded-2xl border border-hairline/80 bg-secondary/35 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-primary transition-all shadow-xs active:scale-95"
            >
              <ImagePlus className="size-4" />
            </button>
            <button
              type="button"
              aria-label={webSearch ? "Disable web search" : "Enable web search"}
              aria-pressed={webSearch}
              title={webSearch ? "Web search: enabled (forces live search)" : "Web search: disabled"}
              onClick={handleToggleGlobe}
              className={`grid size-9 place-items-center rounded-2xl border transition-all shadow-xs active:scale-95 ${
                webSearch
                  ? "border-sky-400/60 bg-sky-500/20 text-sky-300 ring-2 ring-sky-400/30 shadow-md shadow-sky-500/20"
                  : "border-hairline/80 bg-secondary/35 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-primary"
              }`}
            >
              <Globe className="size-4" />
            </button>

            <div ref={toolsWrapperRef} className="relative">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={toolsOpen}
                title="Configure assistant search & AI tools"
                onClick={() => setToolsOpen((current) => !current)}
                className={`flex h-9 items-center gap-2 rounded-2xl border px-3.5 text-[12px] font-semibold transition-all shadow-xs active:scale-95 ${
                  toolsOpen || enabledToolCount
                    ? "border-primary/50 bg-primary/20 text-primary ring-1 ring-primary/30"
                    : "border-hairline/80 bg-secondary/35 text-foreground/80 hover:border-primary/40 hover:bg-card hover:text-primary"
                }`}
              >
                <Settings2 className="size-3.5" />
                Search Tools
                {enabledToolCount ? (
                  <span className="rounded-full bg-primary/30 border border-primary/40 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                    {enabledToolCount}
                  </span>
                ) : null}
              </button>

              {toolsOpen ? (
                <div
                  role="dialog"
                  aria-label="Assistant tools"
                  className="absolute bottom-[calc(100%+12px)] left-0 z-50 w-[300px] rounded-3xl border border-hairline/90 bg-card/95 p-3.5 shadow-2xl backdrop-blur-2xl ring-1 ring-primary/20"
                >
                  <div className="flex items-center justify-between px-1.5 pb-2.5 border-b border-hairline/60">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="size-3 text-primary animate-pulse" />
                      <p className="font-display text-[10.5px] font-bold uppercase tracking-wider text-foreground">
                        Search &amp; AI Tools
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {enabledToolCount} active
                    </span>
                  </div>

                  <ul className="mt-2 max-h-[340px] space-y-1.5 overflow-y-auto pr-1">
                    {tools.map((tool) => {
                      const active =
                        tool.id === "web-search"
                          ? webSearch
                          : toolIds.includes(tool.id);
                      return (
                        <li key={tool.id}>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={active}
                            onClick={() => toggleTool(tool)}
                            className={`flex w-full items-center justify-between gap-2.5 rounded-2xl p-2.5 text-left transition-all duration-200 ${
                              active
                                ? "border border-primary/40 bg-primary/15 shadow-xs"
                                : "border border-hairline/50 bg-secondary/20 hover:border-primary/30 hover:bg-secondary/40"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`grid size-7 shrink-0 place-items-center rounded-xl transition-all ${
                                  active
                                    ? "bg-primary/25 border border-primary/40"
                                    : "bg-secondary/40 border border-hairline/60"
                                }`}
                              >
                                {getToolIcon(tool.id)}
                              </span>
                              <div className="min-w-0">
                                <span
                                  className={`block truncate font-display text-[12px] font-bold ${
                                    active ? "text-primary" : "text-foreground"
                                  }`}
                                >
                                  {tool.label}
                                </span>
                                <span className="block truncate text-[10px] text-muted-foreground">
                                  {tool.detail}
                                </span>
                              </div>
                            </div>

                            <span
                              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider transition-all ${
                                active
                                  ? "border-primary/50 bg-primary text-primary-foreground shadow-xs"
                                  : "border-hairline bg-secondary/60 text-muted-foreground"
                              }`}
                            >
                              {active ? "On" : "Off"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>

            {activeModelLabel ? (
              <span className="hidden items-center gap-1.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11.5px] font-semibold text-emerald-400 sm:flex shadow-xs">
                <Cpu className="size-3.5" />
                Model: {activeModelLabel}
              </span>
            ) : null}
          </div>

          {pending ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop generating"
              title="Stop generating answer"
              className="grid size-11 place-items-center rounded-2xl bg-destructive text-destructive-foreground transition-all hover:scale-105 shadow-md shadow-destructive/25 active:scale-95"
            >
              <Square className="size-4.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              aria-label="Send question"
              disabled={!question.trim()}
              className="grid size-11 place-items-center rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-105 hover:bg-[position:right_center] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            >
              <SendHorizontal className="size-4.5" />
            </button>
          )}
        </div>
      </form>

      <p className="text-center text-[11px] text-muted-foreground/80">
        NeroxaAI answers are grounded in organizational knowledge and scoped to your account privileges.
      </p>

      {suggestions.length ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-muted-foreground">Try asking:</span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              title="Click to insert prompt"
              onClick={() => {
                setQuestion(suggestion);
                inputRef.current?.focus();
              }}
              className="rounded-2xl border border-hairline/80 bg-card/60 px-3.5 py-1.5 text-[11.5px] font-medium text-foreground/90 transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary hover:scale-[1.02] shadow-xs active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
