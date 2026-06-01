'use client'

import { MousePointer2, Hand, Plus, Minus, Maximize2 } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface FloatingToolbarProps {
  onNewPost: () => void
  zoom: number
  onZoomChange: (z: number) => void
  onFitAll: () => void
}

type Tool = 'select' | 'pan'

export function FloatingToolbar({ onNewPost, zoom, onZoomChange, onFitAll }: FloatingToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select')

  function adjustZoom(delta: number) {
    onZoomChange(Math.max(50, Math.min(200, zoom + delta)))
  }

  return (
    <>
      {/* Floating center toolbar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-[var(--jk-surface)] rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-[var(--jk-border)] px-2 py-1.5">
        <button
          onClick={() => setActiveTool('select')}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
            activeTool === 'select'
              ? 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400'
              : 'text-[var(--jk-text-muted)] hover:bg-[var(--jk-surface-offset)]'
          )}
          title="Select (V)"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTool('pan')}
          className={cn(
            'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
            activeTool === 'pan'
              ? 'bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-400'
              : 'text-[var(--jk-text-muted)] hover:bg-[var(--jk-surface-offset)]'
          )}
          title="Pan (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[var(--jk-border)] mx-1" />

        <button
          onClick={onFitAll}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors text-[var(--jk-text-muted)] hover:bg-[var(--jk-surface-offset)]"
          title="Fit all posts"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[var(--jk-border)] mx-1" />

        <Button
          onClick={onNewPost}
          size="sm"
          className="bg-[var(--jk-accent)] hover:bg-sky-400 text-white rounded-lg h-8 px-3 text-xs font-medium gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          New Post
        </Button>
      </div>

      {/* Zoom controls - bottom right */}
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-1 bg-[var(--jk-surface)] rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--jk-border)] px-1 py-1">
        <button
          onClick={() => adjustZoom(-10)}
          className="w-7 h-7 flex items-center justify-center rounded text-[var(--jk-text-muted)] hover:bg-[var(--jk-surface-offset)] transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-[var(--jk-text-muted)] w-10 text-center font-mono">{zoom}%</span>
        <button
          onClick={() => adjustZoom(10)}
          className="w-7 h-7 flex items-center justify-center rounded text-[var(--jk-text-muted)] hover:bg-[var(--jk-surface-offset)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )
}
