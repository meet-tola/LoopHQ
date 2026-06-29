'use client'

import { useUI } from '@/providers/UIProvider'
import { useThreadMessages } from '@/hooks/queries'
import { X, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface RightSidebarProps {
  workspaceId: string
}

export function RightSidebar({ workspaceId }: RightSidebarProps) {
  const {
    rightSidebarOpen,
    setRightSidebarOpen,
    selectedThreadId,
    setSelectedThreadId,
    selectedUserId,
  } = useUI()

  const [threadReplyInput, setThreadReplyInput] = useState('')

  const { data: threadMessages = [] } = useThreadMessages(selectedThreadId || '')

  const isVisible = rightSidebarOpen || selectedThreadId || selectedUserId

  if (!isVisible) return null

  return (
    <>
      {/* Overlay for mobile */}
      {isVisible && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => {
            setRightSidebarOpen(false)
            setSelectedThreadId(null)
          }}
        />
      )}

      {/* Right Sidebar */}
      <div
        className={cn(
          'fixed lg:static right-0 top-0 h-screen w-full sm:w-80 bg-card border-l border-border/40 z-40 overflow-hidden flex flex-col',
          !isVisible && '-translate-x-full lg:translate-x-0',
          'transition-all duration-200'
        )}
      >
        {/* Header */}
        <div className="border-b border-border/40 p-4 flex items-center justify-between gap-2 flex-shrink-0">
          <h3 className="font-semibold">
            {selectedThreadId ? 'Thread' : 'Profile'}
          </h3>
          <button
            onClick={() => {
              setRightSidebarOpen(false)
              setSelectedThreadId(null)
            }}
            className="lg:hidden text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {selectedThreadId ? (
          <ThreadPanel
            messages={threadMessages}
            replyInput={threadReplyInput}
            setReplyInput={setThreadReplyInput}
          />
        ) : selectedUserId ? (
          <UserProfilePanel userId={selectedUserId} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">Select a thread or user</p>
              <p className="text-xs mt-1">to view details</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function ThreadPanel({
  messages,
  replyInput,
  setReplyInput,
}: {
  messages: any[]
  replyInput: string
  setReplyInput: (value: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">No messages in this thread</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-semibold text-sm">{msg.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm text-foreground">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Reply Input */}
      <div className="border-t border-border/40 p-4 flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Reply to thread..."
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                // Handle reply
                setReplyInput('')
              }
            }}
            className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            size="sm"
            disabled={!replyInput.trim()}
            onClick={() => {
              // Handle reply
              setReplyInput('')
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function UserProfilePanel({ userId }: { userId: string }) {
  // Mock user data
  const mockUser = {
    id: userId,
    name: 'Sarah Chen',
    email: 'sarah@example.com',
    status: 'online',
    statusMessage: 'In a meeting',
    joinedAt: new Date('2024-01-15'),
  }

  return (
    <div className="overflow-y-auto p-4 space-y-6">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-semibold">
          {mockUser.name[0]}
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">{mockUser.name}</h3>
          <p className="text-sm text-muted-foreground">{mockUser.email}</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-xs text-muted-foreground capitalize">{mockUser.status}</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3 border-t border-border/40 pt-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Status</p>
          <p className="text-sm">{mockUser.statusMessage}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">Joined</p>
          <p className="text-sm">
            {mockUser.joinedAt.toLocaleDateString([], {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-border/40">
        <Button className="w-full" variant="outline">
          Send Message
        </Button>
        <Button className="w-full" variant="outline">
          Call
        </Button>
      </div>
    </div>
  )
}
