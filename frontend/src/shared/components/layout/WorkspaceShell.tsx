import type { ReactNode } from "react";
import { WorkspaceHeader } from "@/shared/components/layout/WorkspaceHeader";
import { WorkspaceSidebar } from "@/shared/components/layout/WorkspaceSidebar";
import { WorkspaceBackground } from "@/shared/components/layout/WorkspaceBackground";
import { WorkspaceMobileNav } from "@/shared/components/layout/WorkspaceMobileNav";

export function WorkspaceShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <WorkspaceBackground />
      <div className="relative pb-20 lg:pb-0">
        <WorkspaceHeader />
        <div className="mx-auto flex w-full max-w-[1440px] gap-5 px-4 pb-10 sm:px-6 lg:px-8">
          <aside className="hidden shrink-0 pt-5 lg:block">
            <div className="sticky top-[4.5rem]">
              <WorkspaceSidebar />
            </div>
          </aside>
          <main className="min-w-0 flex-1 pt-4 lg:pt-5">{children}</main>
        </div>
        <WorkspaceMobileNav />
      </div>
    </div>
  );
}
