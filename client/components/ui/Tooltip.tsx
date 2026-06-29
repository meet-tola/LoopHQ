'use client'

import { ReactNode, useState } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

export function Tooltip({
  content,
  children,
  side = 'right',
  delay = 500,
}: TooltipProps) {
  const [show, setShow] = useState(false)
  const [timeout, setTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    const t = setTimeout(() => setShow(true), delay)
    setTimeout(t)
  }

  const handleMouseLeave = () => {
    if (timeout) clearTimeout(timeout)
    setShow(false)
  }

  const getPositionClasses = () => {
    switch (side) {
      case 'top':
        return 'bottom-full mb-2 left-1/2 transform -translate-x-1/2'
      case 'right':
        return 'left-full ml-2 top-1/2 transform -translate-y-1/2'
      case 'bottom':
        return 'top-full mt-2 left-1/2 transform -translate-x-1/2'
      case 'left':
        return 'right-full mr-2 top-1/2 transform -translate-y-1/2'
    }
  }

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {show && (
        <div
          className={`absolute ${getPositionClasses()} z-50 px-3 py-2 text-xs text-white bg-foreground rounded-md shadow-lg whitespace-nowrap pointer-events-none`}
        >
          {content}
          {/* Arrow */}
          <div
            className={`absolute w-2 h-2 bg-foreground transform rotate-45 ${
              side === 'right' ? '-left-1 top-1/2 -translate-y-1/2' : ''
            } ${side === 'left' ? '-right-1 top-1/2 -translate-y-1/2' : ''} ${
              side === 'top' ? '-bottom-1 left-1/2 -translate-x-1/2' : ''
            } ${side === 'bottom' ? '-top-1 left-1/2 -translate-x-1/2' : ''}`}
          />
        </div>
      )}
    </div>
  )
}
