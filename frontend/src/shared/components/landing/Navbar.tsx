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
import { ShimmerButton } from "@/shared/components/magicui/shimmer-button";

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
    <header className="relative z-50">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 w-full max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8"
      >
        {/* Brand Logo */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <Logo className="h-5 w-5 text-foreground" />
          <span className="font-display text-[17px] font-medium tracking-tight text-foreground">
            NeroxaAI
          </span>
        </Link>

        {/* Shadcn Navigation Menu (Desktop) */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-[13.5px] font-normal text-foreground/85 hover:bg-accent/60 hover:text-foreground data-[state=open]:bg-accent/60">
                Features
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0 border-0 bg-transparent shadow-none">
                <FeaturesDropdown onSelect={() => {}} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-[13.5px] font-normal text-foreground/85 hover:bg-accent/60 hover:text-foreground data-[state=open]:bg-accent/60">
                Security
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0 border-0 bg-transparent shadow-none">
                <SecurityDropdown onSelect={() => {}} />
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-[13.5px] font-normal text-foreground/85 hover:bg-accent/60 hover:text-foreground data-[state=open]:bg-accent/60">
                Architecture
              </NavigationMenuTrigger>
              <NavigationMenuContent className="p-0 border-0 bg-transparent shadow-none">
                <div className="w-[300px] rounded-xl border border-hairline bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
                  <p className="font-display text-[13px] font-medium text-foreground">
                    Enterprise RAG Architecture
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
                    Powered by FastAPI, Qdrant Vector Search, Local Llama 3 via Ollama, and strict RBAC access enforcement.
                  </p>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a
                  href="#documentation"
                  className="bg-transparent text-[13.5px] font-normal text-foreground/85 hover:bg-accent/60 hover:text-foreground"
                >
                  Documentation
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <a
                  href="#about"
                  className="bg-transparent text-[13.5px] font-normal text-foreground/85 hover:bg-accent/60 hover:text-foreground"
                >
                  About
                </a>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* User Account / CTA Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          {session ? (
            /* Shadcn Dropdown Menu for Authenticated Account */
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 rounded-xl border-hairline bg-card/60 px-3 py-1.5 text-[13px] text-foreground transition-colors hover:bg-accent/60"
                >
                  {identity?.avatarUrl ? (
                    <img
                      src={identity.avatarUrl}
                      alt={identity.name}
                      className="size-6 shrink-0 rounded-full border border-primary/40 object-cover"
                    />
                  ) : (
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-medium text-foreground">
                      {identity?.name.slice(0, 1).toUpperCase() ?? ""}
                    </span>
                  )}
                  <span className="max-w-[120px] truncate font-medium">{identity?.name ?? ""}</span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-hairline bg-card/95 p-1 shadow-2xl backdrop-blur-xl"
              >
                <DropdownMenuLabel className="px-3 py-2">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {identity?.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">{identity?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-hairline" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-[12.5px]">
                  <Link to="/account" className="flex items-center gap-2">
                    <UserCircle2 className="size-4 text-primary" />
                    Your Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-3 py-2 text-[12.5px]">
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <LayoutGrid className="size-4 text-primary" />
                    Workspace Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-hairline" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer rounded-lg px-3 py-2 text-[12.5px] text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="size-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-[13.5px] font-medium">
                <Link to="/login">Login</Link>
              </Button>
              <ShimmerButton
                shimmerColor="#3b82f6"
                background="rgba(15, 23, 42, 0.9)"
                className="text-[13.5px] font-semibold text-white shadow-lg"
                onClick={() => navigate({ to: "/login" })}
              >
                Launch Workspace
              </ShimmerButton>
            </>
          )}

          <Button variant="ghost" asChild className="hidden sm:inline-flex text-[13.5px]">
            <a href="#contact">Contact</a>
          </Button>
        </div>
      </nav>
    </header>
  );
}
