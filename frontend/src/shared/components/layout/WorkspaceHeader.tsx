import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  IdCard,
  KeyRound,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  ShieldCheck,
  Sparkles,
  User,
  Zap,
} from "lucide-react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import { useSidebar } from "@/shared/context/sidebar-context";
import { WorkspaceCommandPalette } from "./WorkspaceCommandPalette";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/assistant": "AI Assistant",
  "/documents": "Documents",
  "/upload": "Upload Document",
  "/users": "User Management",
  "/audit": "Audit Logs",
  "/access": "Access Control",
  "/account": "Your Account",
  "/admin": "Admin Dashboard",
  "/admin/documents": "Document Management",
};

interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  time: string;
  type: "success" | "info" | "warning";
  read: boolean;
}

const NOTIFICATION_STORAGE_KEY = "neroxa_workspace_notifications";

function getInitialNotifications(): NotificationItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return [];
}

export function WorkspaceHeader() {
  const { session, signOut, can } = useAuth();
  const { profile } = useUserProfile();
  const { collapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  const [notifications, setNotifications] = useState<NotificationItem[]>(getInitialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const identity = profile ?? session?.user ?? null;
  const initials =
    identity?.name
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() ?? "N";
  const pageLabel = PAGE_LABELS[pathname] ?? "Workspace";
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Persist notifications to localStorage on update
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
    } catch (e) {
      // Ignore storage errors
    }
  }, [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    const handleCustomNotification = (event: Event) => {
      const customEv = event as CustomEvent<{
        title: string;
        detail: string;
        type?: "success" | "info" | "warning";
      }>;
      if (customEv.detail) {
        const newNotif: NotificationItem = {
          id: `notif-${Date.now()}-${Math.random()}`,
          title: customEv.detail.title,
          detail: customEv.detail.detail,
          time: "Just now",
          type: customEv.detail.type || "info",
          read: false,
        };
        setNotifications((prev) => [newNotif, ...prev]);
      }
    };

    const handlePermissionsUpdated = () => {
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random()}`,
        title: "RBAC Role Access Modified",
        detail: "Administrator updated role permissions matrix & access scopes.",
        time: "Just now",
        type: "warning",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    };

    const handleDocumentIngested = (event: Event) => {
      const customEv = event as CustomEvent<{ docName?: string; dept?: string }>;
      const docName = customEv.detail?.docName ?? "Knowledge Document";
      const dept = customEv.detail?.dept ? ` in ${customEv.detail.dept}` : "";
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random()}`,
        title: "New Document Ingested",
        detail: `Successfully processed & vectorized '${docName}'${dept}.`,
        time: "Just now",
        type: "success",
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("neroxa:notification", handleCustomNotification);
    window.addEventListener("neroxa:permissions_updated", handlePermissionsUpdated);
    window.addEventListener("neroxa:document_ingested", handleDocumentIngested);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("neroxa:notification", handleCustomNotification);
      window.removeEventListener("neroxa:permissions_updated", handlePermissionsUpdated);
      window.removeEventListener("neroxa:document_ingested", handleDocumentIngested);
    };
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markSingleAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleLogout = async () => {
    setShowUserDropdown(false);
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-hairline/80 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/dashboard" className="flex shrink-0 items-center gap-2 lg:hidden">
            <span className="grid size-7 place-items-center rounded-xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 text-primary-foreground text-xs font-semibold shadow-md shadow-primary/20 ring-2 ring-primary/30">
              N
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-foreground">
              NeroxaAI
            </span>
          </Link>
          <span className="hidden h-4 w-px bg-hairline lg:block" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-display text-[13px] font-semibold text-foreground">
                {pageLabel}
              </p>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] font-medium text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Operational
              </span>
            </div>
            <p className="hidden truncate text-[10.5px] text-muted-foreground sm:block">
              Secure enterprise knowledge workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Command Palette Search Trigger */}
          <WorkspaceCommandPalette />

          {/* Sidebar Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            title={collapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar to expand chat space (Ctrl+B)"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`hidden size-8.5 rounded-xl border transition-all duration-200 lg:flex shadow-xs ${
              collapsed
                ? "border-primary/50 bg-primary/20 text-primary ring-1 ring-primary/30"
                : "border-hairline/60 bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:bg-card hover:text-foreground"
            }`}
          >
            {collapsed ? <PanelLeft className="size-4 text-primary" /> : <PanelLeftClose className="size-4" />}
          </Button>

          {/* Functional Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserDropdown(false);
              }}
              className="relative size-8.5 rounded-xl border border-hairline/60 bg-secondary/30 text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground shadow-xs"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unreadCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                </span>
              ) : null}
            </Button>

            {/* Notification Drawer Popover */}
            {showNotifications ? (
              <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-3xl border border-hairline bg-card/95 p-4 shadow-2xl backdrop-blur-2xl transition-all">
                <div className="flex items-center justify-between pb-3 border-b border-hairline">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-primary/15 text-primary border border-primary/30">
                      <Bell className="size-3.5" />
                    </span>
                    <span className="font-display text-xs font-semibold text-foreground">
                      Notifications
                    </span>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        {unreadCount} new
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                      >
                        <CheckCheck className="size-3.5" /> Mark read
                      </button>
                    ) : null}
                    {notifications.length > 0 ? (
                      <button
                        type="button"
                        onClick={clearAllNotifications}
                        className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                      >
                        Clear
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="mt-3 max-h-72 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                      <Bell className="mx-auto size-6 text-muted-foreground/40 mb-2" />
                      <p className="text-[12.5px] font-semibold text-foreground">No notifications</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        New document uploads, RBAC changes &amp; system alerts will appear here in real-time.
                      </p>
                    </div>
                  ) : (
                    notifications.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => markSingleAsRead(item.id)}
                        className={`group relative cursor-pointer rounded-2xl border p-3 transition-all duration-200 ${
                          !item.read
                            ? "border-primary/30 bg-primary/[0.06] hover:bg-primary/[0.12]"
                            : "border-hairline bg-secondary/20 hover:bg-secondary/40"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[12px] font-semibold text-foreground">{item.title}</p>
                          <span className="text-[10px] text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {item.detail}
                        </p>
                        {!item.read ? (
                          <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                            Unread
                          </span>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Functional User Account Dropdown */}
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 rounded-full border border-hairline/80 bg-secondary/30 p-1 transition-all hover:border-primary/40 hover:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-xs"
            >
              <Avatar className="size-7.5 border border-primary/30">
                <AvatarImage src={identity?.avatarUrl ?? undefined} alt={identity?.name ?? "Account"} />
                <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="size-3.5 mr-1 text-muted-foreground transition-transform duration-200" />
            </button>

            {/* User Account Popover Dropdown */}
            {showUserDropdown ? (
              <div className="absolute right-0 top-11 z-50 w-64 rounded-3xl border border-hairline bg-card/95 p-3 shadow-2xl backdrop-blur-2xl transition-all">
                <div className="flex items-center gap-3 p-2.5 pb-3 border-b border-hairline">
                  <Avatar className="size-10 border border-primary/40 shadow-sm">
                    <AvatarImage src={identity?.avatarUrl ?? undefined} alt={identity?.name ?? "Account"} />
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-foreground">
                      {identity?.name ?? "User"}
                    </p>
                    <p className="truncate text-[10.5px] text-muted-foreground">
                      {identity?.email ?? ""}
                    </p>
                    <span className="mt-1 inline-block rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[9.5px] font-semibold text-primary uppercase">
                      {identity?.role ?? "USER"}
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <Link
                    to="/account"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-accent/60"
                  >
                    <IdCard className="size-4 text-primary" />
                    Your Profile
                  </Link>

                  {can("assistant:query") ? (
                    <Link
                      to="/assistant"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-accent/60"
                    >
                      <Sparkles className="size-4 text-primary" />
                      AI Assistant
                    </Link>
                  ) : null}

                  {can("access:manage") ? (
                    <Link
                      to="/access"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-accent/60"
                    >
                      <KeyRound className="size-4 text-primary" />
                      Access Matrix
                    </Link>
                  ) : null}
                </div>

                <div className="mt-2 pt-2 border-t border-hairline">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/15"
                  >
                    <LogOut className="size-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
