'use client'

import { MousePointer2, Hand, Plus, Minus, Maximize2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface FloatingToolbarProps {
  onNewPost: () => void
  onAddSticker: (imageSrc: string) => void
  zoom: number
  onZoomChange: (z: number) => void
  onFitAll: () => void
}

type Tool = 'select' | 'pan'

const SAFE_BOTTOM = 'max(1.5rem, calc(env(safe-area-inset-bottom) + 0.5rem))'

export function FloatingToolbar({ onNewPost, onAddSticker, zoom, onZoomChange, onFitAll }: FloatingToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [stickerSrcs, setStickerSrcs] = useState<string[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)

  // Fetch sticker list from /public/stickers/ when picker is first opened
  useEffect(() => {
    if (!pickerOpen || stickerSrcs.length > 0) return
    fetch('/api/stickers').then(r => r.json()).then(setStickerSrcs).catch(() => {})
  }, [pickerOpen, stickerSrcs.length])

  // Close picker when clicking outside
  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [pickerOpen])

  function adjustZoom(delta: number) {
    onZoomChange(Math.max(50, Math.min(200, zoom + delta)))
  }

  function pickSticker(src: string) {
    setPickerOpen(false)
    onAddSticker(src)
  }

  return (
    <>
      {/* Floating center toolbar */}
      <div
        className="fixed left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 bg-jk-surface rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.12)] border border-jk-border px-2 py-1.5"
        style={{ bottom: SAFE_BOTTOM }}
      >
        {/* Tool toggle — desktop only */}
        <button
          onClick={() => setActiveTool('select')}
          className={cn(
            'hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
            activeTool === 'select'
              ? 'bg-[#0ea5e9]/10 text-jk-accent'
              : 'text-jk-text-muted hover:bg-jk-surface-offset'
          )}
          title="Select (V)"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setActiveTool('pan')}
          className={cn(
            'hidden sm:flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
            activeTool === 'pan'
              ? 'bg-[#0ea5e9]/10 text-jk-accent'
              : 'text-jk-text-muted hover:bg-jk-surface-offset'
          )}
          title="Pan (H)"
        >
          <Hand className="w-4 h-4" />
        </button>

        <div className="hidden sm:block w-px h-5 bg-jk-border mx-1" />

        <button
          onClick={onFitAll}
          className="flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-colors text-jk-text-muted hover:bg-jk-surface-offset"
          title="Fit all posts"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-jk-border mx-1" />

        {/* Sticker picker button + popover */}
        <div className="relative" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen(v => !v)}
            className={cn(
              'flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8 rounded-lg transition-colors',
              pickerOpen
                ? 'bg-[#0ea5e9]/10 text-jk-accent'
                : 'text-jk-text-muted hover:bg-jk-surface-offset'
            )}
            title="Add sticker"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {pickerOpen && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-jk-surface border border-jk-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.14)] p-2 flex gap-2 max-w-[min(90vw,360px)] flex-wrap">
              {stickerSrcs.length === 0 ? (
                <p className="text-xs text-jk-text-faint px-2 py-1">No stickers yet — add images to /public/stickers/</p>
              ) : (
                stickerSrcs.map(src => (
                  <button
                    key={src}
                    onClick={() => pickSticker(src)}
                    title={src.split('/').pop()}
                    className="w-14 h-14 rounded-xl overflow-hidden bg-jk-surface-offset hover:scale-110 transition-transform duration-150 shrink-0 flex items-center justify-center"
                  >
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-contain"
                      draggable={false}
                    />
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <Button
          onClick={onNewPost}
          size="sm"
          className="bg-jk-accent hover:bg-sky-400 text-white rounded-lg h-10 sm:h-8 px-3 text-xs font-medium gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          New Post
        </Button>
      </div>

      {/* Zoom controls — desktop only */}
      <div
        className="hidden sm:flex fixed right-6 z-40 items-center gap-1 bg-jk-surface rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-jk-border px-1 py-1"
        style={{ bottom: SAFE_BOTTOM }}
      >
        <button
          onClick={() => adjustZoom(-10)}
          className="w-7 h-7 flex items-center justify-center rounded text-jk-text-muted hover:bg-jk-surface-offset transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-xs text-jk-text-muted w-10 text-center font-mono">{zoom}%</span>
        <button
          onClick={() => adjustZoom(10)}
          className="w-7 h-7 flex items-center justify-center rounded text-jk-text-muted hover:bg-jk-surface-offset transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  )
}
