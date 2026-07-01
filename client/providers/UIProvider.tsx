'use client'

import React, { createContext, useContext, useState } from 'react'

interface UIContextType {
  // Sidebar states
  expandedSidebarOpen: boolean
  setExpandedSidebarOpen: (open: boolean) => void
  toggleExpandedSidebar: () => void
  
  // Right sidebar states
  rightSidebarOpen: boolean
  setRightSidebarOpen: (open: boolean) => void
  toggleRightSidebar: () => void
  
  // Mobile menu states
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
  toggleMobileMenu: () => void
  
  // Selected entities
  selectedChannelId: string | null
  setSelectedChannelId: (id: string | null) => void
  
  selectedUserId: string | null
  setSelectedUserId: (id: string | null) => void
  
  selectedThreadId: string | null
  setSelectedThreadId: (id: string | null) => void
  
  // Active tabs
  activeTab: 'messages' | 'suggestions' | 'pins' | 'files' | 'bookmarks'
  setActiveTab: (tab: 'messages' | 'suggestions' | 'pins' | 'files' | 'bookmarks') => void
  
  // Search state
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  // Modals
  showEmojiPicker: boolean
  setShowEmojiPicker: (show: boolean) => void
  
  showUserProfile: boolean
  setShowUserProfile: (show: boolean) => void
  
  // Settings
  showSettings: boolean
  setShowSettings: (show: boolean) => void
  toggleSettings: () => void
  
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [expandedSidebarOpen, setExpandedSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'messages' | 'suggestions' | 'pins' | 'files' | 'bookmarks'>('messages')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const toggleExpandedSidebar = () => setExpandedSidebarOpen(!expandedSidebarOpen)
  const toggleRightSidebar = () => setRightSidebarOpen(!rightSidebarOpen)
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen)
  const toggleSettings = () => setShowSettings(!showSettings)

  const value: UIContextType = {
    expandedSidebarOpen,
    setExpandedSidebarOpen,
    toggleExpandedSidebar,
    rightSidebarOpen,
    setRightSidebarOpen,
    toggleRightSidebar,
    mobileMenuOpen,
    setMobileMenuOpen,
    toggleMobileMenu,
    selectedChannelId,
    setSelectedChannelId,
    selectedUserId,
    setSelectedUserId,
    selectedThreadId,
    setSelectedThreadId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    showEmojiPicker,
    setShowEmojiPicker,
    showUserProfile,
    setShowUserProfile,
    showSettings,
    setShowSettings,
    toggleSettings,
  }

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const context = useContext(UIContext)
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider')
  }
  return context
}
