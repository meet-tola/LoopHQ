"use client";

import { useState } from "react";
import {
  Loader2,
  MessageSquare,
  ArrowRight,
  Plus,
  Hash,
  CheckCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  useWorkspaces,
  useCreateWorkspace,
  useJoinWorkspaceWithCode,
} from "@/hooks/queries/useWorkspaces";
import { slugify } from "@/lib/utils";
import AuthGuard from "@/components/protected/AuthGuard";

export default function WorkspaceSelectorPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [view, setView] = useState<"list" | "create" | "join" | "success">("list");
  const [workspaceName, setWorkspaceName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [joinedWorkspace, setJoinedWorkspace] = useState<{ name: string; slug: string } | null>(null);

  const { data: workspaces, isLoading: workspacesLoading } =
    useWorkspaces(!!user);
  const { mutate: createWorkspace, isPending: creationLoading } =
    useCreateWorkspace();
  const { mutate: joinWorkspace, isPending: joinLoading } =
    useJoinWorkspaceWithCode();

  const handleCreateWorkspace = () => {
    const trimmedName = workspaceName.trim();
    if (!trimmedName) return;

    createWorkspace({
      name: trimmedName,
      slug: slugify(trimmedName),
    });
  };

  const handleJoinWithCode = () => {
    const trimmedCode = joinCode.trim();
    if (!trimmedCode) return;

    joinWorkspace(trimmedCode, {
      onSuccess: (data) => {
        setJoinedWorkspace({
          name: data?.name || "New Team Workspace",
          slug: data?.slug || "new-team-workspace",
        });
        setView("success");
      },
    });
  };

  if (authLoading || workspacesLoading) {
    return (
      <AuthGuard variant="protected">
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-xs font-medium text-muted-foreground animate-pulse">
            Loading workspaces...
          </p>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard variant="protected">
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-4 antialiased selection:bg-primary/20">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">LoopHQ</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Signed in as{" "}
                <span className="font-medium text-foreground">
                  {user?.email}
                </span>
              </p>
            </div>
          </div>

          {view === "list" && (
            <div className="space-y-5">
              <div className="text-center">
                <h2 className="text-lg font-semibold">Welcome back</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a workspace to join your team.
                </p>
              </div>

              <div className="space-y-2">
                {workspaces && workspaces.length > 0 ? (
                  <div className="border border-border rounded-xl divide-y divide-border overflow-hidden bg-card/50 shadow-sm">
                    {workspaces.map((workspace) => (
                      <div
                        key={workspace.id}
                        onClick={() =>
                          window.location.assign(`/workspace/${workspace.slug}`)
                        }
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
                    No workspaces found for this account.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => setView("join")}
                  className="w-full text-xs font-medium gap-2 rounded-xl"
                >
                  <Hash className="w-3.5 h-3.5" /> Join with Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setView("create")}
                  className="w-full text-xs font-medium gap-2 rounded-xl"
                >
                  <Plus className="w-3.5 h-3.5" /> Create a Workspace
                </Button>
              </div>
            </div>
          )}

          {view === "create" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  New Workspace
                </span>
                <h2 className="text-lg font-semibold mt-2">
                  Name your workspace
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Give your workspace a clear and recognizable name.
                </p>
              </div>

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
                      setView("list");
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
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                        Creating...
                      </span>
                    ) : (
                      "Create"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === "join" && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  Join Team
                </span>
                <h2 className="text-lg font-semibold mt-2">
                  Enter invite code
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Type the code sent by your team leader to join their workspace.
                </p>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter workspace code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  disabled={joinLoading}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:opacity-50 transition-all font-medium uppercase tracking-wider text-center"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleJoinWithCode();
                  }}
                />

                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setView("list");
                      setJoinCode("");
                    }}
                    disabled={joinLoading}
                    variant="ghost"
                    className="flex-1 text-xs rounded-lg"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleJoinWithCode}
                    disabled={!joinCode.trim() || joinLoading}
                    className="flex-1 text-xs font-semibold rounded-lg shadow-sm"
                  >
                    {joinLoading ? (
                      <span className="flex items-center gap-1.5 justify-center">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />{" "}
                        Joining...
                      </span>
                    ) : (
                      "Join Workspace"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {view === "success" && (
            <div className="space-y-6 text-center animate-in scale-in duration-200">
              <div className="flex flex-col items-center gap-2">
                <CheckCircle className="w-12 h-12 text-green-500 animate-bounce" />
                <h2 className="text-xl font-bold">Successfully Joined!</h2>
                <p className="text-sm text-muted-foreground">
                  You are now a member of {joinedWorkspace?.name}.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => window.location.assign(`/workspace/${joinedWorkspace?.slug}`)}
                  className="w-full text-xs font-semibold rounded-lg shadow-sm gap-2"
                >
                  Continue to Workspace <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setView("list");
                    setJoinCode("");
                    setJoinedWorkspace(null);
                  }}
                  className="w-full text-xs rounded-lg"
                >
                  Back to Workspace List
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}