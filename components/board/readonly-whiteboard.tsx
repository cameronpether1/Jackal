'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { Minus, Plus, Maximize2 } from 'lucide-react'
import { ReadonlyCard } from '@/components/board/readonly-card'
import type { PostWithRelations } from '@/lib/supabase/types'

interface ReadonlyWhiteboardProps {
  posts: PostWithRelations[]
}

export function ReadonlyWhiteboard({ posts }: ReadonlyWhiteboardProps) {
  const [zoom, setZoom] = useState(100)
  const canvasRef = useRef<HTMLDivElement>(null)

  const rootPosts = useMemo(() => posts.filter(p => !p.reply_to_post_id), [posts])

  const repliesByParentId = useMemo(() => {
    const m = new Map<string, PostWithRelations[]>()
    posts.forEach(p => {
      if (p.reply_to_post_id) {
        const arr = m.get(p.reply_to_post_id) ?? []
        arr.push(p)
        m.set(p.reply_to_post_id, arr)
      }
    })
    return m
  }, [posts])

  function fitAll() {
    const container = canvasRef.current
    if (!container || rootPosts.length === 0) return

    const padding = 80
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const post of rootPosts) {
      const el = document.getElementById(`post-${post.id}`)
      const w = el?.offsetWidth ?? 288
      const h = el?.offsetHeight ?? 200
      minX = Math.min(minX, post.pos_x)
      minY = Math.min(minY, post.pos_y)
      maxX = Math.max(maxX, post.pos_x + w)
      maxY = Math.max(maxY, post.pos_y + h)
    }

    const scaleW = container.clientWidth / (maxX - minX + padding * 2)
    const scaleH = container.clientHeight / (maxY - minY + padding * 2)
    const targetZoom = Math.round(Math.max(20, Math.min(scaleW, scaleH, 1.0) * 100))
    const scale = targetZoom / 100

    setZoom(targetZoom)
    container.scrollTo({
      left: Math.max(0, (minX - padding) * scale - (container.clientWidth - (maxX - minX) * scale) / 2),
      top: Math.max(0, (minY - padding) * scale),
      behavior: 'smooth',
    })
  }

  // Fit on first render
  useEffect(() => {
    const t = setTimeout(fitAll, 200)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function adjustZoom(delta: number) {
    setZoom(z => Math.max(20, Math.min(150, z + delta)))
  }

  return (
    <div ref={canvasRef} className="relative flex-1 overflow-auto bg-[var(--jk-bg)] dot-grid">
      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          minWidth: '200%',
          minHeight: '200%',
          transition: 'transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {rootPosts.map(post => (
          <ReadonlyCard
            key={post.id}
            post={post}
            replies={repliesByParentId.get(post.id) ?? []}
          />
        ))}
      </div>

      {/* Zoom controls */}
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
        <div className="w-px h-4 bg-[var(--jk-border)] mx-0.5" />
        <button
          onClick={fitAll}
          className="w-7 h-7 flex items-center justify-center rounded text-[var(--jk-text-muted)] hover:bg-[var(--jk-surface-offset)] transition-colors"
          title="Fit all"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
