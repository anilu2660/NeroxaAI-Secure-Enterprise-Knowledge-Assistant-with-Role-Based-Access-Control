import { Check, Lock } from "lucide-react";
import type { AccessProfile, UserProfile } from "@/api/types";

/**
 * `user` is the administered user record (Admin -> User Management), so this
 * panel never shows profile details that differ from the Account page.
 */
export function AccessPanel({
  user,
  profile,
}: {
  user: Pick<UserProfile, "name" | "email" | "roleLabel">;
  profile: AccessProfile;
}) {
  return (
    <aside className="w-full shrink-0 rounded-2xl border border-hairline bg-card/60 p-4 shadow-menu backdrop-blur-xl xl:w-[248px]">
      <h2 className="font-display text-[13.5px] font-medium text-foreground">Your Access</h2>

      <div className="mt-3">
        <p className="truncate font-display text-[15.5px] font-medium text-foreground">
          {user.name}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{user.email}</p>
        <p className="mt-0.5 text-[11.5px] text-muted-foreground">{user.roleLabel}</p>
      </div>

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Configured Access Scope
        </p>
        {profile.scope.length === 0 ? (
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
            No access scope assigned to your account yet. An administrator assigns it in User
            Management.
          </p>
        ) : null}
        <ul className="mt-2 space-y-1.5">
          {profile.scope.map((item) => (
            <li key={item.label} className="flex items-center gap-2 text-[12.5px]">
              {item.granted ? (
                <Check className="size-3.5 shrink-0 text-allowed" />
              ) : (
                <Lock className="size-3 shrink-0 text-muted-foreground" />
              )}
              <span className={item.granted ? "text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Security Status</p>
        <ul className="mt-2 space-y-1.5">
          {profile.securityStatus.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-2 text-[12.5px]">
              <span className="flex min-w-0 items-center gap-2">
                {item.granted ? (
                  <Check className="size-3.5 shrink-0 text-allowed" />
                ) : (
                  <Lock className="size-3 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-muted-foreground">{item.label}</span>
              </span>
              {!item.granted ? (
                <span className="shrink-0 rounded-md border border-hairline px-1.5 py-0.5 text-[9.5px] text-muted-foreground">
                  Not connected
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
          Real-time system status. All permissions and retrieval pipelines are enforced by FastAPI backend.
        </p>
      </div>

      <div className="mt-3 border-t border-hairline pt-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
          Knowledge Access
        </p>
        <p className="mt-1 text-[12.5px] text-foreground">{profile.knowledgeAccess}</p>
      </div>
    </aside>
  );
}
