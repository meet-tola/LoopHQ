"use client";

import React, { use } from "react";
import { CompactSidebar } from "@/components/workspace/CompactSidebar";
import { ExpandedSidebar } from "@/components/workspace/ExpandedSidebar";
import { RightSidebar } from "@/components/workspace/RightSidebar";
import { SettingsModal } from "@/components/workspace/SettingsModal";
import { useUI } from "@/providers/UIProvider";
import { useWorkspaces } from "@/hooks/queries/useWorkspaces";
import { useAuth } from "@/hooks/useAuth";

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }> | { slug: string }; 
}) {
  const { rightSidebarOpen } = useUI();
  
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const slug = resolvedParams?.slug;
  const { data: workspaces, isLoading } = useWorkspaces(true);
  const { isLoading: authLoading } = useAuth();
  const currentWorkspace = workspaces?.find((w) => w.slug === slug);

  if (!isLoading && !authLoading && !currentWorkspace) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <h2 className="text-lg font-bold">Workspace not identified</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The workspace "{slug}" may not exist or your profile lacks clearance permissions.
        </p>
      </div>
    );
  }

  const workspaceId = currentWorkspace?.id || "";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <CompactSidebar />
      <ExpandedSidebar
        workspaceId={workspaceId}
        workspaceName={currentWorkspace?.name || "Loading..."}
      />
      <main className="flex-1 flex min-w-0 overflow-hidden">
        {children}
        <div
          className={`
            hidden lg:flex
            transition-all duration-200
            ${rightSidebarOpen ? "w-80" : "w-0"}
          `}
        >
          <RightSidebar workspaceId={workspaceId} />
        </div>
      </main>
      <div className="lg:hidden">
        <RightSidebar workspaceId={workspaceId} />
      </div>
      <SettingsModal />
    </div>
  );
}