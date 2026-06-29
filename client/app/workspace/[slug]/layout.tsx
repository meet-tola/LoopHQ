"use client";

import React, { use } from "react"; // Import use
import { CompactSidebar } from "@/components/workspace/CompactSidebar";
import { ExpandedSidebar } from "@/components/workspace/ExpandedSidebar";
import { RightSidebar } from "@/components/workspace/RightSidebar";
import { SettingsModal } from "@/components/workspace/SettingsModal";
import { useUI } from "@/providers/UIProvider";
import { useWorkspaces } from "@/hooks/queries/useWorkspaces";
import { Loader2 } from "lucide-react";
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
  const { user, isLoading: authLoading } = useAuth();

  const currentWorkspace = workspaces?.find((w) => w.slug === slug);

  if (isLoading || authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground p-6 text-center">
        <h2 className="text-lg font-bold">Workspace not identified</h2>
        <p className="text-sm text-muted-foreground mt-1">
          The workspace "{slug}" may not exist or your profile lacks clearance permissions.
        </p>
      </div>
    );
  }

  const workspaceId = currentWorkspace.id;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Compact Sidebar */}
      <CompactSidebar />
      {/* <CompactSidebar workspaceId={workspaceId} /> */}

      {/* Expanded Sidebar */}
      <ExpandedSidebar
        workspaceId={workspaceId}
        workspaceName={currentWorkspace.name}
      />

      {/* Main Content */}
      <main className="flex-1 flex min-w-0 overflow-hidden">
        {children}

        {/* Right Sidebar - Desktop Toggle Variant */}
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

      {/* Right Sidebar - Mobile overlay version */}
      <div className="lg:hidden">
        <RightSidebar workspaceId={workspaceId} />
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
}