import { Eye, Lock, Pencil, Trash2, Unlock, Users, Shield } from "lucide-react";
import type { ManagedUser } from "@/api/types";
import { RoleBadge, StatusBadge, userInitials } from "./UserBadges";
import { getSavedUserAvatar } from "@/api/workspace-service";

const gridCols =
  "lg:grid-cols-[minmax(0,2.2fr)_84px_minmax(0,1.1fr)_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_160px]";

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
          ? "grid size-8 place-items-center rounded-xl border border-destructive/35 bg-destructive/10 text-destructive transition-all duration-200 hover:scale-105 hover:bg-destructive/20 active:scale-95 focus-visible:ring-2 focus-visible:ring-destructive"
          : "grid size-8 place-items-center rounded-xl border border-hairline/70 bg-secondary/35 text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-primary/40 hover:bg-card hover:text-foreground active:scale-95 focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
      }
    >
      {children}
    </button>
  );
}

function UserAvatar({ user }: { user: ManagedUser }) {
  const avatarUrl = user.avatarUrl || getSavedUserAvatar(user.id, user.email);
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={user.name}
        className="size-9.5 shrink-0 rounded-2xl border border-primary/40 object-cover shadow-sm ring-2 ring-primary/20"
      />
    );
  }
  return (
    <span className="grid size-9.5 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-secondary via-secondary/80 to-primary/10 border border-hairline text-[12px] font-bold text-foreground shadow-xs ring-1 ring-primary/15">
      {userInitials(user.name)}
    </span>
  );
}

/**
 * Presentation-only user table.
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
      <div className="grid place-items-center rounded-2xl sm:rounded-3xl border border-hairline bg-card/60 px-4 sm:px-6 py-12 sm:py-16 text-center backdrop-blur-2xl shadow-lg">
        <div className="grid size-12 place-items-center rounded-2xl bg-secondary/60 text-muted-foreground mb-3">
          <Users className="size-6 opacity-60" />
        </div>
        <p className="font-display text-sm font-semibold text-foreground">No users to display</p>
        <p className="mt-1 max-w-[380px] text-[12px] text-muted-foreground">
          No account matches the current search and filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl sm:rounded-3xl border border-hairline bg-card/60 shadow-xl backdrop-blur-2xl transition-all">
      <div
        className={`hidden gap-3 border-b border-hairline/80 bg-secondary/20 px-5 py-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground lg:grid ${gridCols}`}
      >
        <span>User</span>
        <span>Role</span>
        <span>Department</span>
        <span>Access Scope</span>
        <span>Status</span>
        <span>Last Sign-In</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-hairline/60">
        {users.map((user) => (
          <div
            key={user.id}
            className={`flex flex-col gap-2.5 p-3.5 sm:p-5 transition-all duration-200 hover:bg-primary/[0.03] lg:grid lg:items-center lg:gap-3 lg:px-5 lg:py-3.5 ${gridCols}`}
          >
            {/* User Info */}
            <div className="flex min-w-0 items-center justify-between lg:justify-start gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <UserAvatar user={user} />
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onView(user)}
                    className="block max-w-full truncate text-left font-display text-[13px] font-semibold text-foreground outline-none transition-colors hover:text-primary focus-visible:text-primary cursor-pointer"
                  >
                    {user.name}
                  </button>
                  <span className="block truncate text-[11px] sm:text-[11.5px] text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>

              {/* Mobile Role Badge */}
              <div className="lg:hidden shrink-0">
                <RoleBadge role={user.role} />
              </div>
            </div>

            {/* Desktop Role */}
            <div className="hidden lg:block">
              <RoleBadge role={user.role} />
            </div>

            {/* Department & Status Row on Mobile */}
            <div className="flex flex-wrap items-center gap-2 lg:contents">
              <div className="truncate text-[11.5px] sm:text-[12px] font-medium text-foreground/90 bg-secondary/40 lg:bg-transparent px-2 py-0.5 lg:p-0 rounded-md">
                {user.department || "General"}
              </div>

              {/* Access Scope */}
              <div className="min-w-0 flex flex-wrap gap-1">
                {user.accessScope && user.accessScope.length > 0 ? (
                  user.accessScope.map((scope, index) => (
                    <span
                      key={scope}
                      className="inline-block max-w-full truncate rounded-md bg-secondary/40 px-2 py-0.5 text-[10.5px] sm:text-[11px] font-medium text-foreground/80 border border-hairline/50"
                    >
                      {index === 0 ? scope : `+ ${scope}`}
                    </span>
                  ))
                ) : (
                  <span className="text-[10.5px] text-muted-foreground">Default Scope</span>
                )}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={user.status} />
              </div>
            </div>

            {/* Last Sign-In & Actions Footer on Mobile */}
            <div className="flex items-center justify-between lg:contents pt-1.5 lg:pt-0 border-t lg:border-t-0 border-hairline/50">
              <div className="truncate text-[10.5px] sm:text-[11.5px] text-muted-foreground">
                {user.lastSignInLabel ?? "Never signed in"}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 justify-end">
                <ActionButton label={`View ${user.name}`} onClick={() => onView(user)}>
                  <Eye className="size-3.5 sm:size-4" />
                </ActionButton>
                <ActionButton label={`Edit ${user.name}`} onClick={() => onEdit(user)}>
                  <Pencil className="size-3.5 sm:size-4" />
                </ActionButton>
                <ActionButton
                  label={user.status === "disabled" ? `Enable ${user.name}` : `Disable ${user.name}`}
                  onClick={() => onToggleAccess(user)}
                >
                  {user.status === "disabled" ? (
                    <Unlock className="size-3.5 sm:size-4 text-emerald-400" />
                  ) : (
                    <Lock className="size-3.5 sm:size-4" />
                  )}
                </ActionButton>
                <ActionButton
                  label={`Delete ${user.name}`}
                  destructive
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="size-3.5 sm:size-4" />
                </ActionButton>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
