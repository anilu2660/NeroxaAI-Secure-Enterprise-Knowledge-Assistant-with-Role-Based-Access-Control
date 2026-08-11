import { createFileRoute, Link } from "@tanstack/react-router";
import { UserCircle2 } from "lucide-react";
import { AccountProfile } from "@/users/components/AccountProfile";
import { useUserProfile } from "@/auth/use-user-profile";

export const Route = createFileRoute("/_workspace/account")({
  head: () => ({
    meta: [
      { title: "Your Account — NeroxaAI" },
      {
        name: "description",
        content:
          "Your NeroxaAI profile, role, department, organization, knowledge access scope, and permissions, as assigned by an administrator.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your Account — NeroxaAI" },
      {
        property: "og:description",
        content: "Profile, role, department, access scope, and permissions for your account.",
      },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { profile, isPending } = useUserProfile();

  return (
    <section className="space-y-3.5 pt-1">
      <header className="flex min-w-0 items-start gap-3">
        <span className="mt-1 grid size-11 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/12">
          <UserCircle2 className="size-5 text-primary" />
        </span>
        <div className="min-w-0">
          <h1 className="font-display text-[27px] font-medium tracking-tight text-foreground">
            Your Account
          </h1>
          <p className="mt-0.5 max-w-[680px] text-[12.5px] leading-relaxed text-muted-foreground">
            Your profile, role, department, organization, knowledge access scope, and permissions
            come from the single user record an administrator manages in{" "}
            {profile?.role === "ADMIN" ? (
              <Link to="/users" className="text-foreground/85 underline-offset-2 hover:underline">
                User Management
              </Link>
            ) : (
              "User Management"
            )}
            .
          </p>
        </div>
      </header>

      {isPending ? (
        <div className="grid min-h-[40svh] place-items-center rounded-2xl border border-hairline bg-card/50">
          <div className="flex items-center gap-2.5 text-[12.5px] text-muted-foreground">
            <span className="size-3.5 animate-spin rounded-full border border-border border-t-primary" />
            Loading your profile…
          </div>
        </div>
      ) : profile ? (
        <AccountProfile profile={profile} />
      ) : (
        <p className="rounded-2xl border border-hairline bg-card/50 p-4 text-[12.5px] text-muted-foreground">
          No profile is available for this session.
        </p>
      )}
    </section>
  );
}
