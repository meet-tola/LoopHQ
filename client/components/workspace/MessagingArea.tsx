'use client'

import React, { useState } from 'react'
import { useUI } from '@/providers/UIProvider'
import { useMessages, useSendMessage } from '@/hooks/queries/useMessages'
import { useChannels } from '@/hooks/queries'
import { useSocketMessages } from '@/hooks/useSocketMessages'
import { Button } from '@/components/ui/button'
import { Send, Smile, Paperclip, Bell, Search, MoreVertical, Hash, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Message } from '@/types'

interface MessagingAreaProps {
  workspaceId: string
  channelId?: string
}

export function MessagingArea({ workspaceId, channelId = 'channel-1' }: MessagingAreaProps) {
  const { activeTab, setActiveTab, setSelectedThreadId } = useUI()
  const [messageInput, setMessageInput] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null)

  const { data: channels = [] } = useChannels(workspaceId)
  const currentChannel = channels.find((c) => c.id === channelId)

  const { data: messages = [], isLoading } = useMessages(channelId)
  const { mutate: sendMessage } = useSendMessage()

  useSocketMessages(channelId)

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    
    // Triggers instantly with our new optimistic configurations
    sendMessage({
      content: messageInput,
      channelId,
    });
    
    setMessageInput('')
  }

  // Groups strings by tracking the backend `createdAt` key definition
  const groupMessagesByDate = (msgArray: Message[]) => {
    return msgArray.reduce((groups: Record<string, Message[]>, message) => {
      const dateTarget = message.createdAt ? new Date(message.createdAt) : new Date();
      const dateString = dateTarget.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      
      if (!groups[dateString]) groups[dateString] = [];
      groups[dateString].push(message);
      return groups;
    }, {});
  };

  const groupedMessages = groupMessagesByDate(messages);

  const tabs = [
    { id: 'messages', label: 'Messages', icon: '💬' },
    { id: 'suggestions', label: 'Suggestions', icon: '✨' },
    { id: 'pins', label: 'Pins', icon: '📌' },
    { id: 'files', label: 'Files', icon: '📎' },
    { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  ] as const

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 p-4 sm:p-6 flex items-center justify-between gap-4 bg-linear-to-br from-card to-card/50">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {currentChannel?.type === 'PRIVATE' ? (
              <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
            ) : (
              <Hash className="w-5 h-5 text-muted-foreground shrink-0" />
            )}
            <h2 className="text-xl sm:text-2xl font-bold truncate">
              #{currentChannel ? currentChannel.name : channelId.replace('channel-', 'announcements')}
            </h2>
            <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full">
              {messages.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            {currentChannel?.description || "Team announcements and discussions"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="icon" className="rounded-full"> <Bell className="w-5 h-5" /> </Button>
          <Button variant="ghost" size="icon" className="rounded-full"> <Search className="w-5 h-5" /> </Button>
          <Button variant="ghost" size="icon" className="rounded-full"> <MoreVertical className="w-5 h-5" /> </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/30 flex overflow-x-auto px-4 sm:px-6 gap-0 bg-card/30">
        {tabs.map((tab) => (
          <button 
            key={tab.id} 
            onClick={() => setActiveTab(tab.id)} 
            className={cn(
              'px-4 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap flex items-center gap-2',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground text-center">
              <p className="text-lg font-semibold mb-2">No messages yet</p>
              <p className="text-sm">Start a conversation</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedMessages).map(([date, messageList]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-border/40" />
                  <span className="text-sm text-muted-foreground px-2 py-1 bg-secondary/30 rounded">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-border/40" />
                </div>
                <div className="space-y-4">
                  {messageList.map((message) => (
                    <MessageItem 
                      key={message.id} 
                      message={message} 
                      isSelected={selectedMessageId === message.id} 
                      onSelect={() => setSelectedMessageId(message.id)} 
                      onReplyClick={() => setSelectedThreadId(message.id)} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border/40 bg-card p-4 sm:p-6">
        <div className="flex gap-3 items-end">
          <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-end gap-2 bg-secondary/30 border border-border/40 rounded-lg px-3 py-2">
            <input 
              type="text" 
              placeholder={`Message #${currentChannel ? currentChannel.name : channelId.replace('channel-', 'announcements')}`}
              value={messageInput} 
              onChange={(e) => setMessageInput(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSendMessage()
                }
              }} 
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-sm" 
            />
            <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <Smile className="w-4 h-4" />
            </button>
          </div>
          <Button size="sm" onClick={handleSendMessage} disabled={!messageInput.trim()} className="shrink-0" >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function MessageItem({ message, isSelected, onSelect, onReplyClick }: { message: Message, isSelected: boolean, onSelect: () => void, onReplyClick: () => void }) {
  const messageTime = message.createdAt ? new Date(message.createdAt) : new Date();

  return (
    <div onClick={onSelect} className={cn(
      'p-4 rounded-lg transition-all cursor-pointer group border border-transparent',
      isSelected ? 'bg-primary/10 border-primary/30 shadow-sm' : 'hover:bg-secondary/30 hover:border-border/50'
    )}>
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 text-sm font-bold text-white shadow-sm">
          {message.user?.name ? message.user.name[0] : 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-bold text-sm">{message.user?.name || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground ml-auto sm:ml-0">
              {messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-foreground wrap-break-word leading-relaxed mb-2">
            {message.content}
          </p>
        </div>
      </div>
    </div>
  )
}