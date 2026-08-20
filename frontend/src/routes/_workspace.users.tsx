import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, UserPlus, ShieldCheck } from "lucide-react";
import { RoleGuard } from "@/roles/components/RoleGuard";
import { UsersTable } from "@/users/components/UsersTable";
import { UserFormDialog } from "@/users/components/UserFormDialog";
import { UserDetailsDialog } from "@/users/components/UserDetailsDialog";
import { ConfirmActionDialog } from "@/shared/components/admin/ConfirmActionDialog";
import { statusLabel } from "@/users/components/UserBadges";
import { useAuth } from "@/auth/auth-context";
import type { ManagedUser, ManagedUserDraft, ManagedUserStatus } from "@/api/types";
import type { Role } from "@/auth/types";
import { createManagedUser, deleteManagedUser, getManagedUserFilterOptions, getManagedUserVocabularies, listManagedUsers, setManagedUserStatus, updateManagedUser } from "@/api/workspace-service";
import { cn } from "@/shared/utils/utils";
import { PageHeader } from "@/shared/components/ui/page-header";
import { StatusPill } from "@/shared/components/ui/status-pill";

export const Route = createFileRoute("/_workspace/users")({ head: () => ({ meta: [{ title: "User Management — NeroxaAI" }, { name: "description", content: "Manage enterprise users, roles, departments and knowledge access." }, { name: "robots", content: "noindex" }] }), component: UserManagementRoute });
function UserManagementRoute() { return <RoleGuard role="ADMIN" permission="users:manage"><UserManagementPage /></RoleGuard>; }
const selectClass =
  "h-9.5 w-full rounded-[6px] border border-border bg-secondary/30 px-2.5 text-[12px] font-medium text-foreground outline-none transition-colors hover:border-foreground/30 focus-visible:border-primary";
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

  const filters = useQuery({ queryKey: ["managed-user-filters"], queryFn: getManagedUserFilterOptions });
  const users = useQuery({
    queryKey: ["managed-users", { search, role, department, status, accessScope }],
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
    for (const key of [
      "managed-users",
      "managed-user-filters",
      "user-profile",
      "access-profile",
      "recent-documents",
      "knowledge-overview",
      "admin-metrics",
      "access-control",
    ])
      void queryClient.invalidateQueries({ queryKey: [key] });
    setDialog({ kind: "none" });
  };

  const create = useMutation({
    mutationFn: (draft: ManagedUserDraft) => createManagedUser(draft),
    onSuccess: (r) => refresh(r.message),
  });
  const update = useMutation({
    mutationFn: (d: { id: string; draft: ManagedUserDraft }) => updateManagedUser(d.id, d.draft),
    onSuccess: (r) => refresh(r.message),
  });
  const toggleAccess = useMutation({
    mutationFn: (d: { id: string; status: ManagedUserStatus }) => setManagedUserStatus(d.id, d.status),
    onSuccess: (r) => refresh(r.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteManagedUser(id),
    onSuccess: (r) => refresh(r.message),
  });

  const resetFilters = () => {
    setSearch("");
    setRole("");
    setDepartment("");
    setStatus("");
    setAccessScope("");
    setPage(1);
  };

  const hasFilters = !!(search || role || department || status || accessScope);
  const rangeStart = rows.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, rows.length);

  return (
    <div className="space-y-4 sm:space-y-6 pb-6 pt-1">
      <PageHeader
        eyebrow="Identity & Governance"
        title="User management"
        description="Manage organizational accounts, roles, departments, and active retrieval access scopes."
        actions={
          <div className="flex items-center gap-2">
            <StatusPill tone="accent" icon={<ShieldCheck className="size-3.5" />}>
              RBAC Directory
            </StatusPill>
            <button
              type="button"
              onClick={() => setDialog({ kind: "create" })}
              className="flex h-9 items-center gap-1.5 rounded-[6px] bg-primary px-3.5 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              <UserPlus className="size-3.5" />
              Add user
            </button>
          </div>
        }
      />

      {/* Search & Filter Toolbar */}
      <section className="rounded-[8px] sm:rounded-[10px] border border-border bg-card p-3.5 sm:p-4 shadow-xs transition-all">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))_auto]">
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search name or email..."
              aria-label="Search users"
              className="h-9.5 w-full rounded-[6px] border border-border bg-secondary/30 pl-9 pr-3 text-[12px] text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors hover:border-foreground/30 focus-visible:border-primary"
            />
          </label>

          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Role
            </span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role | "");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All roles</option>
              {(filters.data?.roles ?? []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Department
            </span>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All departments</option>
              {(filters.data?.departments ?? []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ManagedUserStatus | "");
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All status</option>
              {(filters.data?.statuses ?? []).map((v) => (
                <option key={v} value={v}>
                  {statusLabel[v]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Access scope
            </span>
            <select
              value={accessScope}
              onChange={(e) => {
                setAccessScope(e.target.value);
                setPage(1);
              }}
              className={selectClass}
            >
              <option value="">All scopes</option>
              {(filters.data?.accessScopes ?? []).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="flex h-9.5 w-full items-center justify-center gap-1.5 rounded-[6px] border border-border bg-secondary/30 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <SlidersHorizontal className="size-3.5" />
              Reset
            </button>
          </div>
        </div>
      </section>

      {/* Users Table */}
      {users.isLoading ? (
        <div className="rounded-[8px] border border-border bg-card/60 px-6 py-14 text-center text-[12.5px] text-muted-foreground">
          Loading identity directory…
        </div>
      ) : users.isError ? (
        <div className="rounded-[8px] border border-border bg-card/60 px-6 py-14 text-center text-[12.5px] text-muted-foreground">
          Identity service unavailable.
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

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-[11.5px] font-medium text-muted-foreground">
              {rows.length
                ? `Showing ${rangeStart}–${rangeEnd} of ${rows.length} users`
                : "No users to display"}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
                className="grid size-8 place-items-center rounded-[6px] border border-border bg-secondary/30 text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPage(v)}
                  className={cn(
                    "grid size-8 place-items-center rounded-[6px] border text-[12px] font-semibold transition-colors",
                    v === currentPage
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary/30 text-foreground hover:bg-secondary/60",
                  )}
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="grid size-8 place-items-center rounded-[6px] border border-border bg-secondary/30 text-foreground transition-colors hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      {notice ? (
        <p className="rounded-2xl border border-hairline bg-secondary/25 px-4 py-3 text-[11.5px] text-muted-foreground backdrop-blur-md">
          {notice}
        </p>
      ) : null}

      <UserFormDialog
        open={dialog.kind === "create" || dialog.kind === "edit"}
        mode={dialog.kind === "edit" ? "edit" : "create"}
        user={dialog.kind === "edit" ? dialog.user : null}
        departments={filters.data?.departments ?? vocabularies.departments}
        accessScopes={filters.data?.accessScopes ?? vocabularies.accessScopes}
        submitting={create.isPending || update.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onSubmit={(draft) => {
          if (dialog.kind === "edit") {
            update.mutate({ id: dialog.user.id, draft });
          } else {
            create.mutate(draft);
          }
        }}
      />

      <UserDetailsDialog
        user={dialog.kind === "view" ? dialog.user : null}
        onClose={() => setDialog({ kind: "none" })}
      />

      <ConfirmActionDialog
        open={dialog.kind === "toggle" || dialog.kind === "delete"}
        title={dialog.kind === "delete" ? "Delete user" : "Change user access"}
        description={
          dialog.kind === "delete"
            ? `Delete ${dialog.user.name}? This action cannot be undone.`
            : dialog.kind === "toggle"
              ? `Change access status for ${dialog.user.name}?`
              : ""
        }
        confirmLabel={dialog.kind === "delete" ? "Delete user" : "Confirm"}
        destructive={dialog.kind === "delete"}
        pending={toggleAccess.isPending || remove.isPending}
        onClose={() => setDialog({ kind: "none" })}
        onConfirm={() => {
          if (dialog.kind === "delete") {
            remove.mutate(dialog.user.id);
          } else if (dialog.kind === "toggle") {
            toggleAccess.mutate({
              id: dialog.user.id,
              status: dialog.user.status === "active" ? "disabled" : "active",
            });
          }
        }}
      />

      <p className="text-[11px] leading-relaxed text-muted-foreground/70">
        Access scope is surfaced in the UI for administration; backend authorization remains the final enforcement boundary.
      </p>
    </div>
  );
}
