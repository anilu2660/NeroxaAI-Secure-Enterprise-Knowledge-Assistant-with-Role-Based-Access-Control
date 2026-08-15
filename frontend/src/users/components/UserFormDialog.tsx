import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import type { ManagedUser, ManagedUserDraft, ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import { statusLabel } from "./UserBadges";
import { cn } from "@/shared/utils/utils";

const fieldClass =
  "h-10 w-full rounded-xl border border-hairline bg-secondary/35 px-3 text-[12.5px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/80 focus-visible:border-primary/60";

const emptyDraft: ManagedUserDraft = {
  name: "",
  email: "",
  role: "USER",
  department: "",
  organization: "NeroxaAI",
  status: "active",
  accessScope: ["General Knowledge"],
};

/**
 * Create/edit form. It only builds a draft and hands it to the page, which
 * calls the service boundary — the future POST/PATCH endpoint replaces that
 * call with no change here.
 */
export function UserFormDialog({
  open,
  mode,
  user,
  departments,
  accessScopes,
  submitting,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: "create" | "edit";
  user: ManagedUser | null;
  departments: string[];
  accessScopes: string[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (draft: ManagedUserDraft) => void;
}) {
  const [draft, setDraft] = useState<ManagedUserDraft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDraft(
      user
        ? {
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department,
            organization: user.organization,
            status: user.status,
            accessScope: [...user.accessScope],
          }
        : { ...emptyDraft, department: departments[0] ?? "" },
    );
  }, [open, user, departments]);

  if (!open) return null;

  const toggleScope = (scope: string) =>
    setDraft((prev) => ({
      ...prev,
      accessScope: prev.accessScope.includes(scope)
        ? prev.accessScope.filter((entry) => entry !== scope)
        : [...prev.accessScope, scope],
    }));

  const submit = () => {
    if (!draft.name.trim()) return setError("Enter the user's full name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim()))
      return setError("Enter a valid work email address.");
    if (!draft.department) return setError("Select a department.");
    if (!draft.organization.trim()) return setError("Enter the organization.");
    if (draft.accessScope.length === 0)
      return setError("Select at least one knowledge access scope.");
    setError(null);
    onSubmit(draft);
  };

  return (
    <ModalShell
      title={mode === "create" ? "Add User" : "Edit User"}
      description={
        mode === "create"
          ? "Define the account identity, role, department, and knowledge access scope."
          : "Update identity, role, department, status, and knowledge access scope."
      }
      onClose={onClose}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-[11.5px] text-muted-foreground">Full name</span>
          <input
            className={fieldClass}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Aarav Sharma"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11.5px] text-muted-foreground">Work email</span>
          <input
            className={fieldClass}
            value={draft.email}
            onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            placeholder="name@neroxaai.com"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11.5px] text-muted-foreground">Role</span>
          <select
            className={fieldClass}
            value={draft.role}
            onChange={(event) => setDraft({ ...draft, role: event.target.value as Role })}
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11.5px] text-muted-foreground">Department</span>
          <select
            className={fieldClass}
            value={draft.department}
            onChange={(event) => setDraft({ ...draft, department: event.target.value })}
          >
            <option value="">Select department</option>
            {departments.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11.5px] text-muted-foreground">Organization</span>
          <input
            className={fieldClass}
            value={draft.organization}
            onChange={(event) => setDraft({ ...draft, organization: event.target.value })}
            placeholder="NeroxaAI"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11.5px] text-muted-foreground">Status</span>
          <select
            className={fieldClass}
            value={draft.status}
            onChange={(event) =>
              setDraft({ ...draft, status: event.target.value as ManagedUserStatus })
            }
          >
            {(["active", "inactive", "disabled", "pending_approval"] as ManagedUserStatus[]).map((value) => (
              <option key={value} value={value}>
                {statusLabel[value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3.5">
        <span className="block text-[11.5px] text-muted-foreground">Knowledge access scope</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {accessScopes.map((scope) => {
            const selected = draft.accessScope.includes(scope);
            return (
              <button
                key={scope}
                type="button"
                onClick={() => toggleScope(scope)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-[11.5px] transition-colors",
                  selected
                    ? "border-primary/45 bg-primary/12 text-primary"
                    : "border-hairline bg-secondary/35 text-foreground/75 hover:bg-accent/50",
                )}
              >
                {scope}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-3.5 flex items-start gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        No identity backend is connected. Submitting records this account in the current browser
        session only — nothing is saved to a database and no permissions are enforced server-side.
      </p>

      {error ? <p className="mt-2 text-[11.5px] text-destructive">{error}</p> : null}

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
          onClick={submit}
          disabled={submitting}
          className="h-9 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {mode === "create" ? "Add user" : "Save changes"}
        </button>
      </div>
    </ModalShell>
  );
}

export function ModalShell({
  title,
  description,
  onClose,
  children,
  width = "max-w-[560px]",
}: {
  title: string;
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[88svh] w-full overflow-y-auto rounded-2xl border border-hairline bg-card/95 p-5 shadow-menu backdrop-blur-xl",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[16px] font-medium tracking-tight text-foreground">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="grid size-7 shrink-0 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/75 transition-colors hover:bg-accent/70"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
