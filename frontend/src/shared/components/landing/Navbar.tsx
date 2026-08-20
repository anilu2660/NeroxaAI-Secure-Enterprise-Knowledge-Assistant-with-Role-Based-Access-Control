import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LayoutGrid, LogOut, UserCircle2 } from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import { FeaturesDropdown } from "./FeaturesDropdown";
import { SecurityDropdown } from "./SecurityDropdown";
import { Logo } from "./Logo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/shared/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Button } from "@/shared/components/ui/button";
import { ThemeToggle } from "@/shared/components/ui/ThemeToggle";

export function Navbar() {
  const { session, signOut } = useAuth();
  const { profile } = useUserProfile();
  const navigate = useNavigate();

  const identity = profile ?? session?.user ?? null;

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="relative z-50 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-4 px-6"
      >
        {/* Brand Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo className="size-5 shrink-0" />
          <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
            Nexora AI
          </span>
        </Link>

        {/* Navigation Menu (Desktop) */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-[13px] font-medium text-foreground/80 hover:bg-secondary hover:text-foreground">
                Features
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0 border-0 bg-transparent shadow-none">
                <FeaturesDropdown onSelect={() => {}} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-[13px] font-medium text-foreground/80 hover:bg-secondary hover:text-foreground">
                Security
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0 border-0 bg-transparent shadow-none">
                <SecurityDropdown onSelect={() => {}} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a
                  href="#architecture"
                  className="bg-transparent text-[13px] font-medium text-foreground/80 hover:bg-secondary hover:text-foreground"
                >
                  Architecture
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a
                  href="#metrics"
                  className="bg-transparent text-[13px] font-medium text-foreground/80 hover:bg-secondary hover:text-foreground"
                >
                  Benchmarks
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* User Account / CTA Actions */}
        <div className="flex items-center gap-2.5">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-[6px] border-border bg-card px-3 py-1.5 text-[12.5px] text-foreground hover:bg-secondary"
                >
                  {identity?.avatarUrl ? (
                    <img
                      src={identity.avatarUrl}
                      alt={identity.name}
                      className="size-5 shrink-0 rounded-full border border-primary/40 object-cover"
                    />
                  ) : (
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-foreground">
                      {identity?.name.slice(0, 1).toUpperCase() ?? "U"}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate font-medium">{identity?.name ?? ""}</span>
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-[8px] border border-border bg-card p-1 shadow-sm"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {identity?.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{identity?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-[4px] px-3 py-2 text-[12px]">
                  <Link to="/account" className="flex items-center gap-2">
                    <UserCircle2 className="size-4 text-primary" />
                    Your Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-[4px] px-3 py-2 text-[12px]">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutGrid className="size-4 text-primary" />
                    Workspace Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-[4px] px-3 py-2 text-[12px] text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="h-8 rounded-[6px] px-3 text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="inline-flex h-8 items-center justify-center rounded-[6px] bg-primary px-3.5 text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Launch Workspace
              </button>
            </>
          )}

          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
