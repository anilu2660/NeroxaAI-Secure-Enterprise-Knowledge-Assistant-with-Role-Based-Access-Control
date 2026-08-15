import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Command, FileText, LayoutDashboard, Search, ShieldCheck, Upload, Users, ScrollText, UserRound } from "lucide-react";

const ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, keywords: "home overview metrics" },
  { label: "AI Assistant", href: "/assistant", icon: Bot, keywords: "rag chat ask search knowledge" },
  { label: "Documents", href: "/documents", icon: FileText, keywords: "knowledge files sources" },
  { label: "Upload document", href: "/upload", icon: Upload, keywords: "ingest index add file" },
  { label: "Users", href: "/users", icon: Users, keywords: "people members accounts" },
  { label: "Access control", href: "/access", icon: ShieldCheck, keywords: "rbac roles permissions security" },
  { label: "Audit logs", href: "/audit", icon: ScrollText, keywords: "security activity compliance events" },
  { label: "Account", href: "/account", icon: UserRound, keywords: "profile settings" },
] as const;

export function WorkspaceCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return ITEMS;
    return ITEMS.filter((item) => `${item.label} ${item.keywords}`.toLowerCase().includes(value));
  }, [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = () => { setOpen(false); setQuery(""); };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="Search workspace" className="hidden h-8 min-w-[200px] items-center justify-between gap-3 rounded-lg border border-hairline bg-secondary/30 px-2.5 text-[10px] text-muted-foreground transition-colors hover:bg-accent/50 md:flex">
        <span className="flex items-center gap-2"><Search className="size-3.5" />Search workspace</span>
        <kbd className="rounded border border-hairline bg-background/50 px-1.5 py-0.5 font-mono text-[9px]">⌘K</kbd>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center bg-background/75 px-4 pt-[12vh] backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Workspace command palette" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-hairline bg-card shadow-2xl shadow-black/40">
            <div className="flex items-center gap-3 border-b border-hairline px-4">
              <Command className="size-4 text-primary" />
              <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search pages, knowledge, and workspace actions…" className="h-12 min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted-foreground" />
              <kbd className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">Esc</kbd>
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-2">
              <p className="px-2 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
              {results.length ? results.map((item) => { const Icon = item.icon; return <Link key={item.href} to={item.href} onClick={close} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11.5px] text-foreground transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none"><span className="grid size-7 place-items-center rounded-lg border border-hairline bg-secondary/50 text-muted-foreground"><Icon className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block">{item.label}</span><span className="block truncate text-[9.5px] text-muted-foreground">{item.keywords}</span></span><span className="text-[9px] text-muted-foreground">↵</span></Link>; }) : <div className="px-3 py-10 text-center text-[11px] text-muted-foreground">No workspace destinations match “{query}”.</div>}
            </div>
            <div className="flex items-center justify-between border-t border-hairline bg-background/30 px-4 py-2 text-[9px] text-muted-foreground"><span>Navigate with search</span><span><kbd className="rounded border border-hairline px-1">Ctrl</kbd> + <kbd className="rounded border border-hairline px-1">K</kbd> to open</span></div>
          </div>
        </div>
      ) : null}
    </>
  );
}
