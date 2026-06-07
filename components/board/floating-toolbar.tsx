'use client'

import { MousePointer2, Hand, Plus, Minus, Maximize2, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, MotionConfig } from 'motion/react'
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

// Spring configs
const TRAY_SPRING = { type: 'spring' as const, stiffness: 340, damping: 28 }
// Under-damped spring gives a single subtle overshoot — the "bounce" that doesn't feel tacky
const ITEM_SPRING = { type: 'spring' as const, stiffness: 440, damping: 18 }
const BTN_SPRING  = { type: 'spring' as const, stiffness: 500, damping: 24 }
const ICON_SPRING = { type: 'spring' as const, stiffness: 380, damping: 22 }

export function FloatingToolbar({ onNewPost, onAddSticker, zoom, onZoomChange, onFitAll }: FloatingToolbarProps) {
  const [activeTool, setActiveTool] = useState<Tool>('select')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [stickerSrcs, setStickerSrcs] = useState<string[]>([])
  const [stickerLoading, setStickerLoading] = useState(false)
  const islandRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!pickerOpen || stickerSrcs.length > 0) return
    setStickerLoading(true)
    fetch('/api/stickers')
      .then(r => r.json())
      .then(setStickerSrcs)
      .catch(() => {})
      .finally(() => setStickerLoading(false))
  }, [pickerOpen, stickerSrcs.length])

  useEffect(() => {
    if (!pickerOpen) return
    function onDown(e: MouseEvent) {
      if (islandRef.current && !islandRef.current.contains(e.target as Node)) {
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
    // reducedMotion="user" makes Motion respect prefers-reduced-motion automatically
    <MotionConfig reducedMotion="user">
      <>
        {/* Floating island — always dark regardless of theme */}
        <div
          ref={islandRef}
          className="fixed left-1/2 -translate-x-1/2 z-40"
          style={{ bottom: SAFE_BOTTOM }}
        >
          <div className="flex flex-col bg-[#1c1b19] rounded-[22px] shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.07)] overflow-hidden">

            {/* Sticker tray — springs open/closed, items bounce in with stagger */}
            <AnimatePresence>
              {pickerOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={TRAY_SPRING}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="px-3 pt-3 pb-2.5">
                    <div className="flex gap-2 flex-wrap" style={{ maxWidth: 'min(78vw, 280px)' }}>
                      {stickerLoading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <div
                              key={i}
                              className="w-14 h-14 rounded-xl bg-white/[0.06] animate-pulse shrink-0"
                            />
                          ))
                        : stickerSrcs.length === 0
                        ? <p className="text-[11px] text-white/25 py-3 px-1">No stickers yet</p>
                        : stickerSrcs.map((src, i) => (
                            <motion.button
                              key={src}
                              initial={{ opacity: 0, scale: 0.6, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              transition={{ ...ITEM_SPRING, delay: i * 0.045 }}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.88 }}
                              onClick={() => pickSticker(src)}
                              title={src.split('/').pop()}
                              className="w-14 h-14 shrink-0 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] flex items-center justify-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                            >
                              <img
                                src={src}
                                alt=""
                                className="w-10 h-10 object-contain"
                                draggable={false}
                              />
                            </motion.button>
                          ))
                      }
                    </div>
                    <div className="mt-2.5 -mx-3 h-px bg-white/[0.06]" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Main toolbar row */}
            <div className="flex items-center gap-0.5 px-2 py-2">
              {/* Tool toggles — desktop only */}
              <motion.button
                onClick={() => setActiveTool('select')}
                whileTap={{ scale: 0.88 }}
                transition={BTN_SPRING}
                className={cn(
                  'hidden sm:flex items-center justify-center w-9 h-9 rounded-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                  activeTool === 'select'
                    ? 'bg-white/[0.15] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                )}
                title="Select (V)"
              >
                <MousePointer2 className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={() => setActiveTool('pan')}
                whileTap={{ scale: 0.88 }}
                transition={BTN_SPRING}
                className={cn(
                  'hidden sm:flex items-center justify-center w-9 h-9 rounded-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                  activeTool === 'pan'
                    ? 'bg-white/[0.15] text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                )}
                title="Pan (H)"
              >
                <Hand className="w-4 h-4" />
              </motion.button>

              <div className="hidden sm:block w-px h-4 bg-white/[0.1] mx-1" />

              <motion.button
                onClick={onFitAll}
                whileTap={{ scale: 0.88 }}
                transition={BTN_SPRING}
                className="flex items-center justify-center w-9 h-9 rounded-[12px] transition-colors duration-150 text-white/40 hover:text-white/70 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                title="Fit all posts"
              >
                <Maximize2 className="w-4 h-4" />
              </motion.button>

              <div className="w-px h-4 bg-white/[0.1] mx-1" />

              {/* Sticker toggle — icon rotates + scales to signal open state */}
              <motion.button
                onClick={() => setPickerOpen(v => !v)}
                whileTap={{ scale: 0.76 }}
                transition={BTN_SPRING}
                className={cn(
                  'flex items-center justify-center w-9 h-9 rounded-[12px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30',
                  pickerOpen
                    ? 'bg-[#0ea5e9]/20 text-[#38bdf8]'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/[0.08]'
                )}
                title="Add sticker"
              >
                <motion.div
                  animate={{
                    rotate: pickerOpen ? 22 : 0,
                    scale: pickerOpen ? 1.15 : 1,
                  }}
                  transition={ICON_SPRING}
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </motion.button>

              <div className="w-1.5" />

              {/* New Post CTA */}
              <motion.button
                onClick={onNewPost}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.93 }}
                transition={BTN_SPRING}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-[12px] bg-[#0ea5e9] hover:bg-[#38bdf8] text-white text-xs font-medium shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <Plus className="w-3.5 h-3.5" />
                New Post
              </motion.button>
            </div>
          </div>
        </div>

        {/* Zoom strip — desktop only */}
        <div
          className="hidden sm:flex fixed right-6 z-40 items-center bg-[#1c1b19] rounded-[14px] shadow-[0_4px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] px-1.5 py-1.5 gap-0.5"
          style={{ bottom: SAFE_BOTTOM }}
        >
          <motion.button
            onClick={() => adjustZoom(-10)}
            whileTap={{ scale: 0.82 }}
            transition={BTN_SPRING}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            title="Zoom out"
          >
            <Minus className="w-3.5 h-3.5" />
          </motion.button>
          <span className="text-[11px] text-white/40 w-10 text-center font-mono tabular-nums select-none">
            {zoom}%
          </span>
          <motion.button
            onClick={() => adjustZoom(10)}
            whileTap={{ scale: 0.82 }}
            transition={BTN_SPRING}
            className="w-8 h-8 flex items-center justify-center rounded-[10px] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            title="Zoom in"
          >
            <Plus className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </>
    </MotionConfig>
  )
}
