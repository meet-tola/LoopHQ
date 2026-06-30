'use client'

import { useState } from 'react'
import { useUI } from '@/providers/UIProvider'
import { useChannels, useDirectMessages } from '@/hooks/queries'
import { useCreateChannel } from '@/hooks/queries/useChannels'
import { Plus, ChevronDown, ChevronRight, X, Hash, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { ChannelType } from '@/types'
import Link from 'next/link'

interface ExpandedSidebarProps {
  workspaceId: string
  workspaceName: string
}

export function ExpandedSidebar({ workspaceId, workspaceName }: ExpandedSidebarProps) {
  const {
    expandedSidebarOpen,
    setExpandedSidebarOpen,
    selectedChannelId,
    setSelectedChannelId,
    mobileMenuOpen,
    setMobileMenuOpen,
  } = useUI()

  // Accordion toggle states
  const [channelsExpanded, setChannelsExpanded] = useState(true)
  const [dmsExpanded, setDmsExpanded] = useState(true)

  // Modal dialog execution states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [newChannelType, setNewChannelType] = useState<ChannelType>('PUBLIC')

  // API Data Hook integration
  const { data: channels = [], isLoading: channelsLoading } = useChannels(workspaceId)
  const { data: dms = [] } = useDirectMessages(workspaceId)
  
  // React Query Mutation
  const createChannelMutation = useCreateChannel(workspaceId)

  const handleChannelClick = (channelId: string) => {
    setSelectedChannelId(channelId)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setExpandedSidebarOpen(false)
      setMobileMenuOpen(false)
    }
  }

  const handleCreateChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChannelName.trim()) return

    createChannelMutation.mutate(
      {
        name: newChannelName.toLowerCase().replace(/\s+/g, '-'),
        type: newChannelType,
      },
      {
        onSuccess: () => {
          setIsDialogOpen(false)
          setNewChannelName('')
          setNewChannelType('PUBLIC')
        },
      }
    )
  }

  const isVisible = expandedSidebarOpen || mobileMenuOpen

  return (
    <>
      {/* Overlay for mobile viewframes */}
      {isVisible && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => {
            setExpandedSidebarOpen(false)
            setMobileMenuOpen(false)
          }}
        />
      )}

      {/* Expanded Sidebar Container */}
      <div
        className={cn(
          'fixed lg:static left-0 top-0 h-screen w-72 bg-card border-r border-border/40 p-4 overflow-y-auto transition-all duration-200 z-40',
          !isVisible && 'lg:flex -translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col gap-4 h-full">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-border/40">
            <h2 className="font-bold text-lg truncate pr-2">{workspaceName}</h2>
            <button
              onClick={() => {
                setExpandedSidebarOpen(false)
                setMobileMenuOpen(false)
              }}
              className="lg:hidden text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar */}
          <input
            type="text"
            placeholder="Search..."
            className="px-3 py-2 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />

          {/* Main Navigation Stack */}
          <div className="flex-1 overflow-y-auto space-y-4">
            
            {/* Channels Segment */}
            <div>
              <div className="flex items-center justify-between mb-1 px-2 group">
                <button 
                  onClick={() => setChannelsExpanded(!channelsExpanded)}
                  className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {channelsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>Channels</span>
                </button>
                <button 
                  onClick={() => setIsDialogOpen(true)}
                  className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-secondary"
                  title="Create Channel"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {channelsExpanded && (
                <div className="space-y-1 mt-2">
                  {channelsLoading && <p className="text-xs text-muted-foreground px-3">Loading channels...</p>}
                  {!channelsLoading && channels.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 italic">No channels found</p>
                  )}
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => handleChannelClick(channel.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary',
                        selectedChannelId === channel.id && 'bg-primary text-primary-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {channel.type === 'PRIVATE' ? (
                          <Lock className="w-4 h-4 shrink-0 opacity-70" />
                        ) : (
                          <Hash className="w-4 h-4 shrink-0 opacity-70" />
                        )}
                        <span className="truncate">{channel.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Messages Segment */}
            <div>
              <div className="flex items-center justify-between mb-1 px-2">
                <button 
                  onClick={() => setDmsExpanded(!dmsExpanded)}
                  className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {dmsExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>Direct Messages</span>
                </button>
              </div>

              {dmsExpanded && (
                <div className="space-y-1 mt-2">
                  {dms.length === 0 && (
                    <p className="text-xs text-muted-foreground px-3 italic">No recent chats</p>
                  )}
                  {dms.map((dm) => {
                    const otherUser = dm.participants?.find((p: any) => p.id !== 'user-1')
                    return (
                      <button
                        key={dm.id}
                        className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-secondary flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                          <span className="truncate">{otherUser?.name || 'Unknown Member'}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Footer controls */}
          <div className="border-t border-border/40 pt-4 space-y-2">
            <Link href="/workspaces" passHref>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                Switch Workspaces
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Creation Modal Form Sheet */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>Create a Channel</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateChannelSubmit} className="space-y-6 pt-2">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Channel Name</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="channel-name"
                  placeholder="e.g. marketing-plan"
                  className="pl-9"
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  disabled={createChannelMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Visibility Settings</Label>
              <RadioGroup 
                value={newChannelType} 
                onValueChange={(value) => setNewChannelType(value as ChannelType)}
                className="flex flex-col gap-3"
                disabled={createChannelMutation.isPending}
              >
                <div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="PUBLIC" id="type-public" className="mt-1" />
                  <Label htmlFor="type-public" className="font-normal flex flex-col gap-1 cursor-pointer w-full">
                    <span className="font-semibold text-sm flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Public Channel</span>
                    <span className="text-xs text-muted-foreground">Anyone in the workspace can view and join this space.</span>
                  </Label>
                </div>

                <div className="flex items-start space-x-3 rounded-md border p-3 hover:bg-accent/50 cursor-pointer">
                  <RadioGroupItem value="PRIVATE" id="type-private" className="mt-1" />
                  <Label htmlFor="type-private" className="font-normal flex flex-col gap-1 cursor-pointer w-full">
                    <span className="font-semibold text-sm flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Private Channel</span>
                    <span className="text-xs text-muted-foreground">Only invited users can discover or review historical contents.</span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={createChannelMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createChannelMutation.isPending}>
                {createChannelMutation.isPending ? 'Building...' : 'Create Channel'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}