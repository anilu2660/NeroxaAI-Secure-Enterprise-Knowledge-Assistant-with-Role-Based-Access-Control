import { Info } from "lucide-react";
import type { ManagedUser } from "@/api/types";
import { ModalShell } from "./UserFormDialog";
import { RoleBadge, StatusBadge, userInitials } from "./UserBadges";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-hairline py-2 last:border-0">
      <span className="text-[11.5px] text-muted-foreground">{label}</span>
      <span className="text-right text-[12.5px] text-foreground/90">{value}</span>
    </div>
  );
}

import { getSavedUserAvatar } from "@/api/workspace-service";

export function UserDetailsDialog({
  user,
  onClose,
  onEdit,
}: {
  user: ManagedUser | null;
  onClose: () => void;
  onEdit?: (user: ManagedUser) => void;
}) {
  if (!user) return null;

  const avatarUrl = user.avatarUrl || getSavedUserAvatar(user.id, user.email);

  return (
    <ModalShell
      title="User Details"
      description="Identity, role, department, and configured knowledge access scope."
      onClose={onClose}
      width="max-w-[480px]"
    >
      <div className="flex items-center gap-3.5 p-3 rounded-2xl border border-hairline bg-secondary/25">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.name}
            className="size-11 shrink-0 rounded-2xl border border-primary/40 object-cover shadow-sm ring-2 ring-primary/20"
          />
        ) : (
          <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary/10 border border-hairline text-[14px] font-bold text-foreground ring-1 ring-primary/15">
            {userInitials(user.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-display text-[14px] font-semibold text-foreground">{user.name}</p>
          <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-4 space-y-1 rounded-2xl border border-hairline bg-secondary/15 p-3.5">
        <Row label="Role" value={<RoleBadge role={user.role} />} />
        <Row label="Department" value={user.department || "General"} />
        <Row label="Organization" value={user.organization || "NeroxaAI"} />
        <Row label="Status" value={<StatusBadge status={user.status} />} />
        <Row label="Last sign-in" value={user.lastSignInLabel ?? "Unavailable"} />
        <Row
          label="Access scope"
          value={
            <span className="block text-right">
              {user.accessScope && user.accessScope.length > 0 ? (
                user.accessScope.map((scope) => (
                  <span key={scope} className="inline-block rounded-md bg-secondary/50 px-2 py-0.5 text-[11px] font-medium text-foreground/90 border border-hairline/60 ml-1 mb-1">
                    {scope}
                  </span>
                ))
              ) : (
                <span className="text-[11px] text-muted-foreground">Default</span>
              )}
            </span>
          }
        />
        <Row label="Account ID" value={<span className="font-mono text-[11px] text-primary">{user.id}</span>} />
      </div>

      <div className="mt-5 flex justify-end gap-2.5">
        <button
          type="button"
          onClick={onClose}
          className="h-10 rounded-2xl border border-hairline bg-secondary/40 px-4 text-[12px] font-medium text-foreground transition-all hover:bg-secondary/70"
        >
          Close
        </button>
        {onEdit ? (
          <button
            type="button"
            onClick={() => onEdit(user)}
            className="h-10 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-primary px-5 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/25 transition-all hover:brightness-110"
          >
            Edit user
          </button>
        ) : null}
      </div>
    </ModalShell>
  );
}
