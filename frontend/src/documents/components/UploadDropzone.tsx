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
    <div className="space-y-3">
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
          "grid place-items-center rounded-2xl border border-dashed px-6 py-8 text-center transition-colors",
          dragging ? "border-primary/70 bg-primary/10" : "border-primary/35 bg-card/50",
        )}
      >
        <UploadCloud className="size-7 text-primary" />
        <p className="mt-2.5 text-[14px] text-foreground">Drag and drop your document here</p>
        <p className="mt-1 text-[11.5px] text-muted-foreground">or</p>
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
          className="mt-2.5 h-9 rounded-xl border border-primary/45 bg-primary/12 px-4 text-[12.5px] font-medium text-foreground transition-colors hover:bg-primary/20"
        >
          Choose File
        </button>
        <p className="mt-2.5 text-[11px] text-muted-foreground">
          Supported: {constraints.supportedFiles.map((entry) => entry.extension).join(", ")} · Max
          size: {constraints.maxSizeLabel}
        </p>
      </div>

      {file ? (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-2xl border bg-card/60 px-3.5 py-3 backdrop-blur-xl",
            validation && !validation.valid ? "border-destructive/45" : "border-hairline",
          )}
        >
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl border border-hairline bg-secondary/40">
              <FileText className="size-4 text-primary" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] text-foreground">{file.name}</p>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {validation?.fileKindLabel ?? "Unrecognized type"} · {formatFileSize(file.size)}
              </p>
              {validation?.valid ? (
                <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-primary">
                  <CheckCircle2 className="size-3.5" />
                  Valid file — ready for metadata. Not uploaded.
                </p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {(validation?.errors ?? []).map((error) => (
                    <li
                      key={error}
                      className="flex items-start gap-1.5 text-[11.5px] text-destructive"
                    >
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
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
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-xl border border-hairline bg-secondary/40 px-3 text-[12px] text-foreground/85 transition-colors hover:bg-accent/60"
          >
            <Trash2 className="size-3.5" />
            Remove
          </button>
        </div>
      ) : null}
    </div>
  );
}
