import type { ReactNode } from "react";
import { WorkspaceHeader } from "@/shared/components/layout/WorkspaceHeader";
import { WorkspaceSidebar } from "@/shared/components/layout/WorkspaceSidebar";
import { WorkspaceBackground } from "@/shared/components/layout/WorkspaceBackground";
import { WorkspaceMobileNav } from "@/shared/components/layout/WorkspaceMobileNav";
import { SkipToContent } from "@/shared/components/layout/SkipToContent";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <SkipToContent />
      <WorkspaceBackground />
      <div className="relative pb-20 lg:pb-0">
        <WorkspaceHeader />
        <div className="mx-auto flex w-full max-w-[1440px] gap-5 px-4 pb-10 sm:px-6 lg:px-8">
          <aside aria-label="Workspace navigation" className="hidden shrink-0 pt-5 lg:block">
            <div className="sticky top-[4.5rem]"><WorkspaceSidebar /></div>
          </aside>
          <main id="workspace-main" tabIndex={-1} className="min-w-0 flex-1 pt-4 outline-none lg:pt-5">{children}</main>
        </div>
        <WorkspaceMobileNav />
      </div>
    </div>
  );
}
