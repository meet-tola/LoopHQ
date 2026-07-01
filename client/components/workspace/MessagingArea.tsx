"use client";

import React, { useRef, useState } from "react";
import { useUI } from "@/providers/UIProvider";
import { useMessages, useSendMessage } from "@/hooks/queries/useMessages";
import { useChannels } from "@/hooks/queries";
import { useSocketMessages } from "@/hooks/useSocketMessages";
import { Button } from "@/components/ui/button";
import { Tooltip } from "./Tooltip";
import { EmojiPickerModal } from "./EmojiPickerModal";
import {
  Send,
  Smile,
  SmilePlus,
  Paperclip,
  Bell,
  Search,
  MoreVertical,
  MoreHorizontal,
  Hash,
  Lock,
  MessageSquare,
  MessageSquareQuote,
  CheckSquare,
  Eye,
  Forward,
  Bookmark,
  Pin,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Message, ThreadParticipant } from "@/types";

interface MessagingAreaProps {
  workspaceId: string;
  channelId?: string;
}

export function MessagingArea({
  workspaceId,
  channelId = "channel-1",
}: MessagingAreaProps) {
  const { setSelectedThreadId, setRightSidebarOpen } = useUI();
  const [messageInput, setMessageInput] = useState("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const { data: channels = [] } = useChannels(workspaceId);
  const currentChannel = channels.find((c) => c.id === channelId);
  const { data: messages = [], isLoading, isFetching } = useMessages(channelId);
  const { mutate: sendMessage } = useSendMessage();
  const isBackgroundRefetching = isFetching && !isLoading;

  useSocketMessages(channelId);

  const topLevelMessages = messages.filter((m) => !m.threadId);

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    sendMessage({ content: messageInput, channelId });
    setMessageInput("");
  };

  const groupMessagesByDate = (msgArray: Message[]) => {
    return msgArray.reduce((groups: Record<string, Message[]>, message) => {
      const dateTarget = message.createdAt
        ? new Date(message.createdAt)
        : new Date();
      const dateString = dateTarget.toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(message);
      return groups;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(topLevelMessages);

  return (
    <div className="flex-1 flex flex-col h-screen">
      {/* Header */}
      <div className="border-b border-border/40 p-4 sm:p-6 flex items-center justify-between gap-4 bg-linear-to-br from-card to-card/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {currentChannel?.type === "PRIVATE" ? (
              <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <Hash className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold truncate">
              #{" "}
              {currentChannel
                ? currentChannel.name
                : channelId.replace("channel-", "announcements")}
            </h2>
            {!isLoading && (
              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
                {topLevelMessages.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Tooltip content="Notification preferences" side="bottom">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip content="Search this channel" side="bottom">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Search className="w-5 h-5" />
            </Button>
          </Tooltip>
          <Tooltip content="More actions" side="bottom">
            <Button variant="ghost" size="icon" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Messages Feed Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isBackgroundRefetching && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-xs z-50 pointer-events-none flex items-start justify-center pt-4 transition-all duration-300">
            <div className="bg-primary text-primary-foreground px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Updating messages...</span>
            </div>
          </div>
        )}
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-3 items-start p-4">
                <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-muted rounded w-24" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : topLevelMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-muted-foreground text-sm">
            <p className="font-semibold">No history found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, messageList]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary/60 rounded font-medium">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="space-y-4">
                  {messageList.map((message) => {
                    const thread = message.parentOf?.[0];
                    const totalReplies = thread?.replyCount || 0;
                    const participants = thread?.participants || [];

                    return (
                      <MessageItem
                        key={message.id}
                        message={message}
                        replyCount={totalReplies}
                        lastReplyAt={thread?.lastReplyAt ?? undefined}
                        participants={participants}
                        isSelected={selectedMessageId === message.id}
                        onSelect={() => setSelectedMessageId(message.id)}
                        onReplyClick={() => {
                          setSelectedThreadId(message.id);
                          setRightSidebarOpen(true);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Action Input footer */}
      <div className="border-t border-border/40 bg-card p-4 sm:p-6">
        <div className="flex gap-3 items-end">
          <Tooltip content="Attach a file" side="top">
            <button className="text-muted-foreground hover:text-foreground p-2 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
          </Tooltip>
          <div className="flex-1 flex items-end gap-2 bg-secondary/30 border border-border/40 rounded-lg px-3 py-2">
            <input
              type="text"
              placeholder={`Message #${currentChannel ? currentChannel.name : "channel"}`}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm"
            />
            <button className="text-muted-foreground hover:text-foreground p-1">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <Button
            size="sm"
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageItem({
  message,
  replyCount,
  lastReplyAt,
  participants,
  isSelected,
  onSelect,
  onReplyClick,
}: {
  message: Message;
  replyCount: number;
  lastReplyAt?: string;
  participants: ThreadParticipant[];
  isSelected: boolean;
  onSelect: () => void;
  onReplyClick: () => void;
}) {
  const { setSelectedUserId, setRightSidebarOpen } = useUI();
  const [isHovered, setIsHovered] = useState(false);
  const messageTime = message.createdAt
    ? new Date(message.createdAt)
    : new Date();

  const lastReplyLabel = lastReplyAt
    ? formatRelativeTime(new Date(lastReplyAt))
    : null;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative p-4 rounded-lg transition-all cursor-pointer group border border-transparent flex flex-col gap-1",
        isSelected
          ? "bg-primary/10 border-primary/20 shadow-xs"
          : isHovered
            ? "bg-secondary/20 border-border/30 shadow-xs"
            : "",
      )}
    >
      {/* Floating hover toolbar */}
      <div
        className={cn(
          "absolute -top-3 right-3 flex items-center gap-0.5 bg-card border border-border/60 rounded-md shadow-md px-1 py-1 transition-opacity z-10",
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <HoverToolbarButton tooltip="Mark as done" side="top">
          <CheckSquare className="w-4 h-4" />
        </HoverToolbarButton>
        <HoverToolbarButton tooltip="Watch this message" side="top">
          <Eye className="w-4 h-4" />
        </HoverToolbarButton>
        <HoverToolbarButton tooltip="React with 🙌" side="top">
          <span className="text-sm leading-none">🙌</span>
        </HoverToolbarButton>
        <ReactionPickerMenu messageId={message.id} side="top" />
        <HoverToolbarButton
          tooltip="Reply in thread"
          side="top"
          onClick={onReplyClick}
        >
          <MessageSquareQuote className="w-4 h-4" />
        </HoverToolbarButton>
        <HoverToolbarButton tooltip="Forward message" side="top">
          <Forward className="w-4 h-4" />
        </HoverToolbarButton>
        <HoverToolbarButton tooltip="Save for later" side="top">
          <Bookmark className="w-4 h-4" />
        </HoverToolbarButton>
        <HoverToolbarButton tooltip="More actions" side="top">
          <MoreHorizontal className="w-4 h-4" />
        </HoverToolbarButton>
      </div>

      {message.pinned && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
          <Pin className="w-3 h-3" />
          <span>
            Pinned by <span className="font-semibold">{message.pinned}</span>
          </span>
        </div>
      )}

      <div className="flex gap-3 items-start">
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (message.user?.id) {
              setSelectedUserId(message.user.id);
              setRightSidebarOpen(true);
            }
          }}
          className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-xs hover:scale-105 transition-transform"
        >
          {message.user?.avatarUrl ? (
            <img
              src={message.user.avatarUrl}
              alt={message.user.name || "User"}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-linear-to-br from-primary to-primary/70 flex items-center justify-center text-xs font-bold text-white">
              {message.user?.name ? message.user.name[0] : "U"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="font-bold text-sm text-foreground">
              {message.user?.name || "Unknown User"}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {messageTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          <p className="text-sm text-foreground wrap-break-word leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {Object.entries(
                message.reactions.reduce((acc: Record<string, number>, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {}),
              ).map(([emoji, count]) => (
                <Tooltip
                  key={emoji}
                  content={`${count} reacted with ${emoji}`}
                  side="top"
                >
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border/40 font-medium hover:border-primary/50 transition-colors"
                  >
                    {emoji} {count}
                  </button>
                </Tooltip>
              ))}
              <ReactionPickerMenu messageId={message.id} side="top" compact />
            </div>
          )}

          {/* Thread Replies Button Group Row */}
          {replyCount > 0 && (
            <div className="block mt-2.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReplyClick();
                }}
                className="flex items-center gap-2 text-xs hover:bg-card hover:border-border/60 border border-transparent px-2 py-1 rounded-md -ml-2 transition-all group/thread bg-transparent"
              >
                {/* Participant Avatars Array */}
                <div className="flex items-center -space-x-1 mr-1">
                  {participants.length > 0 ? (
                    participants.slice(0, 4).map((p) =>
                      p.avatarUrl ? (
                        <img
                          key={p.id}
                          src={p.avatarUrl}
                          alt={p.name || "Participant"}
                          className="w-6 h-6 rounded-md object-cover border border-card"
                        />
                      ) : (
                        <div
                          key={p.id}
                          className="w-6 h-6 rounded-md bg-primary text-[10px] font-bold text-white flex items-center justify-center border border-card"
                        >
                          {p.name ? p.name[0] : "U"}
                        </div>
                      ),
                    )
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-linear-to-br from-primary to-primary/70 flex items-center justify-center border border-card">
                      <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Text switching transitions */}
                <span className="text-primary font-semibold">
                  <span className="inline group-hover/thread:hidden">
                    {replyCount} {replyCount === 1 ? "reply" : "replies"}
                  </span>
                  <span className="hidden group-hover/thread:inline">
                    View thread
                  </span>
                </span>

                {lastReplyLabel && (
                  <span className="text-muted-foreground group-hover/thread:opacity-80 transition-opacity">
                    Last reply {lastReplyLabel}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HoverToolbarButton({
  children,
  tooltip,
  side = "top",
  onClick,
}: {
  children: React.ReactNode;
  tooltip: string;
  side?: "top" | "bottom" | "left" | "right";
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <Tooltip content={tooltip} side={side}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors flex items-center justify-center"
      >
        {children}
      </button>
    </Tooltip>
  );
}

function ReactionPickerMenu({
  messageId,
  side = "bottom",
  compact = false,
}: {
  messageId: string;
  side?: "top" | "bottom" | "left" | "right";
  compact?: boolean;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const handleAddReaction = (emoji: string) => {
    setShowPicker(false);
  };
  return (
    <>
      <Tooltip content="Add reaction" side={side}>
        <button
          ref={triggerRef}
          onClick={(e) => {
            e.stopPropagation();
            setShowPicker((s) => !s);
          }}
          className={cn(
            "rounded text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center",
            compact
              ? "p-1 h-6.5 w-6.5 bg-background border border-border/60 shadow-xs hover:bg-secondary"
              : "p-1.5 hover:bg-secondary/60",
          )}
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
      </Tooltip>
      <EmojiPickerModal
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onEmojiSelect={handleAddReaction}
        anchorRef={triggerRef as React.RefObject<HTMLElement>}
        side={side === "top" ? "top" : "bottom"}
      />
    </>
  );
}

function formatRelativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  return `${diffDays} days ago`;
}
