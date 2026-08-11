import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Cpu,
  Globe,
  ImagePlus,
  Loader2,
  Paperclip,
  SendHorizontal,
  Settings2,
  X,
} from "lucide-react";
import type { AssistantAttachment, AssistantToolOption } from "@/api/types";
import { acceptedDocumentTypes, acceptedImageTypes } from "@/rag/mock/assistant-tools";

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

const controlBase =
  "grid size-8 place-items-center rounded-lg border border-hairline transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-45";

/**
 * Controlled assistant composer. Attachments, web-search state and tool
 * selection are real frontend state, submitted upward so the page keeps the
 * single service-layer call (`askAssistant`). Nothing is uploaded or executed
 * here — no backend exists — so tools stay labelled as prototype.
 */
export function AssistantComposer({
  onSubmit,
  pending,
  suggestions,
  activeModelLabel,
  tools,
}: {
  onSubmit: (submission: ComposerSubmission) => void;
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
  const [toolIds, setToolIds] = useState<string[]>([]);
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
    setToolIds((current) =>
      current.includes(tool.id) ? current.filter((id) => id !== tool.id) : [...current, tool.id],
    );
    if (tool.id === "web-search") setWebSearch((current) => !current);
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
    <div className="space-y-2">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-hairline bg-card/70 p-3.5 shadow-menu backdrop-blur-xl"
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
          className="w-full resize-none bg-transparent px-1 text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
        />

        {files.length ? (
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {files.map((entry) => (
              <li
                key={entry.meta.id}
                className="flex items-center gap-1.5 rounded-lg border border-hairline bg-secondary/40 py-1 pr-1 pl-2 text-[10.5px] text-foreground/85"
              >
                {entry.meta.kind === "image" ? (
                  <ImagePlus className="size-3 text-muted-foreground" />
                ) : (
                  <Paperclip className="size-3 text-muted-foreground" />
                )}
                <span className="max-w-[160px] truncate">{entry.meta.name}</span>
                <span className="text-muted-foreground">{entry.meta.sizeLabel}</span>
                <button
                  type="button"
                  onClick={() => removeFile(entry.meta.id)}
                  aria-label={`Remove ${entry.meta.name}`}
                  className="grid size-4 place-items-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <X className="size-3" />
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

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Attach document"
              title="Attach a document — stays local, no upload service is connected"
              onClick={() => docInputRef.current?.click()}
              className={`${controlBase} text-foreground/75 hover:bg-accent/60 hover:text-foreground active:bg-accent`}
            >
              <Paperclip className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Attach image"
              title="Attach an image — stays local, no upload service is connected"
              onClick={() => imageInputRef.current?.click()}
              className={`${controlBase} text-foreground/75 hover:bg-accent/60 hover:text-foreground active:bg-accent`}
            >
              <ImagePlus className="size-4" />
            </button>
            <button
              type="button"
              aria-label={webSearch ? "Disable web search" : "Enable web search"}
              aria-pressed={webSearch}
              title={
                webSearch
                  ? "Web search: on (prototype — no search provider connected)"
                  : "Web search: off"
              }
              onClick={() => setWebSearch((current) => !current)}
              className={`${controlBase} ${
                webSearch
                  ? "bg-secondary text-foreground"
                  : "text-foreground/75 hover:bg-accent/60 hover:text-foreground"
              }`}
            >
              <Globe className="size-4" />
            </button>

            <div ref={toolsWrapperRef} className="relative">
              <button
                type="button"
                aria-haspopup="dialog"
                aria-expanded={toolsOpen}
                title="Select assistant tools (prototype)"
                onClick={() => setToolsOpen((current) => !current)}
                className={`flex items-center gap-1.5 rounded-lg border border-hairline px-2.5 py-1.5 text-[11.5px] transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  toolsOpen || enabledToolCount
                    ? "bg-secondary text-foreground"
                    : "text-foreground/75 hover:bg-accent/60 hover:text-foreground"
                }`}
              >
                <Settings2 className="size-3.5" />
                Search Tools
                {enabledToolCount ? (
                  <span className="rounded bg-card/80 px-1 text-[10px] text-foreground/80">
                    {enabledToolCount}
                  </span>
                ) : null}
              </button>

              {toolsOpen ? (
                <div
                  role="dialog"
                  aria-label="Assistant tools"
                  className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-[262px] rounded-xl border border-hairline bg-card/95 p-2 shadow-menu backdrop-blur-xl"
                >
                  <p className="px-1 pb-1.5 text-[9.5px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                    Tools · Prototype
                  </p>
                  <ul className="space-y-0.5">
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
                            className="flex w-full items-start justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-[12px] text-foreground">
                                {tool.label}
                              </span>
                              <span className="block truncate text-[10.5px] text-muted-foreground">
                                {tool.detail}
                              </span>
                            </span>
                            <span
                              className={`mt-0.5 shrink-0 rounded-md border border-hairline px-1.5 py-0.5 text-[9.5px] ${
                                active ? "bg-secondary text-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {active ? "On" : "Off"}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-1.5 border-t border-hairline px-1 pt-1.5 text-[9.5px] leading-relaxed text-muted-foreground">
                    Selections are sent with your question but cannot run yet — no backend tool
                    service is connected.
                  </p>
                </div>
              ) : null}
            </div>

            {activeModelLabel ? (
              <span className="hidden items-center gap-1.5 rounded-lg border border-hairline bg-secondary/40 px-2.5 py-1.5 text-[11.5px] text-foreground/75 sm:flex">
                <Cpu className="size-3.5 text-allowed" />
                Model: {activeModelLabel}
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            aria-label="Send question"
            disabled={pending || !question.trim()}
            className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-45"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <SendHorizontal className="size-4" />
            )}
          </button>
        </div>

        {files.length || webSearch || toolIds.length ? (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Prototype mode — attachments, web search and tool selections are kept in this session
            and passed with your question, but no backend is connected to process them.
          </p>
        ) : null}
      </form>

      {suggestions.length ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10.5px] text-muted-foreground">
            Example questions (illustrative only)
          </span>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              title="Example prompt — inserts the text into the composer"
              onClick={() => {
                setQuestion(suggestion);
                inputRef.current?.focus();
              }}
              className="rounded-md border border-dashed border-hairline bg-secondary/30 px-2 py-1 text-[10.5px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
