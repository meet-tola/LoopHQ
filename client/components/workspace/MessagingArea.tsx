"use client";

import React, { useState } from "react";
import { useUI } from "@/providers/UIProvider";
import { useMessages, useSendMessage } from "@/hooks/queries/useMessages";
import { useChannels } from "@/hooks/queries";
import { useSocketMessages } from "@/hooks/useSocketMessages";
import { Button } from "@/components/ui/button";
import {
  Send,
  Smile,
  Paperclip,
  Bell,
  Search,
  MoreVertical,
  Hash,
  Lock,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Message } from "@/types";

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
  const { data: messages = [], isLoading } = useMessages(channelId);
  const { mutate: sendMessage } = useSendMessage();

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
    <div className="flex-1 flex flex-col h-screen bg-background">
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
          <Button variant="ghost" size="icon" className="rounded-full">
            {" "}
            <Bell className="w-5 h-5" />{" "}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            {" "}
            <Search className="w-5 h-5" />{" "}
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            {" "}
            <MoreVertical className="w-5 h-5" />{" "}
          </Button>
        </div>
      </div>

      {/* Messages Feed Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
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
                    {" "}
                    {date}{" "}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="space-y-4">
                  <div className="space-y-4">
                    {messageList.map((message) => {
                      const totalReplies =
                        message.parentOf?._count?.replies || 0;

                      return (
                        <MessageItem
                          key={message.id}
                          message={message}
                          replyCount={totalReplies}
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Action Input footer */}
      <div className="border-t border-border/40 bg-card p-4 sm:p-6">
        <div className="flex gap-3 items-end">
          <button className="text-muted-foreground hover:text-foreground p-2 transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
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
  isSelected,
  onSelect,
  onReplyClick,
}: {
  message: Message;
  replyCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onReplyClick: () => void;
}) {
  const { setSelectedUserId, setRightSidebarOpen } = useUI();
  const messageTime = message.createdAt
    ? new Date(message.createdAt)
    : new Date();
  return (
    <div
      onClick={onSelect}
      className={cn(
        "p-4 rounded-lg transition-all cursor-pointer group border border-transparent flex flex-col gap-1",
        isSelected
          ? "bg-primary/10 border-primary/20 shadow-xs"
          : "hover:bg-secondary/20 hover:border-border/30",
      )}
    >
      {" "}
      <div className="flex gap-3 items-start">
        {" "}
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (message.user?.id) {
              setSelectedUserId(message.user.id);
              setRightSidebarOpen(true);
            }
          }}
          className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 text-xs font-bold text-white shadow-xs hover:scale-105 transition-transform"
        >
          {" "}
          {message.user?.name ? message.user.name[0] : "U"}{" "}
        </div>{" "}
        <div className="flex-1 min-w-0">
          {" "}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {" "}
            <span className="font-bold text-sm text-foreground">
              {" "}
              {message.user?.name || "Unknown User"}{" "}
            </span>{" "}
            <span className="text-[10px] text-muted-foreground">
              {" "}
              {messageTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
            </span>{" "}
            <div className="opacity-0 group-hover:opacity-100 ml-auto flex items-center gap-1 transition-opacity">
              {" "}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReplyClick();
                }}
                className="p-1 rounded bg-background border border-border/60 shadow-xs text-muted-foreground hover:text-foreground"
                title="Reply in Thread"
              >
                {" "}
                <MessageSquare className="w-3.5 h-3.5" />{" "}
              </button>{" "}
              <ReactionPickerMenu messageId={message.id} />{" "}
            </div>{" "}
          </div>{" "}
          <p className="text-sm text-foreground wrap-break-word leading-relaxed">
            {" "}
            {message.content}{" "}
          </p>{" "}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {" "}
              {Object.entries(
                message.reactions.reduce((acc: Record<string, number>, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {}),
              ).map(([emoji, count]) => (
                <span
                  key={emoji}
                  className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border/40 font-medium"
                >
                  {" "}
                  {emoji} {count}{" "}
                </span>
              ))}{" "}
            </div>
          )}{" "}
          {replyCount > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReplyClick();
              }}
              className="mt-2 flex items-center gap-1.5 text-xs text-primary font-medium hover:underline bg-primary/10 px-2 py-0.5 rounded-md"
            >
              {" "}
              <MessageSquare className="w-3 h-3" />{" "}
              <span>
                {" "}
                {replyCount} {replyCount === 1 ? "reply" : "replies"}{" "}
              </span>{" "}
            </button>
          )}{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
function ReactionPickerMenu({ messageId }: { messageId: string }) {
  const [showPicker, setShowPicker] = useState(false);
  const popularEmojis = ["👍", "❤️", "🔥", "😂", "😮", "🙏"];
  const handleAddReaction = (emoji: string) => {
    setShowPicker(false);
  };
  return (
    <div className="relative">
      {" "}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowPicker(!showPicker);
        }}
        className="p-1 rounded bg-background border border-border/60 shadow-xs text-muted-foreground hover:text-foreground text-sm flex items-center justify-center h-6.5 w-6.5"
      >
        {" "}
        <Smile className="w-3.5 h-3.5" />{" "}
      </button>{" "}
      {showPicker && (
        <div className="absolute right-0 bottom-full mb-1 bg-popover border border-border/80 shadow-md rounded-md p-1.5 flex gap-1 z-50 animate-in fade-in slide-in-from-bottom-1 duration-100">
          {" "}
          {popularEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={(e) => {
                e.stopPropagation();
                handleAddReaction(emoji);
              }}
              className="hover:bg-muted p-1 rounded text-sm transition-colors"
            >
              {" "}
              {emoji}{" "}
            </button>
          ))}{" "}
        </div>
      )}{" "}
    </div>
  );
}
