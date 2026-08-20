import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  PanelLeftClose,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/auth/auth-context";
import { useUserProfile } from "@/auth/use-user-profile";
import { useSidebar } from "@/shared/context/sidebar-context";
import { getVisibleNavigation } from "@/shared/navigation/workspace-navigation";
import { fetchUserChatSessions, deleteDbChatSession } from "@/api/workspace-service";

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
    <aside className="flex min-h-[calc(100vh-6.5rem)] w-[230px] shrink-0 flex-col rounded-3xl border border-hairline/80 bg-gradient-to-b from-card/90 via-card/65 to-card/95 p-3 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      {/* Brand Header */}
      <div className="mb-3 flex items-center justify-between gap-2 px-1.5 py-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid size-8.5 place-items-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-purple-600 text-primary-foreground text-xs font-bold shadow-md shadow-primary/25 ring-2 ring-primary/30">
            N
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h2 className="font-display text-[13.5px] font-bold tracking-tight text-foreground truncate">
                NeroxaAI
              </h2>
              <Sparkles className="size-3 text-primary animate-pulse shrink-0" />
            </div>
            <p className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          title="Collapse sidebar (Ctrl+B)"
          aria-label="Collapse sidebar"
          className="grid size-7 shrink-0 place-items-center rounded-xl border border-hairline/70 bg-secondary/30 text-muted-foreground transition-all hover:border-primary/40 hover:bg-card hover:text-foreground shadow-xs active:scale-95"
        >
          <PanelLeftClose className="size-3.5" />
        </button>
      </div>

     
      {can("assistant:query") ? (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleNewChat}
            className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-primary/45 bg-gradient-to-r from-primary/25 via-purple-500/15 to-primary/10 px-3.5 py-2.5 text-[12px] font-bold text-primary shadow-md shadow-primary/20 transition-all duration-300 hover:border-primary/70 hover:bg-primary/30 hover:scale-[1.02] hover:shadow-primary/30 active:scale-95"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-6 place-items-center rounded-xl bg-primary/20 text-primary border border-primary/35 shadow-xs group-hover:scale-110 transition-transform">
                <MessageSquarePlus className="size-3.5" />
              </span>
              <span className="font-display tracking-tight text-foreground group-hover:text-primary transition-colors">
                New Chat
              </span>
            </div>
            <span className="grid size-5.5 place-items-center rounded-full bg-primary/25 text-primary border border-primary/40 text-[10px] font-bold group-hover:rotate-90 transition-transform duration-300">
              <Plus className="size-3" />
            </span>
          </button>
        </div>
      ) : null}

      {/* Navigation Sections */}
      <nav aria-label="Workspace navigation" className="space-y-4">
        <NavSection label="Workspace" items={workspaceItems} />

        {/* Chat History Section (like ChatGPT / Gemini with glass tiles & active glow) */}
        {can("assistant:query") ? (
          <section className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between px-2.5 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                <p className="font-display text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Chat History
                </p>
              </div>
              {chatSessions.data && chatSessions.data.length > 0 ? (
                <span className="rounded-full bg-primary/15 border border-primary/30 px-2 py-0.2 text-[9px] font-bold text-primary">
                  {chatSessions.data.length}
                </span>
              ) : null}
            </div>

            <div className="max-h-[175px] overflow-y-auto space-y-1 pr-1 scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-secondary/20">
              {chatSessions.isLoading ? (
                <div className="space-y-1.5 px-1 py-1">
                  <div className="h-7 animate-pulse rounded-xl bg-secondary/40" />
                  <div className="h-7 animate-pulse rounded-xl bg-secondary/40" />
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
                      className={`group/chat flex w-full items-center justify-between gap-2 rounded-2xl p-2 text-left text-[12px] font-medium transition-all duration-200 shadow-xs ${
                        isActive
                          ? "border border-primary/60 bg-gradient-to-r from-primary/25 via-primary/12 to-card text-primary font-semibold shadow-sm shadow-primary/15 ring-1 ring-primary/25 translate-x-1"
                          : "border border-hairline/60 bg-secondary/20 text-foreground/80 hover:border-primary/35 hover:bg-secondary/50 hover:text-foreground hover:translate-x-0.5"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={`grid size-6 shrink-0 place-items-center rounded-xl transition-all ${
                            isActive
                              ? "bg-primary/25 text-primary border border-primary/40"
                              : "bg-secondary/40 text-muted-foreground group-hover/chat:text-primary group-hover/chat:bg-primary/15"
                          }`}
                        >
                          <MessageSquare className="size-3" />
                        </span>
                        <span className="truncate max-w-[125px] font-display text-[11.5px]">
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
                        className="opacity-0 group-hover/chat:opacity-100 p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/20 hover:scale-110 active:scale-95 transition-all shrink-0 cursor-pointer"
                      >
                        <Trash2 className="size-3" />
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-hairline/60 bg-secondary/15 p-2.5 text-center">
                  <p className="text-[11px] text-muted-foreground/75 italic">No previous chats</p>
                  <p className="text-[9.5px] text-muted-foreground/60 mt-0.5">Start a prompt above</p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {adminItems.length > 0 ? <NavSection label="Administration" items={adminItems} /> : null}
      </nav>

      {/* Footer Profile & Sign Out Panel */}
      <div className="mt-auto pt-4">
        <div className="h-px bg-gradient-to-r from-transparent via-hairline to-transparent" />

        <Link
          to="/account"
          className="group mt-3 flex items-center gap-3 rounded-2xl border border-transparent bg-secondary/25 px-2.5 py-2.5 transition-all duration-200 hover:border-primary/30 hover:bg-secondary/50 shadow-xs"
        >
          {identity?.avatarUrl ? (
            <img
              src={identity.avatarUrl}
              alt={identity.name}
              className="size-8.5 shrink-0 rounded-full border border-primary/40 object-cover shadow-sm group-hover:scale-105 transition-transform"
            />
          ) : (
            <span className="grid size-8.5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 via-secondary to-primary/10 text-[11px] font-semibold text-foreground border border-primary/30 shadow-sm group-hover:scale-105 transition-transform">
              {identity?.name.slice(0, 1).toUpperCase() ?? "N"}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[12px] font-semibold text-foreground group-hover:text-primary transition-colors">
              {identity?.name ?? "Account"}
            </span>
            <span className="block truncate text-[10px] text-muted-foreground">
              {identity?.roleLabel ?? identity?.role ?? "Employee"}
            </span>
          </div>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1.5 flex w-full items-center gap-2.5 rounded-2xl px-3 py-2 text-[12px] font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/15 hover:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
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
      <p className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">
        {label}
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeProps={{
              className:
                "bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border-l-2 border-primary text-primary font-semibold shadow-xs",
            }}
            inactiveProps={{
              className:
                "text-foreground/75 border-l-2 border-transparent hover:bg-secondary/40 hover:text-foreground",
            }}
            className="group flex items-center gap-3 rounded-xl px-3 py-2 text-[12.5px] transition-all duration-200"
          >
            <item.icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
