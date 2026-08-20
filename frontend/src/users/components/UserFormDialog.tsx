import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import type { ManagedUser, ManagedUserDraft, ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import { statusLabel } from "./UserBadges";
import { cn } from "@/shared/utils/utils";

const fieldClass =
  "h-10.5 w-full rounded-2xl border border-hairline bg-secondary/30 px-3.5 text-[12.5px] text-foreground outline-none transition-all placeholder:text-muted-foreground/70 hover:border-primary/40 focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-ring shadow-xs";

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
 * Create/edit form.
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
          ? "Define account identity, role, department, and knowledge access scope."
          : "Update identity, role, department, status, and knowledge access scope."
      }
      onClose={onClose}
    >
      <div className="grid gap-3.5 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Full name
          </span>
          <input
            className={fieldClass}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="Aarav Sharma"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Work email
          </span>
          <input
            className={fieldClass}
            value={draft.email}
            onChange={(event) => setDraft({ ...draft, email: event.target.value })}
            placeholder="name@neroxaai.com"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Role
          </span>
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
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Department
          </span>
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
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Organization
          </span>
          <input
            className={fieldClass}
            value={draft.organization}
            onChange={(event) => setDraft({ ...draft, organization: event.target.value })}
            placeholder="NeroxaAI"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Status
          </span>
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

      <div className="mt-4">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Knowledge access scope
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {accessScopes.map((scope) => {
            const selected = draft.accessScope.includes(scope);
            return (
              <button
                key={scope}
                type="button"
                onClick={() => toggleScope(scope)}
                className={cn(
                  "rounded-xl border px-3 py-1.5 text-[11.5px] font-medium transition-all duration-200 shadow-xs",
                  selected
                    ? "border-primary/50 bg-primary/15 text-primary shadow-sm shadow-primary/20"
                    : "border-hairline bg-secondary/35 text-foreground/75 hover:bg-secondary/60 hover:border-primary/40",
                )}
              >
                {scope}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-hairline bg-secondary/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        Role assignment and department membership determine the automated retrieval boundaries across organizational vectors.
      </p>

      {error ? <p className="mt-2.5 text-[12px] font-medium text-destructive">{error}</p> : null}

      <div className="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-2xl border border-hairline bg-secondary/40 px-4 text-[12px] font-medium text-foreground transition-all hover:bg-secondary/70"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="h-10 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary px-5 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-110 disabled:opacity-50"
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
  width = "max-w-[580px]",
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
        className="absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative max-h-[88svh] w-full overflow-y-auto rounded-3xl border border-hairline/80 bg-card/95 p-6 shadow-2xl backdrop-blur-2xl transition-all",
          width,
        )}
      >
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-hairline/60">
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-foreground">
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
            className="grid size-8 shrink-0 place-items-center rounded-xl border border-hairline/70 bg-secondary/35 text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
