import { Eye, Lock, Pencil, Trash2, Unlock, Users } from "lucide-react";
import type { ManagedUser } from "@/api/types";
import { RoleBadge, StatusBadge, userInitials } from "./UserBadges";

const gridCols =
  "lg:grid-cols-[minmax(0,2.1fr)_74px_minmax(0,1fr)_minmax(0,1.5fr)_minmax(0,0.9fr)_minmax(0,1.1fr)_156px]";

function ActionButton({
  label,
  onClick,
  destructive,
  children,
}: {
  label: string;
  onClick: () => void;
  destructive?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        destructive
          ? "grid size-7 place-items-center rounded-lg border border-destructive/35 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/20 focus-visible:outline focus-visible:outline-1 focus-visible:outline-destructive"
          : "grid size-7 place-items-center rounded-lg border border-hairline bg-secondary/40 text-foreground/75 transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary"
      }
    >
      {children}
    </button>
  );
}

import { getSavedUserAvatar } from "@/api/workspace-service";

function UserAvatar({ user }: { user: ManagedUser }) {
  const avatarUrl = getSavedUserAvatar(user.id, user.email);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user.name}
        className="size-8 shrink-0 rounded-full border border-primary/40 object-cover shadow-xs"
      />
    );
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-medium text-foreground/85">
      {userInitials(user.name)}
    </span>
  );
}

/**
 * Presentation-only user table. Every action is raised to the page, which
 * routes it through the service boundary — no component mutates data itself.
 */
export function UsersTable({
  users,
  onView,
  onEdit,
  onToggleAccess,
  onDelete,
}: {
  users: ManagedUser[];
  onView: (user: ManagedUser) => void;
  onEdit: (user: ManagedUser) => void;
  onToggleAccess: (user: ManagedUser) => void;
  onDelete: (user: ManagedUser) => void;
}) {
  if (users.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-hairline bg-card/60 px-6 py-14 text-center backdrop-blur-xl">
        <Users className="size-5 text-muted-foreground" />
        <p className="mt-2.5 text-[13px] text-foreground/85">No users to display</p>
        <p className="mt-1 max-w-[380px] text-[11.5px] text-muted-foreground">
          No account matches the current search and filters.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card/60 backdrop-blur-xl">
      <div
        className={`hidden gap-3 border-b border-hairline px-4 py-2.5 text-[11px] uppercase tracking-wide text-muted-foreground lg:grid ${gridCols}`}
      >
        <span>User</span>
        <span>Role</span>
        <span>Department</span>
        <span>Access Scope</span>
        <span>Status</span>
        <span>Last Sign-In</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-hairline">
        {users.map((user) => (
          <div
            key={user.id}
            className={`grid grid-cols-1 gap-2 px-4 py-2.5 transition-colors hover:bg-accent/30 lg:items-center lg:gap-3 ${gridCols}`}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <UserAvatar user={user} />
              <span className="min-w-0">
                <button
                  type="button"
                  onClick={() => onView(user)}
                  className="block max-w-full truncate text-left text-[12.5px] text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary"
                >
                  {user.name}
                </button>
                <span className="block truncate text-[11px] text-muted-foreground">
                  {user.email}
                </span>
              </span>
            </div>

            <span>
              <RoleBadge role={user.role} />
            </span>

            <span className="truncate text-[12px] text-foreground/85">{user.department}</span>

            <span className="min-w-0 text-[11.5px] leading-[1.35] text-foreground/80">
              {user.accessScope.map((scope, index) => (
                <span key={scope} className="block truncate">
                  {index === 0 ? scope : `+ ${scope}`}
                </span>
              ))}
            </span>

            <span>
              <StatusBadge status={user.status} />
            </span>

            <span className="truncate text-[11.5px] text-muted-foreground">
              {user.lastSignInLabel ?? "Unavailable"}
            </span>

            <span className="flex items-center gap-1.5 lg:justify-end">
              <ActionButton label={`View ${user.name}`} onClick={() => onView(user)}>
                <Eye className="size-3.5" />
              </ActionButton>
              <ActionButton label={`Edit ${user.name}`} onClick={() => onEdit(user)}>
                <Pencil className="size-3.5" />
              </ActionButton>
              <ActionButton
                label={user.status === "disabled" ? `Enable ${user.name}` : `Disable ${user.name}`}
                onClick={() => onToggleAccess(user)}
              >
                {user.status === "disabled" ? (
                  <Unlock className="size-3.5" />
                ) : (
                  <Lock className="size-3.5" />
                )}
              </ActionButton>
              <ActionButton
                label={`Delete ${user.name}`}
                destructive
                onClick={() => onDelete(user)}
              >
                <Trash2 className="size-3.5" />
              </ActionButton>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
