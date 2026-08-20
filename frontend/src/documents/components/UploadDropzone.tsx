import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Trash2, UploadCloud } from "lucide-react";
import type { DocumentFileValidation, DocumentUploadConstraints } from "@/api/types";
import { formatFileSize } from "@/api/workspace-service";
import { cn } from "@/shared/utils/utils";

/**
 * Local file selection zone. The file never leaves the browser here — this is
 * a preparation and validation surface, not an upload.
 */
export function UploadDropzone({
  constraints,
  file,
  validation,
  onSelect,
  onClear,
}: {
  constraints: DocumentUploadConstraints;
  file: File | null;
  validation: DocumentFileValidation | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const next = files?.[0];
    if (next) onSelect(next);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-300",
          dragging
            ? "border-primary bg-primary/[0.12] shadow-xl shadow-primary/20 scale-[1.01]"
            : "border-hairline/80 bg-gradient-to-br from-card/80 via-card/40 to-primary/[0.04] hover:border-primary/50 hover:bg-card/70 shadow-sm",
        )}
      >
        <div className="grid size-14 place-items-center rounded-3xl border border-primary/30 bg-primary/15 text-primary shadow-md shadow-primary/20 transition-transform group-hover:scale-110">
          <UploadCloud className="size-7 animate-pulse" />
        </div>
        <p className="mt-4 font-display text-[15px] font-bold text-foreground">
          Drag and drop your document here
        </p>
        <p className="mt-0.5 text-[12px] text-muted-foreground">or browse from your device</p>
        <input
          ref={inputRef}
          type="file"
          accept={constraints.acceptAttribute}
          className="sr-only"
          aria-label="Choose a document to prepare"
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex h-10 items-center gap-2 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary bg-[length:200%_auto] px-5 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all duration-300 hover:bg-[position:right_center] hover:shadow-lg active:scale-95"
        >
          <UploadCloud className="size-4" />
          Choose File
        </button>
        <p className="mt-3 text-[11px] font-medium text-muted-foreground/80">
          Supported: {constraints.supportedFiles.map((entry) => entry.extension).join(", ")} · Max
          size: {constraints.maxSizeLabel}
        </p>
      </div>

      {file ? (
        <div
          className={cn(
            "flex items-center justify-between gap-3.5 rounded-3xl border p-4 shadow-lg backdrop-blur-2xl transition-all",
            validation && !validation.valid
              ? "border-destructive/40 bg-destructive/[0.08]"
              : "border-emerald-500/40 bg-emerald-500/[0.06]",
          )}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span
              className={cn(
                "grid size-11 shrink-0 place-items-center rounded-2xl border shadow-xs",
                validation?.valid
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                  : "border-destructive/40 bg-destructive/15 text-destructive",
              )}
            >
              <FileText className="size-5.5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[13.5px] font-semibold text-foreground">
                {file.name}
              </p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {validation?.fileKindLabel ?? "Document"} · {formatFileSize(file.size)}
              </p>
              {validation?.valid ? (
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] font-semibold text-emerald-400">
                  <CheckCircle2 className="size-4" />
                  Validated &amp; ready for metadata indexing.
                </p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {(validation?.errors ?? []).map((error) => (
                    <li
                      key={error}
                      className="flex items-center gap-1.5 text-[11.5px] font-medium text-destructive"
                    >
                      <AlertTriangle className="size-3.5 shrink-0" />
                      {error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="flex h-9 shrink-0 items-center gap-1.5 rounded-2xl border border-destructive/35 bg-destructive/10 px-3.5 text-[12px] font-medium text-destructive transition-all hover:bg-destructive/20 active:scale-95"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
