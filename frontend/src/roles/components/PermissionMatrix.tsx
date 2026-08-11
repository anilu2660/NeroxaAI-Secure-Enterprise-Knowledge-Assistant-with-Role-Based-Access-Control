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
      <div className="space-y-2 rounded-2xl border border-hairline bg-card/55 p-3.5">
        {[0, 1, 2, 3, 4].map((row) => (
          <div key={row} className="h-9 animate-pulse rounded-xl bg-secondary/40" />
        ))}
      </div>
    );
  }

  if (roles.length === 0 || permissions.length === 0) {
    return (
      <div className="grid place-items-center rounded-2xl border border-hairline bg-card/55 px-6 py-14 text-center">
        <ShieldCheck className="size-6 text-muted-foreground" />
        <p className="mt-2 text-[13px] text-foreground">No role definitions available</p>
        <p className="mt-1 max-w-[420px] text-[12px] leading-relaxed text-muted-foreground">
          Roles and permissions will be listed here once the access control service returns the
          organization&apos;s definitions.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-hairline bg-card/55 backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline">
              <th className="px-3.5 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Capability
              </th>
              {roles.map((role) => (
                <th
                  key={role.key}
                  className="w-[132px] px-3.5 py-2.5 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground"
                >
                  <span className="flex items-center gap-1.5">
                    {role.key === "ADMIN" ? (
                      <ShieldCheck className="size-3.5 text-primary" />
                    ) : (
                      <User className="size-3.5" />
                    )}
                    {role.label}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groupOrder.map((group) => {
              const rows = permissions.filter((permission) => permission.group === group);
              if (rows.length === 0) return null;
              return (
                <Fragment key={group}>
                  <tr className="border-b border-hairline bg-secondary/25">
                    <td
                      colSpan={roles.length + 1}
                      className="px-3.5 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {group}
                    </td>
                  </tr>
                  {rows.map((permission) => (
                    <tr
                      key={permission.key}
                      className="border-b border-hairline/70 last:border-b-0"
                    >
                      <td className="px-3.5 py-2.5">
                        <p className="flex items-center gap-1.5 text-[12.5px] text-foreground">
                          {permission.label}
                          {permission.adminOnly ? (
                            <Lock
                              className="size-3 text-primary/80"
                              aria-label="Administrative capability"
                            />
                          ) : null}
                        </p>
                        <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                          {permission.description}
                        </p>
                      </td>
                      {roles.map((role) => {
                        const granted = role.permissions.includes(permission.key);
                        const blocked = permission.adminOnly && role.key !== "ADMIN";
                        return (
                          <td key={role.key} className="px-3.5 py-2.5 align-middle">
                            <button
                              type="button"
                              disabled={blocked}
                              onClick={() => onAttemptChange(role.key, permission.key)}
                              title={
                                blocked
                                  ? "Administrative capability — never granted to standard users"
                                  : "Changes will be available when the authorization service is configured"
                              }
                              aria-label={`${permission.label} for ${role.label}`}
                              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11.5px] transition-colors ${
                                blocked
                                  ? "cursor-not-allowed border-hairline bg-secondary/25 text-muted-foreground/70"
                                  : granted
                                    ? "border-primary/30 bg-primary/[0.12] text-foreground hover:bg-primary/20"
                                    : "border-hairline bg-secondary/35 text-muted-foreground hover:bg-accent/50"
                              }`}
                            >
                              {granted ? (
                                <Check className="size-3.5 text-primary" />
                              ) : (
                                <Minus className="size-3.5" />
                              )}
                              {granted ? "Allowed" : blocked ? "Not applicable" : "Not allowed"}
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
