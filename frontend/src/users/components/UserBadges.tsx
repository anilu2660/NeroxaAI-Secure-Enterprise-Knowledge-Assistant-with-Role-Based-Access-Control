import type { ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import { cn } from "@/shared/utils/utils";

const roleTone: Record<Role, string> = {
  ADMIN: "border-primary/40 bg-primary/12 text-primary",
  USER: "border-sky-400/30 bg-sky-400/10 text-sky-300",
};

const statusTone: Record<ManagedUserStatus, string> = {
  active: "border-allowed/30 bg-allowed/10 text-allowed",
  inactive: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  disabled: "border-destructive/35 bg-destructive/10 text-destructive",
  pending_approval: "border-purple-400/30 bg-purple-400/10 text-purple-300",
};

const statusDot: Record<ManagedUserStatus, string> = {
  active: "bg-allowed",
  inactive: "bg-amber-400",
  disabled: "bg-destructive",
  pending_approval: "bg-purple-400",
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
        "inline-flex rounded-md border px-2 py-0.5 text-[10.5px] font-medium tracking-wide",
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
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px]",
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
