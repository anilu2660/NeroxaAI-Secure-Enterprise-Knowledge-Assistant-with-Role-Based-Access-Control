import type { ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import { cn } from "@/shared/utils/utils";

const roleTone: Record<Role, string> = {
  ADMIN: "border-primary/40 bg-primary/15 text-primary font-bold shadow-xs",
  USER: "border-sky-500/35 bg-sky-500/12 text-sky-400 font-semibold shadow-xs",
};

const statusTone: Record<ManagedUserStatus, string> = {
  active: "border-emerald-500/35 bg-emerald-500/12 text-emerald-400 font-medium shadow-xs",
  inactive: "border-amber-500/35 bg-amber-500/12 text-amber-400 font-medium shadow-xs",
  disabled: "border-rose-500/35 bg-rose-500/12 text-rose-400 font-medium shadow-xs",
  pending_approval: "border-purple-500/35 bg-purple-500/12 text-purple-400 font-medium shadow-xs",
};

const statusDot: Record<ManagedUserStatus, string> = {
  active: "bg-emerald-400 animate-pulse",
  inactive: "bg-amber-400",
  disabled: "bg-rose-400",
  pending_approval: "bg-purple-400 animate-pulse",
};

export const statusLabel: Record<ManagedUserStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  disabled: "Disabled",
  pending_approval: "Pending Approval",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider uppercase",
        roleTone[role],
      )}
    >
      {role}
    </span>
  );
}

export function StatusBadge({ status }: { status: ManagedUserStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px]",
        statusTone[status],
      )}
    >
      <span className={cn("size-1.5 rounded-full", statusDot[status])} />
      {statusLabel[status]}
    </span>
  );
}

export function userInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");
}
