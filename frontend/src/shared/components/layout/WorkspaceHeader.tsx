import { Bell, Command, Search } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";

export function WorkspaceHeader() {
  const { session } = useAuth();
  const { profile } = useUserProfile();
  const identity = profile ?? session?.user ?? null;
  const initials = identity?.name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() ?? "N";

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2 lg:hidden">
          <span className="grid size-7 place-items-center rounded-lg bg-primary text-primary-foreground text-xs font-semibold">N</span>
          <span className="font-display text-sm font-semibold tracking-tight">NeroxaAI</span>
        </Link>

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <button
            type="button"
            className="group flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-hairline bg-card/50 px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-card"
            aria-label="Search workspace"
          >
            <Search className="size-3.5 shrink-0" />
            <span className="flex-1">Search workspace...</span>
            <kbd className="hidden items-center gap-0.5 rounded-md border border-hairline bg-background/60 px-1.5 py-0.5 font-mono text-[9px] sm:flex">
              <Command className="size-2.5" />K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="icon" className="size-8 rounded-lg text-muted-foreground" aria-label="Notifications">
            <Bell className="size-4" />
          </Button>
          <Link to="/account" className="ml-1 rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
            <Avatar className="size-8 border border-hairline">
              <AvatarImage src={identity?.avatarUrl} alt={identity?.name ?? "Account"} />
              <AvatarFallback className="bg-secondary text-[10px] font-medium">{initials}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
