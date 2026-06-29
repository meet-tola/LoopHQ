'use client'

import { useUI } from '@/providers/UIProvider'
import { Home, MessageSquare, Zap, Archive, MessageCircle, Bot, Menu, Settings } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

export function CompactSidebar() {
  const { toggleMobileMenu, setSelectedChannelId, toggleSettings } = useUI()

  const handleNavClick = (action: () => void) => {
    action()
    // Close mobile menu on mobile
    if (window.innerWidth < 1024) {
      // Will be handled by mobile menu logic
    }
  }

  const navItems = [
    {
      icon: Home,
      label: 'Home',
      onClick: () => setSelectedChannelId(null),
    },
    {
      icon: MessageSquare,
      label: 'Channels',
      onClick: () => setSelectedChannelId('channel-1'),
    },
    {
      icon: MessageCircle,
      label: 'DMs',
      onClick: () => {},
    },
    {
      icon: Zap,
      label: 'Activity',
      onClick: () => {},
    },
    {
      icon: Archive,
      label: 'Archive',
      onClick: () => {},
    },
    {
      icon: Bot,
      label: 'AI Agent',
      onClick: () => {},
    },
  ]

  return (
    <>
      {/* Compact Sidebar - Hidden on mobile, visible on tablet and up */}
      <div className="hidden sm:flex w-16 md:w-16 lg:w-16 flex-col items-center justify-between bg-card border-r border-border/40 py-4 px-2">
        {/* Top section */}
        <div className="flex flex-col items-center gap-4">
          {/* Workspace icon */}
          <Link
            href="/workspace-selector"
            className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity font-bold"
          >
            W
          </Link>

          {/* Navigation items */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Tooltip key={item.label} content={item.label} side="right">
                <button
                  onClick={() => handleNavClick(item.onClick)}
                  className="w-10 h-10 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <item.icon className="w-5 h-5" />
                </button>
              </Tooltip>
            ))}
          </nav>
        </div>

        {/* Bottom section */}
        <div className="flex flex-col gap-2">
          <Tooltip content="Settings" side="right">
            <button
              onClick={() => toggleSettings()}
              className="w-10 h-10 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </button>
          </Tooltip>
          <Tooltip content="Menu" side="right">
            <button
              onClick={() => toggleMobileMenu()}
              className="w-10 h-10 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Mobile Menu Button - Visible only on mobile */}
      <div className="sm:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => toggleMobileMenu()}
          className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </>
  )
}
