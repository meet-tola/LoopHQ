"use client";

import { useUI } from "@/providers/UIProvider";
import {
  useMessages,
  useSendMessage,
  useThreadMessages,
} from "@/hooks/queries/useMessages";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface RightSidebarProps {
  workspaceId: string;
}

export function RightSidebar({ workspaceId }: RightSidebarProps) {
  const ui = useUI();
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    selectedThreadId,
    setSelectedThreadId,
    selectedUserId,
    setSelectedUserId,
    selectedChannelId,
  } = ui;

  const [threadReplyInput, setThreadReplyInput] = useState("");

  const { data: threadReplies = [] } = useThreadMessages(
    selectedThreadId || "",
    selectedChannelId || "",
  );

  const { data: allChannelMessages = [] } = useMessages(
    selectedChannelId || "",
  );
  const parentMessage = allChannelMessages.find(
    (m) => m.id === selectedThreadId,
  );

  const { mutate: sendReply } = useSendMessage();

  const handleSendReply = () => {
    if (!threadReplyInput.trim() || !selectedThreadId) return;

    const activeChannelContextId = selectedChannelId || "";

    if (!activeChannelContextId) {
      console.error(
        "Cannot resolve parent channel boundary constraints targeting this thread reply instance.",
      );
      return;
    }

    sendReply({
      content: threadReplyInput,
      channelId: activeChannelContextId,
      threadId: selectedThreadId,
    });

    setThreadReplyInput("");
  };

  const isVisible = rightSidebarOpen || !!selectedThreadId || !!selectedUserId;

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay for mobile viewframes */}
      {isVisible &&
        typeof window !== "undefined" &&
        window.innerWidth < 1024 && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => {
              setRightSidebarOpen(false);
              setSelectedThreadId(null);
              setSelectedUserId(null);
            }}
          />
        )}

      {/* Sidebar Container */}
      <div
        className={cn(
          "fixed lg:static right-0 top-0 h-screen w-full sm:w-80 bg-card border-l border-border/40 z-40 overflow-hidden flex flex-col transition-all duration-200",
        )}
      >
        {/* Header */}
        <div className="border-b border-border/40 p-4 flex items-center justify-between gap-2 shrink-0">
          <h3 className="font-semibold text-sm">
            {selectedThreadId ? "Thread Context" : "Member Profile"}
          </h3>
          <button
            onClick={() => {
              setRightSidebarOpen(false);
              setSelectedThreadId(null);
              setSelectedUserId(null);
            }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Panel Renderer */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {selectedThreadId ? (
            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Parent Message Card */}
                {parentMessage && (
                  <div className="p-3 rounded-lg border border-border/60 bg-muted/20 mb-2">
                    <p className="text-xs font-bold text-primary mb-1">
                      {parentMessage.user?.name}
                    </p>
                    <p className="text-sm text-foreground">
                      {parentMessage.content}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Replies
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>

                {/* Nested Thread List Container */}
                {threadReplies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                    <p className="text-xs">No responses yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {threadReplies.map((msg) => {
                      const msgTime = msg.createdAt
                        ? new Date(msg.createdAt)
                        : new Date();
                      return (
                        <div
                          key={msg.id}
                          className="p-3 rounded-md bg-secondary/20 border border-border/10"
                        >
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-semibold text-xs">
                              {msg.user?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {msgTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground leading-relaxed">
                            {msg.content}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Thread Chat Input Box */}
              <div className="border-t border-border/40 p-4 bg-background">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Reply..."
                    value={threadReplyInput}
                    onChange={(e) => setThreadReplyInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    className="flex-1 px-3 py-1.5 rounded-md border border-input bg-background text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    size="sm"
                    className="h-8 w-8 p-0 shrink-0"
                    disabled={!threadReplyInput.trim()}
                    onClick={handleSendReply}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedUserId ? (
            <UserProfilePanel userId={selectedUserId} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
              Select a conversation element to begin tracking metrics.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function UserProfilePanel({ userId }: { userId: string }) {
  const mockUser = {
    id: userId,
    name: "Sarah Chen",
    email: "sarah@example.com",
    status: "online",
    statusMessage: "In a meeting",
    joinedAt: new Date("2024-01-15"),
  };

  return (
    <div className="overflow-y-auto p-4 space-y-6">
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xl font-bold text-primary">
          {mockUser.name[0]}
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-base">{mockUser.name}</h3>
          <p className="text-xs text-muted-foreground">{mockUser.email}</p>
          <div className="flex items-center justify-center gap-1.5 mt-2 bg-secondary/40 px-2 py-0.5 rounded-full w-max mx-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground capitalize font-medium">
              {mockUser.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/40 pt-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            About
          </span>
          <p className="text-xs mt-1 text-foreground bg-muted/30 p-2 rounded">
            {mockUser.statusMessage}
          </p>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Joined Workspace
          </span>
          <p className="text-xs mt-0.5 text-foreground">
            {mockUser.joinedAt.toLocaleDateString([], {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
