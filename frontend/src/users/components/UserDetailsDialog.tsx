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
  onEdit: (user: ManagedUser) => void;
}) {
  if (!user) return null;

  const avatarUrl = getSavedUserAvatar(user.id, user.email);

  return (
    <ModalShell
      title="User Details"
      description="Identity, role, department, and configured knowledge access scope."
      onClose={onClose}
      width="max-w-[480px]"
    >
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={user.name}
            className="size-10 shrink-0 rounded-full border border-primary/40 object-cover shadow-xs"
          />
        ) : (
          <span className="grid size-10 place-items-center rounded-full bg-secondary text-[13px] font-medium text-foreground/85">
            {userInitials(user.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-[13.5px] text-foreground">{user.name}</p>
          <p className="truncate text-[11.5px] text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="mt-3.5">
        <Row label="Role" value={<RoleBadge role={user.role} />} />
        <Row label="Department" value={user.department} />
        <Row label="Organization" value={user.organization} />
        <Row label="Status" value={<StatusBadge status={user.status} />} />
        <Row label="Last sign-in" value={user.lastSignInLabel ?? "Unavailable"} />
        <Row
          label="Access scope"
          value={
            <span className="block">
              {user.accessScope.map((scope) => (
                <span key={scope} className="block">
                  {scope}
                </span>
              ))}
            </span>
          }
        />
        <Row label="Account id" value={<span className="font-mono text-[11px]">{user.id}</span>} />
      </div>

      <p className="mt-3.5 flex items-start gap-2 rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Prototype record. Sign-in history, document-level authorization, and permission propagation
        are unavailable because no identity or retrieval backend is connected.
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="h-9 rounded-xl border border-hairline bg-secondary/40 px-3.5 text-[12.5px] text-foreground/85 transition-colors hover:bg-accent/60"
        >
          Close
        </button>
        <button
          type="button"
          onClick={() => onEdit(user)}
          className="h-9 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Edit user
        </button>
      </div>
    </ModalShell>
  );
}
