import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, UserPlus } from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { UsersTable } from "@/users/components/UsersTable";
import { UserFormDialog } from "@/users/components/UserFormDialog";
import { UserDetailsDialog } from "@/users/components/UserDetailsDialog";
import { ConfirmActionDialog } from "@/shared/components/admin/ConfirmActionDialog";
import { statusLabel } from "@/users/components/UserBadges";
import { useAuth } from "@/auth/auth-context";
import type { ManagedUser, ManagedUserDraft, ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import {
  createManagedUser,
  deleteManagedUser,
  getManagedUserFilterOptions,
  getManagedUserVocabularies,
  listManagedUsers,
  setManagedUserStatus,
  updateManagedUser,
} from "@/api/workspace-service";
import { cn } from "@/shared/utils/utils";

export const Route = createFileRoute("/_workspace/users")({
  head: () => ({
    meta: [
      { title: "User Management — NeroxaAI Admin" },
      {
        name: "description",
        content:
          "Administrators manage organizational users, roles, departments, and knowledge access permissions across the NeroxaAI workspace.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "User Management — NeroxaAI Admin" },
      {
        property: "og:description",
        content:
          "Manage users, roles, departments, and access scope in the NeroxaAI admin console.",
      },
    ],
  }),
  component: UserManagementRoute,
});

function UserManagementRoute() {
  return (
    <RoleGuard role="ADMIN" permission="users:manage">
      <UserManagementPage />
    </RoleGuard>
  );
}

const selectClass =
  "h-9 w-full rounded-xl border border-hairline bg-secondary/35 px-2.5 text-[12px] text-foreground/90 outline-none transition-colors hover:bg-accent/40 focus-visible:border-primary/60";

const PAGE_SIZE = 6;

type DialogState =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "edit"; user: ManagedUser }
  | { kind: "view"; user: ManagedUser }
  | { kind: "toggle"; user: ManagedUser }
  | { kind: "delete"; user: ManagedUser };

function UserManagementPage() {
  const { session } = useAuth();
  const admin = session?.user ?? null;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<ManagedUserStatus | "">("");
  const [accessScope, setAccessScope] = useState("");
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const [notice, setNotice] = useState<string | null>(null);

  const vocabularies = getManagedUserVocabularies();

  const filters = useQuery({
    queryKey: ["managed-user-filters"],
    queryFn: getManagedUserFilterOptions,
  });

  const users = useQuery({
    queryKey: ["managed-users", search, role, department, status, accessScope],
    queryFn: () => listManagedUsers({ search, role, department, status, accessScope }),
  });

  const rows = users.data ?? [];
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [rows, currentPage],
  );

  const refresh = (message: string) => {
    setNotice(message);
    void queryClient.invalidateQueries({ queryKey: ["managed-users"] });
    void queryClient.invalidateQueries({ queryKey: ["managed-user-filters"] });
    // The signed-in user's own profile is the same record, so refresh it too.
    void queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    void queryClient.invalidateQueries({ queryKey: ["access-profile"] });
    // Scope-filtered document reads and the admin/access views count the same
    // directory records, so they refetch after any user change.
    void queryClient.invalidateQueries({ queryKey: ["recent-documents"] });
    void queryClient.invalidateQueries({ queryKey: ["knowledge-overview"] });
    void queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    void queryClient.invalidateQueries({ queryKey: ["access-control"] });
    setDialog({ kind: "none" });
  };

  const create = useMutation({
    mutationFn: (draft: ManagedUserDraft) => createManagedUser(draft),
    onSuccess: (result) => refresh(result.message),
  });
  const update = useMutation({
    mutationFn: (input: { id: string; draft: ManagedUserDraft }) =>
      updateManagedUser(input.id, input.draft),
    onSuccess: (result) => refresh(result.message),
  });
  const toggleAccess = useMutation({
    mutationFn: (input: { id: string; status: ManagedUserStatus }) =>
      setManagedUserStatus(input.id, input.status),
    onSuccess: (result) => refresh(result.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteManagedUser(id),
    onSuccess: (result) => refresh(result.message),
  });

  const hasFilters = !!(search || role || department || status || accessScope);
  const resetFilters = () => {
    setSearch("");
    setRole("");
    setDepartment("");
    setStatus("");
    setAccessScope("");
    setPage(1);
  };

  const rangeStart = rows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, rows.length);

  return (
    <section className="space-y-3.5 pt-1">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <Link to="/admin" className="transition-colors hover:text-foreground">
              Admin Dashboard
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground/80">User Management</span>
          </nav>
          <h1 className="mt-1.5 font-display text-[27px] font-medium tracking-tight text-foreground">
            User Management
          </h1>
          <p className="mt-1 max-w-[620px] text-[12.5px] leading-relaxed text-muted-foreground">
            Administrators manage organizational users, roles, departments, and access permissions.
            Control who can access what across the NeroxaAI workspace
            {admin ? ` · signed in as ${admin.name}` : ""}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDialog({ kind: "create" })}
          className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <UserPlus className="size-4" />
          Add User
        </button>
      </header>

      <div className="rounded-2xl border border-hairline bg-card/60 p-3 backdrop-blur-xl">
        <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search users by name or email..."
              aria-label="Search users"
              className="h-9 w-full rounded-xl border border-hairline bg-secondary/35 pl-9 pr-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/80 outline-none transition-colors focus-visible:border-primary/60"
            />
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Role</span>
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role | "");
                setPage(1);
              }}
              aria-label="Filter by role"
              className={selectClass}
            >
              <option value="">All Roles</option>
              {(filters.data?.roles ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Department</span>
            <select
              value={department}
              onChange={(event) => {
                setDepartment(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by department"
              className={selectClass}
            >
              <option value="">All Departments</option>
              {(filters.data?.departments ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as ManagedUserStatus | "");
                setPage(1);
              }}
              aria-label="Filter by status"
              className={selectClass}
            >
              <option value="">All Status</option>
              {(filters.data?.statuses ?? []).map((value) => (
                <option key={value} value={value}>
                  {statusLabel[value]}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="block text-[11px] text-muted-foreground">Access Scope</span>
            <select
              value={accessScope}
              onChange={(event) => {
                setAccessScope(event.target.value);
                setPage(1);
              }}
              aria-label="Filter by access scope"
              className={selectClass}
            >
              <option value="">All Scopes</option>
              {(filters.data?.accessScopes ?? []).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasFilters}
            className="flex h-9 items-center gap-2 rounded-xl border border-hairline bg-secondary/35 px-3 text-[12px] text-foreground/85 transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-40"
          >
            <SlidersHorizontal className="size-3.5" />
            Reset
          </button>
        </div>
      </div>

      {users.isLoading ? (
        <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-14 text-center text-[12.5px] text-muted-foreground backdrop-blur-xl">
          Loading users…
        </div>
      ) : users.isError ? (
        <div className="rounded-2xl border border-hairline bg-card/60 px-6 py-14 text-center backdrop-blur-xl">
          <p className="text-[13px] text-foreground/85">User directory unavailable</p>
          <p className="mt-1 text-[11.5px] text-muted-foreground">
            The identity service did not respond, so no accounts were loaded.
          </p>
        </div>
      ) : (
        <>
          <UsersTable
            users={pageRows}
            onView={(user) => setDialog({ kind: "view", user })}
            onEdit={(user) => setDialog({ kind: "edit", user })}
            onToggleAccess={(user) => setDialog({ kind: "toggle", user })}
            onDelete={(user) => setDialog({ kind: "delete", user })}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11.5px] text-muted-foreground">
              {rows.length === 0
                ? "No users to display"
                : `Showing ${rangeStart} to ${rangeEnd} of ${rows.length} users`}
            </p>
            <div className="flex items-center gap-1.5">
              <PageButton
                label="Previous page"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                <ChevronLeft className="size-3.5" />
              </PageButton>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPage(value)}
                  aria-current={value === currentPage ? "page" : undefined}
                  className={cn(
                    "grid size-8 place-items-center rounded-lg border text-[12px] transition-colors",
                    value === currentPage
                      ? "border-primary/45 bg-primary/15 text-primary"
                      : "border-hairline bg-secondary/35 text-foreground/80 hover:bg-accent/60",
                  )}
                >
                  {value}
                </button>
              ))}
              <PageButton
                label="Next page"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                <ChevronRight className="size-3.5" />
              </PageButton>
            </div>
          </div>
        </>
      )}

      {notice ? (
        <p className="rounded-xl border border-hairline bg-secondary/25 px-3 py-2 text-[11px] text-muted-foreground">
          {notice}
        </p>
      ) : null}

      <p className="text-[11px] leading-relaxed text-muted-foreground/80">
        Prototype fixtures served through the user service boundary. No identity backend, database,
        or JWT claim source is connected, so sign-in history is unavailable and document-level
        authorization is not enforced. Access scope is configuration only until the backend is
        wired.
      </p>

      <UserFormDialog
        open={dialog.kind === "create" || dialog.kind === "edit"}
        mode={dialog.kind === "edit" ? "edit" : "create"}
        user={dialog.kind === "edit" ? dialog.user : null}
        departments={filters.data?.departments ?? vocabularies.departments}
        accessScopes={filters.data?.accessScopes ?? vocabularies.accessScopes}
        submitting={create.isPending || update.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onSubmit={(draft) => {
          if (dialog.kind === "edit") update.mutate({ id: dialog.user.id, draft });
          else create.mutate(draft);
        }}
      />

      <UserDetailsDialog
        user={dialog.kind === "view" ? dialog.user : null}
        onClose={() => setDialog({ kind: "none" })}
        onEdit={(user) => setDialog({ kind: "edit", user })}
      />

      <ConfirmActionDialog
        open={dialog.kind === "toggle"}
        title={
          dialog.kind === "toggle" && dialog.user.status === "disabled"
            ? "Enable account access"
            : "Disable account access"
        }
        description={
          dialog.kind === "toggle"
            ? dialog.user.status === "disabled"
              ? `Restore workspace access for ${dialog.user.name}?`
              : `Disable workspace access for ${dialog.user.name}? They will be shown as disabled in this prototype directory.`
            : ""
        }
        confirmLabel={
          dialog.kind === "toggle" && dialog.user.status === "disabled" ? "Enable" : "Disable"
        }
        pending={toggleAccess.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onConfirm={() => {
          if (dialog.kind !== "toggle") return;
          toggleAccess.mutate({
            id: dialog.user.id,
            status: dialog.user.status === "disabled" ? "active" : "disabled",
          });
        }}
      />

      <ConfirmActionDialog
        open={dialog.kind === "delete"}
        title="Delete user"
        description={
          dialog.kind === "delete"
            ? `Remove ${dialog.user.name} (${dialog.user.email}) from the directory? This cannot be undone once a real backend is connected.`
            : ""
        }
        confirmLabel="Delete user"
        destructive
        pending={remove.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onConfirm={() => {
          if (dialog.kind !== "delete") return;
          remove.mutate(dialog.user.id);
        }}
      />
    </section>
  );
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 place-items-center rounded-lg border border-hairline bg-secondary/35 text-foreground/80 transition-colors hover:bg-accent/60 disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}
