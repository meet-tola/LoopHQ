'use client'

import { useUI } from '@/providers/UIProvider'
import { X, Moon, Sun, Bell, Lock, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SettingsModal() {
  const { showSettings, setShowSettings, theme, setTheme } = useUI()

  if (!showSettings) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setShowSettings(false)}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card rounded-xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/40">
          <h2 className="text-xl font-semibold">Settings & Preferences</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="p-1 hover:bg-secondary rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              Appearance
            </h3>
            <div className="space-y-2">
              <button
                onClick={() => setTheme('light')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/40 hover:border-border'
                }`}
              >
                <Sun className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">Light Theme</div>
                  <div className="text-xs text-muted-foreground">Clean, bright interface</div>
                </div>
                {theme === 'light' && <div className="w-3 h-3 rounded-full bg-primary" />}
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/40 hover:border-border'
                }`}
              >
                <Moon className="w-4 h-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">Dark Theme</div>
                  <div className="text-xs text-muted-foreground">Easy on the eyes</div>
                </div>
                {theme === 'dark' && <div className="w-3 h-3 rounded-full bg-primary" />}
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm">Desktop notifications</span>
              </label>
              <label className="flex items-center gap-3 p-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm">Email notifications</span>
              </label>
              <label className="flex items-center gap-3 p-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded" />
                <span className="text-sm">Mute all notifications</span>
              </label>
            </div>
          </div>

          {/* Privacy Section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Privacy
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm">Show online status</span>
              </label>
              <label className="flex items-center gap-3 p-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                <span className="text-sm">Allow message requests</span>
              </label>
            </div>
          </div>

          {/* Account Section */}
          <div className="pt-4 border-t border-border/40">
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 justify-center"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
