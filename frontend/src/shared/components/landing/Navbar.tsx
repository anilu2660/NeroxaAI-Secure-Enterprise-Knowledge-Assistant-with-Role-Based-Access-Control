import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, LayoutGrid, LogOut, Menu, UserCircle2, X, Shield, Cpu, Activity, Sparkles, Layers } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const identity = profile ?? session?.user ?? null;

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-md">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-14 w-full max-w-[1280px] items-center justify-between gap-3 px-4 sm:px-6"
      >
        {/* Brand Logo */}
        <Link to="/" onClick={closeMobileMenu} className="flex shrink-0 items-center gap-2">
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
        <div className="flex items-center gap-1.5 sm:gap-2">
          {session ? (
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-[6px] border-border bg-card px-2.5 sm:px-3 py-1.5 text-[12px] sm:text-[12.5px] text-foreground hover:bg-secondary"
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
                    <span className="max-w-[90px] sm:max-w-[120px] truncate font-medium">{identity?.name ?? ""}</span>
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
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-1.5">
              <Button
                variant="ghost"
                asChild
                className="h-8 rounded-[6px] px-2.5 sm:px-3 text-[12px] sm:text-[12.5px] font-medium text-muted-foreground hover:text-foreground"
              >
                <Link to="/login">Sign In</Link>
              </Button>
              <button
                type="button"
                onClick={() => navigate({ to: "/login" })}
                className="inline-flex h-8 items-center justify-center rounded-[6px] bg-primary px-3 sm:px-3.5 text-[12px] sm:text-[12.5px] font-medium text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border border-primary/30 transition-all hover:bg-primary/90 active:scale-[0.98] cursor-pointer"
              >
                Launch Workspace
              </button>
            </div>
          )}

          <ThemeToggle />

          {/* Mobile Hamburger Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="grid size-8.5 place-items-center rounded-[6px] border border-border bg-card text-foreground md:hidden hover:bg-secondary transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="size-4.5" /> : <Menu className="size-4.5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Out Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-card/95 px-4 py-4 backdrop-blur-xl md:hidden shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-3">
            {/* Navigation links for mobile */}
            <div className="space-y-1">
              <a
                href="#benefits"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Sparkles className="size-4 text-primary" />
                <span>Capabilities &amp; RBAC</span>
              </a>
              <a
                href="#security"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Shield className="size-4 text-primary" />
                <span>Zero-Trust Security</span>
              </a>
              <a
                href="#how-it-works"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Layers className="size-4 text-primary" />
                <span>Execution Pipeline</span>
              </a>
              <a
                href="#architecture"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Cpu className="size-4 text-primary" />
                <span>Architecture Simulation</span>
              </a>
              <a
                href="#metrics"
                onClick={closeMobileMenu}
                className="flex items-center gap-2.5 rounded-[6px] px-3 py-2.5 text-[13px] font-medium text-foreground hover:bg-secondary transition-colors"
              >
                <Activity className="size-4 text-primary" />
                <span>Performance Benchmarks</span>
              </a>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              {session ? (
                <>
                  <div className="flex items-center gap-2.5 rounded-[6px] bg-secondary/40 p-2.5">
                    {identity?.avatarUrl ? (
                      <img
                        src={identity.avatarUrl}
                        alt={identity.name}
                        className="size-7 shrink-0 rounded-full border border-primary/40 object-cover"
                      />
                    ) : (
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                        {identity?.name.slice(0, 1).toUpperCase() ?? "U"}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-semibold text-foreground">{identity?.name}</p>
                      <p className="truncate text-[10.5px] text-muted-foreground">{identity?.email}</p>
                    </div>
                  </div>

                  <Link
                    to="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] bg-primary py-2.5 text-[13px] font-semibold text-primary-foreground shadow-xs"
                  >
                    <LayoutGrid className="size-4" />
                    Open Workspace Dashboard
                  </Link>

                  <Link
                    to="/account"
                    onClick={closeMobileMenu}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] border border-border bg-secondary/30 py-2 text-[12.5px] font-medium text-foreground hover:bg-secondary"
                  >
                    <UserCircle2 className="size-4 text-primary" />
                    Account Settings
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center justify-center gap-2 rounded-[6px] py-2 text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="size-3.5" />
                    Log Out
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center rounded-[6px] border border-border bg-secondary/40 py-2 text-[12.5px] font-medium text-foreground hover:bg-secondary"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center rounded-[6px] bg-primary py-2 text-[12.5px] font-semibold text-primary-foreground shadow-xs"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
