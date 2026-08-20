import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftClose,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import { useSidebar } from "@/shared/context/sidebar-context";
import { getVisibleNavigation } from "@/shared/navigation/workspace-navigation";
import { fetchUserChatSessions, deleteDbChatSession } from "@/api/workspace-service";

import { NexoraLogo } from "@/shared/components/ui/NexoraLogo";

export function WorkspaceSidebar() {
  const { session, signOut, can } = useAuth();
  const { profile } = useUserProfile();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const identity = profile ?? session?.user ?? null;
  const location = useRouterState({ select: (s) => s.location });
  const currentPath = location.pathname;
  const currentSearch = (location.search as Record<string, unknown> | undefined)?.["session"] as string | undefined;

  const navigation = getVisibleNavigation(can);
  const workspaceItems = navigation.filter((item) => item.section === "workspace");
  const adminItems = navigation.filter((item) => item.section === "administration");

  const chatSessions = useQuery({
    queryKey: ["chat-sessions", identity?.id],
    queryFn: fetchUserChatSessions,
    enabled: !!identity?.id && can("assistant:query"),
  });

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/login", replace: true });
  };

  const handleNewChat = () => {
    window.dispatchEvent(new CustomEvent("neroxa:new-chat"));
    navigate({ to: "/assistant", search: {} as any });
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteDbChatSession(sessionId);
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (currentSearch === sessionId) {
        navigate({ to: "/assistant", search: {} as any });
      }
    } catch {
      // ignore
    }
  };

  return (
    <aside className="flex min-h-[calc(100vh-6.5rem)] w-[220px] shrink-0 flex-col rounded-[10px] border border-border bg-card p-3 shadow-sm transition-all duration-200">
      {/* Brand Header */}
      <div className="mb-3 flex items-center justify-between gap-2 px-1.5 py-1">
        <div className="flex items-center gap-2 min-w-0">
          <NexoraLogo size={28} animated={false} withGlow={false} variant="plain" />
          <div className="min-w-0">
            <h2 className="font-display text-[13.5px] font-bold tracking-tight text-foreground truncate">
              Nexora AI
            </h2>
            <p className="truncate text-[9.5px] font-medium uppercase tracking-wider text-muted-foreground font-mono">
              Workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          title="Collapse sidebar (Ctrl+B)"
          aria-label="Collapse sidebar"
          className="grid size-6.5 shrink-0 place-items-center rounded-[6px] border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <PanelLeftClose className="size-3.5" />
        </button>
      </div>

      {can("assistant:query") ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex w-full items-center justify-between rounded-[6px] bg-primary px-3 py-2 text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="size-3.5" />
              <span>New Query</span>
            </div>
            <Plus className="size-3" />
          </button>
        </div>
      ) : null}

      {/* Navigation Sections */}
      <nav aria-label="Workspace navigation" className="space-y-4">
        <NavSection label="Workspace" items={workspaceItems} />

        {/* Chat History Section */}
        {can("assistant:query") ? (
          <section className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-2 pb-1">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                History
              </p>
              {chatSessions.data && chatSessions.data.length > 0 ? (
                <span className="rounded-[4px] bg-secondary px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                  {chatSessions.data.length}
                </span>
              ) : null}
            </div>

            <div className="max-h-[175px] overflow-y-auto space-y-1 pr-1">
              {chatSessions.isLoading ? (
                <div className="space-y-1.5 px-1 py-1">
                  <div className="h-6 animate-pulse rounded-[4px] bg-secondary/40" />
                  <div className="h-6 animate-pulse rounded-[4px] bg-secondary/40" />
                </div>
              ) : chatSessions.data && chatSessions.data.length > 0 ? (
                chatSessions.data.map((chat) => {
                  const isActive = currentPath === "/assistant" && currentSearch === chat.id;
                  return (
                    <button
                      key={chat.id}
                      type="button"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("neroxa:select-session", { detail: { sessionId: chat.id } }),
                        );
                        navigate({ to: "/assistant", search: { session: chat.id } as any });
                      }}
                      className={`group/chat flex w-full items-center justify-between gap-2 rounded-[6px] p-2 text-left text-[12px] font-medium transition-colors ${
                        isActive
                          ? "bg-primary/10 border border-primary/30 text-primary font-semibold"
                          : "border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <MessageSquare className="size-3 shrink-0" />
                        <span className="truncate max-w-[125px] text-[11.5px]">
                          {chat.title || "Conversation"}
                        </span>
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => void handleDeleteSession(e, chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            void handleDeleteSession(e as any, chat.id);
                          }
                        }}
                        title="Delete chat session"
                        aria-label="Delete chat session"
                        className="opacity-0 group-hover/chat:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[6px] border border-border bg-secondary/20 p-2 text-center">
                  <p className="text-[10.5px] text-muted-foreground">No recent queries</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {adminItems.length > 0 ? <NavSection label="Administration" items={adminItems} /> : null}
      </nav>

      {/* Footer Profile & Sign Out Panel */}
      <div className="mt-auto pt-3 border-t border-border">
        <Link
          to="/account"
          className="group flex items-center gap-2.5 rounded-[6px] p-2 hover:bg-secondary transition-colors"
        >
          {identity?.avatarUrl ? (
            <img
              src={identity.avatarUrl}
              alt={identity.name}
              className="size-7 shrink-0 rounded-full border border-border object-cover"
            />
          ) : (
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-[10px] font-bold text-foreground">
              {identity?.name.slice(0, 1).toUpperCase() ?? "N"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-foreground">
              {identity?.name ?? "Account"}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground font-mono">
              {identity?.roleLabel ?? identity?.role ?? "Employee"}
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-[11.5px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="size-3.5 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

function NavSection({ label, items }: { label: string; items: ReturnType<typeof getVisibleNavigation> }) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-1">
      <p className="px-2 pb-1 font-mono text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{
              className:
                "bg-primary/10 border-primary text-primary font-semibold border-l-2",
            }}
            inactiveProps={{
              className:
                "text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground border-l-2",
            }}
            className="flex items-center gap-2.5 rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium transition-colors"
          >
            <item.icon className="size-3.5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
