import { AlertTriangle } from "lucide-react";
import { ModalShell } from "@/users/components/UserFormDialog";

/** Confirmation step for account state changes and destructive actions. */
export function ConfirmActionDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive,
  pending,
  note,
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  pending?: boolean;
  /** Override the honesty note when the surface is not identity-related. */
  note?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <ModalShell title={title} onClose={onClose} width="max-w-[440px]">
      <p className="text-[12.5px] leading-relaxed text-foreground/85">{description}</p>
      <p className="mt-3 flex items-start gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
        {note ??
          "No identity backend is connected, so this action changes the current browser session only. Nothing is written to a database and no access is revoked server-side."}
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={pending}
          className={
            destructive
              ? "h-9 rounded-xl bg-destructive px-4 text-[12.5px] font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              : "h-9 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          }
        >
          {confirmLabel}
        </button>
      </div>
    </ModalShell>
  );
}
