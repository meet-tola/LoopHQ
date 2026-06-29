"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useVerifyInviteToken, useAcceptEmailInvite } from "@/hooks/queries/useWorkspaces";
import { Loader2, ShieldX, CheckCircle, UserPlus, LogIn, Users } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const [status, setStatus] = useState<
    "checking" | "prompt-auth" | "joining" | "success" | "error"
  >("checking");
  const [workspaceName, setWorkspaceName] = useState("");
  const acceptanceStarted = useRef(false);

  const inviteToken = searchParams.get("token") || "";

  const { data: inviteData, isError: tokenError, isLoading: tokenLoading } = useVerifyInviteToken(
    inviteToken,
    !!inviteToken
  );

  const acceptInviteMutation = useAcceptEmailInvite();

  useEffect(() => {
    if (!inviteToken || tokenError) {
      setStatus("error");
      return;
    }

    if (tokenLoading || !inviteData) {
      setStatus("checking");
      return;
    }

    if (inviteData && 'workspaceName' in inviteData) {
      setWorkspaceName((inviteData as any).workspaceName);
    } else if (inviteData && 'name' in inviteData) {
      setWorkspaceName((inviteData as any).name);
    }

    if (!user) {
      setStatus("prompt-auth");
      return;
    }

    if (acceptanceStarted.current) return;
    acceptanceStarted.current = true;
    setStatus("joining");

    acceptInviteMutation.mutate(inviteToken, {
      onSuccess: () => {
        setStatus("success");
      },
      onError: () => {
        setStatus("error");
      }
    });
  }, [inviteToken, inviteData, tokenError, tokenLoading, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-card border border-border/40 rounded-lg p-8 text-center space-y-6">
        
        {status === "checking" && (
          <div className="space-y-4 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Verifying Invitation</h2>
            <p className="text-sm text-muted-foreground animate-pulse">
              Hold on we're verifying your invitation integrity...
            </p>
          </div>
        )}

        {status === "prompt-auth" && (
          <div className="space-y-5 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight">
                You're Invited!
              </h2>
              <p className="text-sm text-muted-foreground">
                To accept this invitation and securely access this workspace,
                please authenticate your account.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <Link
                href={`/auth/signup?inviteToken=${inviteToken}`}
                className={buttonVariants({
                  className: "w-full text-sm font-semibold gap-2",
                })}
              >
                <UserPlus className="w-4 h-4" /> Create an Account
              </Link>
              <Link
                href={`/auth/login?inviteToken=${inviteToken}`}
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full text-sm font-semibold gap-2",
                })}
              >
                <LogIn className="w-4 h-4" /> Sign In to Existing
              </Link>
            </div>
          </div>
        )}

        {status === "joining" && (
          <div className="space-y-4 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <h2 className="text-xl font-semibold">Joining Workspace</h2>
            <p className="text-sm text-muted-foreground">
              Registering profile membership coordinates...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 flex flex-col items-center">
            <CheckCircle className="h-10 w-10 text-green-500 animate-bounce" />
            <h2 className="text-xl font-semibold">Welcome Aboard!</h2>
            <p className="text-sm text-muted-foreground">
              You have joined{" "}
              <span className="font-semibold text-foreground">
                {workspaceName || "your new workspace"}
              </span>
              ...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-5 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
              <ShieldX className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-destructive">
                Invalid Invitation
              </h2>
              <p className="text-xs text-muted-foreground">
                This link is broken, malformed, or has expired. Please verify
                execution targets with your workspace administrator.
              </p>
            </div>
            <Link
              href="/workspaces"
              className={buttonVariants({
                variant: "outline",
                className: "w-full text-xs",
              })}
            >
              Go to My Workspaces
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}