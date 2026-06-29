'use client'

import React, { use, useEffect } from "react";
import { MessagingArea } from '@/components/workspace/MessagingArea'
import { useWorkspaces } from "@/hooks/queries/useWorkspaces";
import { useChannels } from "@/hooks/queries/useChannels";
import { useUI } from "@/providers/UIProvider";
import { Loader2 } from "lucide-react";

export default function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = params instanceof Promise ? use(params) : params;
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces(true);
  
  const { selectedChannelId, setSelectedChannelId } = useUI();

  const currentWorkspace = workspaces?.find((w) => w.slug === resolvedParams?.slug);
  const workspaceId = currentWorkspace?.id || "";

  // Fetch channels for the workspace to determine a default channel fallback
  const { data: channels = [], isLoading: channelsLoading } = useChannels(workspaceId);

  // Set the first channel as active if none is currently selected
  useEffect(() => {
    if (!selectedChannelId && channels.length > 0) {
      setSelectedChannelId(channels[0].id);
    }
  }, [channels, selectedChannelId, setSelectedChannelId]);

  if (workspacesLoading || channelsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentWorkspace) return null; 

  // If there are no channels yet, handle the empty state gracefully
  if (channels.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-muted-foreground">
        <p className="text-lg font-medium mb-1">Welcome to {currentWorkspace.name}!</p>
        <p className="text-sm">Create a channel in the sidebar to start collaborating.</p>
      </div>
    );
  }

  return (
    <MessagingArea 
      workspaceId={workspaceId} 
      channelId={selectedChannelId || channels[0].id} 
    />
  )
}