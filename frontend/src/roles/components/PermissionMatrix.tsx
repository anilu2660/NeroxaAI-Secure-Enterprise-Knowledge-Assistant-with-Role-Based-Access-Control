import { Fragment } from "react";
import { Check, Lock, Minus, ShieldCheck, User } from "lucide-react";
import type { PermissionDefinition, RoleDefinition } from "@/api/types";

const groupOrder = ["Workspace", "Knowledge", "Administration"] as const;

/**
 * Compact permission matrix. Toggles are intentionally read-only affordances:
 * the authorization service is not connected, so a frontend change would not
 * grant or revoke anything.
 */
export function PermissionMatrix({
  roles,
  permissions,
  loading,
  onAttemptChange,
}: {
  roles: RoleDefinition[];
  permissions: PermissionDefinition[];
  loading: boolean;
  onAttemptChange: (roleKey: string, permissionKey: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2 rounded-3xl border border-hairline bg-card/55 p-4">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-10 animate-pulse rounded-2xl bg-secondary/40" />
        ))}
      </div>
    );
  }

  if (roles.length === 0 || permissions.length === 0) {
    return (
      <div className="grid place-items-center rounded-3xl border border-hairline bg-card/55 px-6 py-14 text-center">
        <ShieldCheck className="size-8 text-muted-foreground" />
        <p className="mt-3 font-display text-sm font-semibold text-foreground">No role definitions available</p>
        <p className="mt-1 max-w-[420px] text-[12px] leading-relaxed text-muted-foreground">
          Roles and permissions will be listed here once the access control service returns the
          organization&apos;s definitions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-hairline bg-card/60 shadow-xl backdrop-blur-2xl transition-all">
      <div className="overflow-x-auto max-h-[560px] scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-secondary/20">
        <table className="w-full min-w-[680px] border-collapse text-left">
          <thead className="sticky top-0 z-20 border-b border-hairline/80 bg-card/95 backdrop-blur-2xl">
            <tr>
              <th className="px-4 py-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
                Capability &amp; Scope
              </th>
              {roles.map((role) => (
                <th
                  key={role.key}
                  className="w-[145px] px-4 py-3 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5 font-display font-semibold text-foreground">
                    {role.key === "ADMIN" ? (
                      <ShieldCheck className="size-4 text-primary" />
                    ) : (
                      <User className="size-4 text-sky-400" />
                    )}
                    {role.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/60">
            {groupOrder.map((group) => {
              const rows = permissions.filter(
                (permission) =>
                  permission.group === group &&
                  permission.key !== "access:manage" &&
                  permission.label !== "Access Control",
              );
              if (rows.length === 0) return null;
              return (
                <Fragment key={group}>
                  <tr className="border-b border-hairline bg-secondary/35">
                    <td
                      colSpan={roles.length + 1}
                      className="px-4 py-2 text-[10.5px] font-bold uppercase tracking-wider text-primary"
                    >
                      {group} Capabilities
                    </td>
                  </tr>
                  {rows.map((permission) => (
                    <tr
                      key={permission.key}
                      className="transition-all duration-150 hover:bg-primary/[0.03]"
                    >
                      <td className="px-4 py-3">
                        <p className="flex items-center gap-2 font-display text-[13px] font-semibold text-foreground">
                          {permission.label}
                          {permission.adminOnly ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.2 text-[9.5px] font-bold text-primary">
                              <Lock className="size-3" />
                              Admin only
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
                          {permission.description}
                        </p>
                      </td>
                      {roles.map((role) => {
                        const granted = role.permissions.includes(permission.key);
                        return (
                          <td key={role.key} className="px-4 py-3 align-middle">
                            <button
                              type="button"
                              onClick={() => onAttemptChange(role.key, permission.key)}
                              title={
                                granted
                                  ? `Click to toggle '${permission.label}' for ${role.label}`
                                  : `Click to grant '${permission.label}' for ${role.label}`
                              }
                              aria-label={`${permission.label} for ${role.label}`}
                              className={`flex items-center gap-1.5 rounded-2xl border px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-200 active:scale-95 shadow-xs ${
                                granted
                                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 ring-1 ring-emerald-500/20"
                                  : "border-hairline bg-secondary/35 text-muted-foreground/80 hover:border-hairline/80 hover:bg-secondary/60 hover:text-foreground"
                              }`}
                            >
                              {granted ? (
                                <Check className="size-3.5 text-emerald-400 stroke-[2.5]" />
                              ) : (
                                <Minus className="size-3.5" />
                              )}
                              {granted ? "Allowed" : "Not allowed"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
