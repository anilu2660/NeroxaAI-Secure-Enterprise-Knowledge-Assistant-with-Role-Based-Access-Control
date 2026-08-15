import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  FileText,
  Maximize2,
  Minus,
  PanelsTopLeft,
  Plus,
  Quote,
  Search,
  SquareArrowOutUpRight,
} from "lucide-react";
import type {
  Citation,
  DocumentPreviewBlock,
  DocumentPreviewPage,
  DocumentRecord,
} from "@/api/types";
import { cn } from "@/shared/utils/utils";

const toolButton =
  "grid size-8 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/80 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-secondary/40";

function highlight(text: string, term: string) {
  if (!term.trim()) return text;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return parts.map((part, index) =>
    part.toLowerCase() === term.toLowerCase() ? (
      // eslint-disable-next-line react/no-array-index-key
      <mark key={index} className="rounded bg-amber-200 px-0.5 text-neutral-900">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function Block({ block, term }: { block: DocumentPreviewBlock; term: string }) {
  if (block.type === "heading")
    return (
      <h2 className="font-display text-[19px] font-semibold tracking-tight text-neutral-900">
        {highlight(block.text ?? "", term)}
      </h2>
    );
  if (block.type === "subheading")
    return (
      <h3 className="text-[13.5px] font-semibold text-blue-700">
        {highlight(block.text ?? "", term)}
      </h3>
    );
  if (block.type === "paragraph")
    return (
      <p className="text-[12.5px] leading-relaxed text-neutral-700">
        {highlight(block.text ?? "", term)}
      </p>
    );
  if (block.type === "list")
    return (
      <ul className="space-y-1 pl-4">
        {(block.items ?? []).map((item) => (
          <li key={item} className="list-disc text-[12.5px] leading-relaxed text-neutral-700">
            {highlight(item, term)}
          </li>
        ))}
      </ul>
    );
  if (block.type === "note")
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
        <span className="mt-[3px] grid size-3 shrink-0 place-items-center rounded-full border border-amber-500 text-[8px] font-bold text-amber-600">
          i
        </span>
        <p className="text-[12px] text-neutral-700">{highlight(block.text ?? "", term)}</p>
      </div>
    );
  if (block.type === "table" && block.table)
    return (
      <table className="w-full border-collapse text-[11.5px]">
        <thead>
          <tr>
            {block.table.headers.map((header) => (
              <th
                key={header}
                className="border border-neutral-800 bg-neutral-900 px-2 py-1.5 text-center font-semibold text-white"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.table.rows.map((row) => (
            <tr key={row.join("|")}>
              {row.map((cell, index) => (
                <td
                  key={cell + index}
                  className={cn(
                    "border border-neutral-300 px-2 py-1.5 text-neutral-700",
                    index === 0 ? "text-left" : "text-center",
                  )}
                >
                  {highlight(cell, term)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  return null;
}

/**
 * Controlled document viewer. There is no PDF backend, storage service, or PDF
 * byte stream in this codebase: pages come from the prototype preview fixture
 * through the workspace service, and every page without fixture content shows
 * an explicit unavailable state.
 */
export function DocumentViewer({
  doc,
  page,
  preview,
  loading,
  citation,
  onPageChange,
}: {
  doc: DocumentRecord;
  page: number;
  preview: DocumentPreviewPage | null;
  loading: boolean;
  citation: Citation | null;
  onPageChange: (page: number) => void;
}) {
  const total = doc.pageCount ?? 1;
  const [zoom, setZoom] = useState(100);
  const [showThumbs, setShowThumbs] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [viewMode, setViewMode] = useState<"adobe" | "text">("adobe");
  const shellRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const thumbs = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, i) => start + i).filter(
      (n) => n >= 1 && n <= total,
    );
  }, [page, total]);

  const citedOnThisPage = citation?.page === page;

  const toggleFullscreen = () => {
    const node = shellRef.current;
    if (!node) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void node.requestFullscreen?.();
  };

  const isPdf = doc.kind === "PDF" || doc.title.toLowerCase().endsWith(".pdf");
  const token = typeof window !== "undefined" ? (sessionStorage.getItem("neroxa_access_token") || localStorage.getItem("neroxa_access_token")) : "";
  const baseUrl = doc.rawUrl || `/api/v1/documents/${doc.id}/raw`;
  const rawUrl = token ? (baseUrl.includes("?") ? `${baseUrl}&token=${token}` : `${baseUrl}?token=${token}`) : baseUrl;

  return (
    <div
      ref={shellRef}
      className="flex h-full min-h-[420px] min-h-0 flex-col overflow-hidden rounded-2xl border border-hairline bg-card/60 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-hairline px-3 py-2.5">
        <button
          type="button"
          onClick={() => setShowThumbs((v) => !v)}
          aria-pressed={showThumbs}
          title="Toggle page thumbnails"
          className={cn(toolButton, showThumbs && "border-primary/45 bg-primary/12 text-primary")}
        >
          <PanelsTopLeft className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          aria-pressed={searchOpen}
          title="Search in document preview"
          className={cn(toolButton, searchOpen && "border-primary/45 bg-primary/12 text-primary")}
        >
          <Search className="size-3.5" />
        </button>

        {isPdf ? (
          <div className="flex items-center rounded-lg border border-hairline bg-secondary/30 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode("adobe")}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                viewMode === "adobe"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Adobe PDF View
            </button>
            <button
              type="button"
              onClick={() => setViewMode("text")}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                viewMode === "text"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Extracted Text
            </button>
          </div>
        ) : null}

        <div className="mx-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            title="First page"
            className={toolButton}
          >
            <ChevronsLeft className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            title="Previous page"
            className={toolButton}
          >
            <ChevronLeft className="size-3.5" />
          </button>
          <label className="flex items-center gap-1.5">
            <span className="sr-only">Page number</span>
            <input
              type="number"
              min={1}
              max={total}
              value={page}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next)) onPageChange(Math.max(1, Math.min(total, next)));
              }}
              className="h-8 w-14 rounded-lg border border-hairline bg-secondary/40 text-center text-[12.5px] text-foreground outline-none focus-visible:border-primary/60"
            />
            <span className="text-[12px] text-muted-foreground">/ {total}</span>
          </label>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= total}
            title="Next page"
            className={toolButton}
          >
            <ChevronRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(total)}
            disabled={page >= total}
            title="Last page"
            className={toolButton}
          >
            <ChevronsRight className="size-3.5" />
          </button>

          <span aria-hidden className="mx-1.5 h-5 w-px bg-hairline" />

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(60, z - 10))}
            disabled={zoom <= 60 || (isPdf && viewMode === "adobe")}
            title="Zoom out"
            className={toolButton}
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-[46px] text-center text-[12px] text-foreground/85">{zoom}%</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(160, z + 10))}
            disabled={zoom >= 160 || (isPdf && viewMode === "adobe")}
            title="Zoom in"
            className={toolButton}
          >
            <Plus className="size-3.5" />
          </button>
        </div>

        <button type="button" onClick={toggleFullscreen} title="Fullscreen" className={toolButton}>
          <Maximize2 className="size-3.5" />
        </button>
        <a
          href={rawUrl}
          download={doc.title}
          target="_blank"
          rel="noopener noreferrer"
          title="Download original document file"
          className={cn(toolButton, "inline-flex")}
        >
          <Download className="size-3.5" />
        </a>
      </div>

      {searchOpen ? (
        <div className="flex items-center gap-2 border-b border-hairline bg-secondary/20 px-3 py-2">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            ref={searchRef}
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Find in document preview"
            className="h-7 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground/70"
          />
          <span className="text-[11px] text-muted-foreground">
            Searches page text preview
          </span>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        {showThumbs && !(isPdf && viewMode === "adobe") ? (
          <div className="hidden w-[104px] shrink-0 gap-2 overflow-y-auto border-r border-hairline bg-secondary/15 p-2.5 sm:flex sm:flex-col">
            {thumbs.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onPageChange(n)}
                aria-current={n === page}
                className="group flex flex-col items-center gap-1 outline-none"
              >
                <span
                  className={cn(
                    "grid h-[96px] w-[74px] place-items-center rounded-[3px] border bg-white/90 text-[9px] text-neutral-400",
                    n === page
                      ? "border-primary shadow-[0_0_0_2px_color-mix(in_oklab,var(--primary)_35%,transparent)]"
                      : "border-neutral-300/70 group-hover:border-primary/50",
                  )}
                >
                  {n}
                </span>
                <span
                  className={cn(
                    "text-[10.5px]",
                    n === page ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {n}
                </span>
              </button>
            ))}
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-auto bg-neutral-900/40 p-2">
          {isPdf && viewMode === "adobe" ? (
            /* Adobe Native PDF Viewer */
            <div className="h-full w-full min-h-[580px]">
              <iframe
                src={`${rawUrl}#page=${page}`}
                className="h-full w-full rounded-xl border border-hairline bg-neutral-950 shadow-2xl"
                title={doc.title}
              />
            </div>
          ) : loading ? (
            <div className="grid h-full min-h-[320px] place-items-center text-[12.5px] text-muted-foreground">
              Loading page preview…
            </div>
          ) : !preview ? (
            <div className="grid h-full min-h-[320px] place-items-center px-6 text-center">
              <div className="max-w-[46ch]">
                <FileText className="mx-auto size-5 text-muted-foreground" />
                <p className="mt-2.5 text-[13px] text-foreground/85">
                  No preview available for page {page}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                  Document content for page {page} is being loaded.
                </p>
              </div>
            </div>
          ) : (
            <div
              className="origin-top transition-transform"
              style={{ transform: `scale(${zoom / 100})`, width: `${10000 / zoom}%` }}
            >
              {doc.kind === "TXT" ? (
                /* TXT Plain Text File Viewer */
                <article className="mx-auto max-w-[760px] rounded-xl border border-hairline bg-card/90 p-6 font-mono text-[12.5px] leading-relaxed shadow-lg">
                  <header className="flex items-center justify-between border-b border-hairline/60 pb-2 text-[10.5px] text-muted-foreground">
                    <span className="flex items-center gap-1.5 font-semibold text-primary">
                      <FileText className="size-3.5" /> TXT Plain Text Document
                    </span>
                    <span>{doc.title}</span>
                  </header>
                  <div className="mt-4 space-y-2 text-foreground/90">
                    {preview.blocks.map((block) => (
                      <div key={block.id} className="whitespace-pre-wrap font-mono">
                        {highlight(block.text ?? "", term)}
                      </div>
                    ))}
                  </div>
                  <footer className="mt-6 border-t border-hairline/60 pt-2 text-right text-[10px] text-muted-foreground">
                    Page {page} of {total} · {doc.kind} Format
                  </footer>
                </article>
              ) : (
                /* PDF and DOCX Paper Document Viewer */
                <article className="mx-auto max-w-[760px] rounded-[3px] bg-white px-8 py-7 shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]">
                  <header className="flex items-center justify-between border-b border-neutral-200 pb-2 text-[9.5px] uppercase tracking-wide text-neutral-400">
                    <span className="flex items-center gap-1.5 font-bold text-neutral-700">
                      <FileText className="size-3 text-blue-600" />
                      {doc.kind === "DOCX" ? "DOCX Word Document" : "PDF Document"}
                    </span>
                    <span className="flex items-center gap-2">
                      <span>{doc.title}</span>
                      {doc.version ? (
                        <>
                          <span className="text-neutral-300">|</span>
                          <span>Version {doc.version}</span>
                        </>
                      ) : null}
                    </span>
                  </header>

                  <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="space-y-3.5">
                      {preview.blocks.map((block) => (
                        <Block key={block.id} block={block} term={term} />
                      ))}
                    </div>

                    {citedOnThisPage ? (
                      <aside className="h-fit rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-3">
                        <p className="text-[9.5px] font-semibold uppercase tracking-wide text-neutral-500">
                          Citation reference
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Quote className="mt-[3px] size-3 shrink-0 text-emerald-600" />
                          <p className="text-[11.5px] leading-relaxed text-neutral-700">
                            This section was referenced by the NeroxaAI Assistant citation you opened.
                          </p>
                        </div>
                        <div className="mt-2.5 flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-white px-2.5 py-2 text-[11.5px] text-neutral-700">
                          Cited Page {page}
                          <SquareArrowOutUpRight className="size-3 text-neutral-500" />
                        </div>
                      </aside>
                    ) : null}
                  </div>

                  <footer className="mt-6 border-t border-neutral-200 pt-2 text-right text-[9.5px] text-neutral-400">
                    Page {page} of {total}
                  </footer>
                </article>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
