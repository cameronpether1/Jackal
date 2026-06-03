'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { PostCard } from '@/components/board/post-card'
import { InlineCardEditor } from '@/components/board/inline-card-editor'
import { FloatingToolbar } from '@/components/board/floating-toolbar'
import { EmptyState } from '@/components/board/empty-state'
import type { PostType, PostWithRelations, Profile } from '@/lib/supabase/types'

interface WhiteboardProps {
  boardId: string
  boardName?: string
  initialPosts: PostWithRelations[]
  currentUserId: string
  currentProfile: Profile | null
  onExportReady?: (fn: () => Promise<void>) => void
}

interface DraftCard {
  x: number
  y: number
  rotation: number
  replyTo?: { postId: string; authorName: string }
}

export function Whiteboard({ boardId, boardName, initialPosts, currentUserId, currentProfile, onExportReady }: WhiteboardProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts)
  const [draft, setDraft] = useState<DraftCard | null>(null)
  const [zoom, setZoom] = useState(100)
  const [isExporting, setIsExporting] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])
  const postsRef = useRef(posts)
  const boardNameRef = useRef(boardName)
  const zoomRef = useRef(zoom)
  const wheelZoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { postsRef.current = posts }, [posts])
  useEffect(() => { boardNameRef.current = boardName }, [boardName])
  useEffect(() => { zoomRef.current = zoom }, [zoom])

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

  function spawnDraft() {
    const el = canvasRef.current
    const scrollX = el?.scrollLeft ?? 0
    const scrollY = el?.scrollTop ?? 0
    const w = el?.clientWidth ?? 800
    const h = el?.clientHeight ?? 600
    const scale = zoom / 100
    const x = (scrollX + w / 2) / scale - 144 + (Math.random() - 0.5) * 80
    const y = (scrollY + h / 3) / scale + (Math.random() - 0.5) * 60
    setDraft({ x, y, rotation: (Math.random() * 4 - 2) })
  }

  // Keyboard shortcut N
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if ((e.key === 'n' || e.key === 'N') && !draft) {
        e.preventDefault()
        spawnDraft()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [draft, zoom])

  // Pinch-to-zoom (trackpad) and Cmd/Ctrl+scroll (mouse wheel)
  useEffect(() => {
    const container = canvasRef.current
    if (!container) return

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()

      const inner = innerRef.current
      if (!inner) return

      // Disable transition for immediate visual response during gesture
      inner.style.transition = 'none'

      const oldScale = zoomRef.current / 100
      // Normalise across deltaMode (0=px, 1=lines, 2=pages) and clamp to avoid huge per-tick jumps
      const rawDelta = -e.deltaY * (e.deltaMode === 1 ? 15 : e.deltaMode === 2 ? 300 : 1)
      const clampedDelta = Math.max(-50, Math.min(50, rawDelta))
      const newZoom = Math.max(20, Math.min(200, zoomRef.current * Math.exp(clampedDelta * 0.01)))
      const newScale = newZoom / 100

      // Keep the canvas point under the cursor fixed
      const rect = container.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const contentX = (container.scrollLeft + mouseX) / oldScale
      const contentY = (container.scrollTop + mouseY) / oldScale

      // Apply directly to DOM — no React re-render lag
      inner.style.transform = `scale(${newScale})`
      container.scrollLeft = Math.max(0, contentX * newScale - mouseX)
      container.scrollTop = Math.max(0, contentY * newScale - mouseY)

      zoomRef.current = newZoom

      // Debounce syncing to React state (updates toolbar readout)
      if (wheelZoomTimeout.current) clearTimeout(wheelZoomTimeout.current)
      wheelZoomTimeout.current = setTimeout(() => {
        setZoom(Math.round(zoomRef.current))
        if (innerRef.current) {
          innerRef.current.style.transition = 'transform 550ms cubic-bezier(0.4, 0, 0.2, 1)'
        }
      }, 200)
    }

    container.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', onWheel)
      if (wheelZoomTimeout.current) clearTimeout(wheelZoomTimeout.current)
    }
  }, [])

  // Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `board_id=eq.${boardId}` },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            setPosts(prev => prev.filter(p => p.id !== payload.old.id))
          } else if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('posts')
              .select('*, author:profiles(*), task_items(*), reactions(*)')
              .eq('id', payload.new.id)
              .single()
            if (data) {
              setPosts(prev =>
                prev.some(p => p.id === payload.new.id)
                  ? prev
                  : [...prev, data as PostWithRelations]
              )
            }
          } else if (payload.eventType === 'UPDATE') {
            setPosts(prev => prev.map(p => p.id === payload.new.id ? { ...p, ...payload.new } : p))
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_items' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setPosts(prev => prev.map(p => ({
            ...p,
            task_items: p.task_items?.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t),
          })))
        } else if (payload.eventType === 'INSERT') {
          setPosts(prev => prev.map(p => {
            if (p.id !== payload.new.post_id) return p
            if (p.task_items?.some(t => t.id === payload.new.id)) return p  // already added by insert response
            return { ...p, task_items: [...(p.task_items ?? []), payload.new as any] }
          }))
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.map(p => ({
            ...p,
            task_items: p.task_items?.filter(t => t.id !== payload.old.id),
          })))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [boardId, supabase])

  const handleReply = useCallback((post: PostWithRelations) => {
    setDraft({
      x: post.pos_x + 20,
      y: post.pos_y + 20,
      rotation: (Math.random() * 4 - 2),
      replyTo: { postId: post.id, authorName: post.author?.display_name ?? 'Unknown' },
    })
  }, [])

  const handleSaveDraft = useCallback(async (data: { type: PostType; title: string; content: string; imageFile?: File | null; mapLocation?: import('@/lib/supabase/types').MapLocation | null }) => {
    if (!draft) return
    setDraft(null)

    let imageUrl: string | null = null
    if (data.imageFile) {
      const ext = data.imageFile.name.split('.').pop() ?? 'jpg'
      const path = `${boardId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(path, data.imageFile)
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }
    }

    const optimisticId = `opt-${Date.now()}`
    const optimistic: PostWithRelations = {
      id: optimisticId,
      board_id: boardId,
      author_id: currentUserId,
      author: currentProfile as any,
      type: data.type,
      title: data.title || null,
      content: data.type === 'tasks' ? null : data.content || null,
      image_url: imageUrl,
      map_location: data.mapLocation ?? null,
      pos_x: draft.x,
      pos_y: draft.y,
      rotation: draft.rotation,
      reply_to_post_id: draft.replyTo?.postId ?? null,
      task_items: [],
      reactions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    setPosts(prev => [...prev, optimistic])

    try {
      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          board_id: boardId,
          author_id: currentUserId,
          type: data.type,
          title: data.title || null,
          content: data.type === 'tasks' ? null : data.content || null,
          image_url: imageUrl,
          map_location: data.mapLocation ?? null,
          pos_x: draft.x,
          pos_y: draft.y,
          rotation: draft.rotation,
          reply_to_post_id: draft.replyTo?.postId ?? null,
        })
        .select('*, author:profiles(*)')
        .single()

      if (error) throw error

      if (data.type === 'tasks' && data.content.trim()) {
        const lines = data.content.split('\n').map(l => l.trim()).filter(Boolean)
        const { data: items } = await supabase
          .from('task_items')
          .insert(lines.map((label, position) => ({ post_id: post.id, label, position })))
          .select()
        setPosts(prev => {
          const mapped = prev.map(p =>
            p.id === optimisticId
              ? { ...post, task_items: items ?? [], reactions: [] } as PostWithRelations
              : p
          )
          // Deduplicate: realtime may have already added the real post before this runs
          const seen = new Set<string>()
          return mapped.filter(p => !seen.has(p.id) && seen.add(p.id) !== undefined)
        })
      } else {
        setPosts(prev => {
          const mapped = prev.map(p =>
            p.id === optimisticId
              ? { ...post, task_items: [], reactions: [] } as PostWithRelations
              : p
          )
          const seen = new Set<string>()
          return mapped.filter(p => !seen.has(p.id) && seen.add(p.id) !== undefined)
        })
      }
    } catch {
      setPosts(prev => prev.filter(p => p.id !== optimisticId))
      toast.error('Failed to save post')
    }
  }, [draft, boardId, currentUserId, currentProfile, supabase])

  const handleDragEnd = useCallback(async (postId: string, x: number, y: number) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, pos_x: x, pos_y: y } : p))
    await supabase.from('posts').update({ pos_x: x, pos_y: y }).eq('id', postId)
  }, [supabase])

  const handleTaskToggle = useCallback(async (taskId: string, checked: boolean) => {
    setPosts(prev => prev.map(p => ({
      ...p,
      task_items: p.task_items?.map(t => t.id === taskId ? { ...t, checked } : t),
    })))
    await supabase.from('task_items').update({ checked }).eq('id', taskId)
  }, [supabase])

  const handleDeletePost = useCallback(async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId))
    await supabase.from('posts').delete().eq('id', postId)
  }, [supabase])

  const doExport = useCallback(async () => {
    const allPosts = postsRef.current.filter(p => !p.reply_to_post_id)
    if (allPosts.length === 0) { toast.error('Nothing to export'); return }

    const padding = 80
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    for (const post of allPosts) {
      const el = document.getElementById(`post-${post.id}`)
      const w = el?.offsetWidth ?? 288
      const h = el?.offsetHeight ?? 200
      minX = Math.min(minX, post.pos_x)
      minY = Math.min(minY, post.pos_y)
      maxX = Math.max(maxX, post.pos_x + w)
      maxY = Math.max(maxY, post.pos_y + h)
    }

    setIsExporting(true)
    await new Promise(r => setTimeout(r, 120))

    toast.loading('Exporting board…', { id: 'export' })
    try {
      const { toPng } = await import('html-to-image')
      const fullPng = await toPng(innerRef.current!, {
        backgroundColor: '#f4f3f0',
        pixelRatio: 2,
      })

      const img = new Image()
      await new Promise<void>(res => { img.onload = () => res(); img.src = fullPng })

      const scale = 2
      const cropW = maxX - minX + padding * 2
      const cropH = maxY - minY + padding * 2
      const canvas = document.createElement('canvas')
      canvas.width = cropW * scale
      canvas.height = cropH * scale
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img,
        (minX - padding) * scale, (minY - padding) * scale, cropW * scale, cropH * scale,
        0, 0, cropW * scale, cropH * scale)

      const a = document.createElement('a')
      a.download = `${boardNameRef.current ?? 'board'}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
      toast.success('Board exported!', { id: 'export' })
    } catch (err) {
      console.error(err)
      toast.error('Export failed', { id: 'export' })
    } finally {
      setIsExporting(false)
    }
  }, [])

  useEffect(() => {
    onExportReady?.(doExport)
  }, [onExportReady, doExport])

  const handleFitAll = useCallback(() => {
    const container = canvasRef.current
    if (!container || rootPosts.length === 0) return

    const padding = 80
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const post of rootPosts) {
      const cardEl = document.getElementById(`post-${post.id}`)
      const cardW = cardEl?.offsetWidth ?? 288
      const cardH = cardEl?.offsetHeight ?? 160
      minX = Math.min(minX, post.pos_x)
      minY = Math.min(minY, post.pos_y)
      maxX = Math.max(maxX, post.pos_x + cardW)
      maxY = Math.max(maxY, post.pos_y + cardH)
    }

    const contentW = maxX - minX + padding * 2
    const contentH = maxY - minY + padding * 2
    const scaleToFitW = container.clientWidth / contentW
    const scaleToFitH = container.clientHeight / contentH
    const targetScale = Math.min(scaleToFitW, scaleToFitH, 1.0)
    const targetZoom = Math.round(Math.max(20, targetScale * 100))
    const effectiveScale = targetZoom / 100

    setZoom(targetZoom)

    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const scrollLeft = centerX * effectiveScale - container.clientWidth / 2
    const scrollTop = centerY * effectiveScale - container.clientHeight / 2
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    })
  }, [rootPosts])

  const handleFocusPost = useCallback((post: PostWithRelations) => {
    const container = canvasRef.current
    if (!container) return
    const cardEl = document.getElementById(`post-${post.id}`)
    if (!cardEl) return

    // offsetWidth/Height give canvas-space dimensions (unaffected by ancestor scale transforms)
    const cardW = cardEl.offsetWidth
    const cardH = cardEl.offsetHeight
    const padding = 240

    const scaleToFitW = (container.clientWidth - padding) / cardW
    const scaleToFitH = (container.clientHeight - padding) / cardH
    const targetScale = Math.min(scaleToFitW, scaleToFitH, 1.0)
    const targetZoom = Math.round(Math.max(80, Math.min(100, targetScale * 100)))
    const effectiveScale = targetZoom / 100

    setZoom(targetZoom)

    // Scroll math is independent of DOM state so no need to wait for re-render
    const scrollLeft = (post.pos_x + cardW / 2) * effectiveScale - container.clientWidth / 2
    const scrollTop = (post.pos_y + cardH / 2) * effectiveScale - container.clientHeight / 2
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: 'smooth',
    })
  }, [])

  return (
    <div
      ref={canvasRef}
      className="relative flex-1 overflow-auto bg-jk-bg dot-grid"
    >
      <div
        ref={innerRef}
        className="relative"
        style={{
          transform: isExporting ? 'scale(1)' : `scale(${zoom / 100})`,
          transformOrigin: 'top left',
          minWidth: '200%',
          minHeight: '200%',
          transition: isExporting ? 'none' : 'transform 550ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {posts.length === 0 && !draft && (
          <EmptyState onCompose={spawnDraft} />
        )}

        {rootPosts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            replies={repliesByParentId.get(post.id) ?? []}
            onDragEnd={handleDragEnd}
            onTaskToggle={handleTaskToggle}
            onDelete={handleDeletePost}
            onReply={handleReply}
            onFocusPost={handleFocusPost}
          />
        ))}

        {draft && (
          <InlineCardEditor
            x={draft.x}
            y={draft.y}
            rotation={draft.rotation}
            currentProfile={currentProfile}
            currentUserId={currentUserId}
            replyTo={draft.replyTo}
            onSave={handleSaveDraft}
            onDiscard={() => setDraft(null)}
          />
        )}
      </div>

      <FloatingToolbar
        onNewPost={spawnDraft}
        zoom={zoom}
        onZoomChange={setZoom}
        onFitAll={handleFitAll}
      />
    </div>
  )
}
