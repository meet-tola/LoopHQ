"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useWorkspaces } from "@/hooks/queries/useWorkspaces";

interface AuthGuardProps {
  children: React.ReactNode;
  variant: "protected" | "guest";
}

export default function AuthGuard({ children, variant }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const shouldFetchWorkspaces = isAuthenticated && variant === "guest";
  const { data: workspaces, isLoading: isWorkspaceLoading } = useWorkspaces(shouldFetchWorkspaces);

  const isLoading = isAuthLoading || (shouldFetchWorkspaces && isWorkspaceLoading);

  useEffect(() => {
    if (isLoading) return;

    if (variant === "protected" && !isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (variant === "guest" && isAuthenticated) {
      if (workspaces && workspaces.length > 0) {
        router.replace(`/workspace/${workspaces[0].id}`);
      } else {
        router.replace("/workspace");
      }
    }
  }, [isAuthenticated, workspaces, isLoading, variant, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground animate-pulse text-sm font-medium">
        Loading authentication state...
      </div>
    );
  }

  if (variant === "guest" && isAuthenticated) return null;
  if (variant === "protected" && !isAuthenticated) return null;

  return <>{children}</>;
}