"use client";

import { useState } from "react";
import { Loader2, MessageSquare, ArrowRight, Sparkles, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useWorkspaces,
  useCreateWorkspace,
} from "@/hooks/queries/useWorkspaces";
import { slugify } from "@/lib/utils";

export default function WorkspaceSelectorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");

  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces(!!user);
  const { mutate: createWorkspace, isPending: creationLoading } = useCreateWorkspace();

  const handleCreateWorkspace = () => {
    const trimmedName = workspaceName.trim();
    if (!trimmedName) return;

    createWorkspace({
      name: trimmedName,
      slug: slugify(trimmedName),
    });
  };

  if (authLoading || workspacesLoading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground animate-pulse">
          Loading workspaces...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 antialiased selection:bg-primary/20">
      
      {/* Centralized Card Core */}
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LoopHQ</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Signed in as <span className="font-medium text-foreground">{user?.email}</span>
            </p>
          </div>
        </div>

        {!showCreateForm ? (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="text-lg font-semibold">Welcome back</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select an environment to join your team's workspace feed.
              </p>
            </div>

            {/* Workspaces List Wrapper */}
            <div className="space-y-2">
              {workspaces && workspaces.length > 0 ? (
                <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card/50 shadow-sm">
                  {workspaces.map((workspace) => (
                    <div
                      key={workspace.id}
                      onClick={() => window.location.assign(`/workspace/${workspace.slug}`)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/60 cursor-pointer transition-all group gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-sm uppercase group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                          {workspace.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-medium text-sm truncate">
                            {workspace.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {workspace.members?.length || 1} members
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-xl p-8 text-center text-xs text-muted-foreground bg-card/30">
                  No operational workspaces linked to this account context.
                </div>
              )}
            </div>

            {/* Split Action line */}
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(true)}
              className="w-full text-xs font-medium gap-2 rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Create a Workspace
            </Button>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                New Workspace
              </span>
              <h2 className="text-lg font-semibold mt-2">Name your workspace</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Keep it direct and recognizable for your team members.
              </p>
            </div>

            {/* Compact form items layout */}
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g., Acme Marketing"
                  maxLength={50}
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  disabled={creationLoading}
                  className="w-full h-10 px-3 pr-12 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 transition-all font-medium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateWorkspace();
                  }}
                />
                <span className="absolute right-3 top-3 text-[10px] text-muted-foreground font-semibold">
                  {workspaceName.length}/50
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowCreateForm(false);
                    setWorkspaceName("");
                  }}
                  disabled={creationLoading}
                  variant="ghost"
                  className="flex-1 text-xs rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={!workspaceName.trim() || creationLoading}
                  className="flex-1 text-xs font-semibold rounded-lg shadow-sm"
                >
                  {creationLoading ? (
                    <span className="flex items-center gap-1.5 justify-center">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating...
                    </span>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}