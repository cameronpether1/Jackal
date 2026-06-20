'use client'

import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useAnimationFrame, useReducedMotion } from 'motion/react'
import { Trash2, Copy, CornerUpLeft, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { GlassContextMenuContent } from '@/components/ui/glasscn/glass-context-menu'
import { TaskList } from '@/components/board/task-list'
import { GlassButton } from '@/components/ui/glasscn/glass-button'
import { getAvatarColor } from '@/lib/avatar-color'
import { useProfile } from '@/components/providers/profile-provider'
import { cn } from '@/lib/utils'
import type { PostWithRelations } from '@/lib/supabase/types'
import { renderContent } from '@/lib/render-content'
import { getMapImageUrl } from '@/lib/mapbox'
import { LABEL_COLORS } from '@/lib/label-colors'
import FigmaComment from '@/components/smoothui/figma-comment'
import { ReplyBubble } from '@/components/board/reply-bubble'

interface PostCardProps {
  post: PostWithRelations
  currentUserId: string
  replies?: PostWithRelations[]
  isBoardOwner?: boolean
  allPosts?: PostWithRelations[]
  onJumpToPost?: (postId: string) => void
  isReplying?: boolean
  onReplyDraftSave?: (data: { content: string; imageFile?: File | null }) => void
  onReplyDraftDiscard?: () => void
  onDragEnd: (postId: string, x: number, y: number) => void
  boardBounds?: { w: number; h: number }
  getNearbyPostRects?: (excludeId: string) => Array<{ id: string; x: number; y: number; w: number; h: number }>
  getDraggedInfo?: () => { id: string; x: number; y: number; w: number; h: number } | null
  setActiveDrag?: (info: { id: string; x: number; y: number; w: number; h: number } | null) => void
  getZoom?: () => number
  onTaskToggle: (taskId: string, checked: boolean) => void
  onAddTaskItem: (postId: string, label: string) => void
  onDelete: (postId: string) => void
  onSetColor?: (postId: string, color: string | null) => void
  isFiltered?: boolean
  onReply?: (post: PostWithRelations) => void
  onFocusPost?: (post: PostWithRelations, cardEl: HTMLElement) => void
}

const LINK_REF = /\[\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]/g

const MAGNET_RADIUS = 200
const MAGNET_SNAP_GAP = 20
const BIAS_SPRING = { stiffness: 280, damping: 22, mass: 0.5 }
const ATTRACT_MAX = 25  // max pixel offset for dragged post bias
const STATIONARY_MAX = 14  // max pixel offset for stationary post attraction

// On release: if within MAGNET_RADIUS (or overlapping), returns the fully committed snap position.
function computeSnapCommit(
  raw: { x: number; y: number },
  w: number,
  h: number,
  others: Array<{ x: number; y: number; w: number; h: number }>,
): { x: number; y: number } | null {
  let snapX: number | null = null
  let snapY: number | null = null
  let minXDist = Infinity
  let minYDist = Infinity
  for (const o of others) {
    const gRight  = o.x - (raw.x + w)
    const gLeft   = raw.x - (o.x + o.w)
    const gBottom = o.y - (raw.y + h)
    const gTop    = raw.y - (o.y + o.h)
    const overlapping = gRight < 0 && gLeft < 0 && gBottom < 0 && gTop < 0
    if (overlapping) {
      // Min-penetration: find shortest axis to exit and snap to SNAP_GAP there
      const penR = -gRight, penL = -gLeft, penB = -gBottom, penT = -gTop
      const minH = Math.min(penR, penL)
      const minV = Math.min(penB, penT)
      if (minH <= minV && minH < minXDist) {
        minXDist = minH
        snapX = penL <= penR ? o.x + o.w + MAGNET_SNAP_GAP : o.x - w - MAGNET_SNAP_GAP
      } else if (minV < minH && minV < minYDist) {
        minYDist = minV
        snapY = penT <= penB ? o.y + o.h + MAGNET_SNAP_GAP : o.y - h - MAGNET_SNAP_GAP
      }
    } else {
      const vOverlap = Math.min(raw.y + h, o.y + o.h) - Math.max(raw.y, o.y)
      const hOverlap = Math.min(raw.x + w, o.x + o.w) - Math.max(raw.x, o.x)
      if (vOverlap > -MAGNET_RADIUS) {
        if (gRight >= 0 && gRight < MAGNET_RADIUS && gRight < minXDist) {
          minXDist = gRight; snapX = o.x - w - MAGNET_SNAP_GAP
        }
        if (gLeft >= 0 && gLeft < MAGNET_RADIUS && gLeft < minXDist) {
          minXDist = gLeft; snapX = o.x + o.w + MAGNET_SNAP_GAP
        }
      }
      if (hOverlap > -MAGNET_RADIUS) {
        if (gBottom >= 0 && gBottom < MAGNET_RADIUS && gBottom < minYDist) {
          minYDist = gBottom; snapY = o.y - h - MAGNET_SNAP_GAP
        }
        if (gTop >= 0 && gTop < MAGNET_RADIUS && gTop < minYDist) {
          minYDist = gTop; snapY = o.y + o.h + MAGNET_SNAP_GAP
        }
      }
    }
  }
  if (snapX === null && snapY === null) return null
  return { x: snapX ?? raw.x, y: snapY ?? raw.y }
}

// Returns the spring target bias to apply to the dragged post's position.
// Handles both the approach animation (bell-shaped pull) and overlap (min-penetration push-out).
function computeMagneticBias(
  raw: { x: number; y: number },
  w: number,
  h: number,
  others: Array<{ x: number; y: number; w: number; h: number }>,
): { x: number; y: number } {
  let bx = 0, by = 0
  for (const o of others) {
    const gRight  = o.x - (raw.x + w)
    const gLeft   = raw.x - (o.x + o.w)
    const gBottom = o.y - (raw.y + h)
    const gTop    = raw.y - (o.y + o.h)
    const overlapping = gRight < 0 && gLeft < 0 && gBottom < 0 && gTop < 0
    if (overlapping) {
      // Show push-out direction so user can see where it'll land
      const penR = -gRight, penL = -gLeft, penB = -gBottom, penT = -gTop
      const minH = Math.min(penR, penL)
      const minV = Math.min(penB, penT)
      if (minH <= minV) {
        bx += penL <= penR ? ATTRACT_MAX : -ATTRACT_MAX
      } else {
        by += penT <= penB ? ATTRACT_MAX : -ATTRACT_MAX
      }
    } else {
      // Bell-shaped attraction: 0 at MAGNET_RADIUS, peaks mid-range, 0 at snap gap, gentle repel inside
      const vOverlap = Math.min(raw.y + h, o.y + o.h) - Math.max(raw.y, o.y)
      const hOverlap = Math.min(raw.x + w, o.x + o.w) - Math.max(raw.x, o.x)
      if (vOverlap > -MAGNET_RADIUS) {
        if (gRight >= 0 && gRight < MAGNET_RADIUS)
          bx += (gRight - MAGNET_SNAP_GAP) * (1 - gRight / MAGNET_RADIUS)
        else if (gLeft >= 0 && gLeft < MAGNET_RADIUS)
          bx -= (gLeft - MAGNET_SNAP_GAP) * (1 - gLeft / MAGNET_RADIUS)
      }
      if (hOverlap > -MAGNET_RADIUS) {
        if (gBottom >= 0 && gBottom < MAGNET_RADIUS)
          by += (gBottom - MAGNET_SNAP_GAP) * (1 - gBottom / MAGNET_RADIUS)
        else if (gTop >= 0 && gTop < MAGNET_RADIUS)
          by -= (gTop - MAGNET_SNAP_GAP) * (1 - gTop / MAGNET_RADIUS)
      }
    }
  }
  return {
    x: Math.max(-ATTRACT_MAX, Math.min(ATTRACT_MAX, bx)),
    y: Math.max(-ATTRACT_MAX, Math.min(ATTRACT_MAX, by)),
  }
}

function clampToBoard(
  pos: { x: number; y: number },
  w: number,
  h: number,
  board: { w: number; h: number },
): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(board.w - w, pos.x)),
    y: Math.max(0, Math.min(board.h - h, pos.y)),
  }
}

function getReplyMessage(reply: PostWithRelations, posts: PostWithRelations[] = []): string {
  if (reply.type === 'tasks') {
    const items = reply.task_items?.map(t => `• ${t.label}`).join('\n')
    return items || '(tasks)'
  }
  const parts = [reply.title, reply.content].filter(Boolean)
  if (parts.length > 0) {
    return parts.join('\n').replace(LINK_REF, (_, id) => {
      const p = posts.find(x => x.id === id)
      return `[${p?.title || p?.content?.slice(0, 30) || 'Linked post'}]`
    })
  }
  if (reply.map_location) return reply.map_location.label
  return ''
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function PostCard({
  post, currentUserId, replies = [], isBoardOwner = false,
  allPosts = [], onJumpToPost,
  isReplying = false, onReplyDraftSave, onReplyDraftDiscard,
  onDragEnd, boardBounds, getNearbyPostRects, getDraggedInfo, setActiveDrag, getZoom,
  onTaskToggle, onAddTaskItem, onDelete, onSetColor, isFiltered = false, onReply, onFocusPost,
}: PostCardProps) {
  // raw tracks the cursor exactly (no spring) — bias springs toward nearby posts
  const rawX = useMotionValue(post.pos_x)
  const rawY = useMotionValue(post.pos_y)
  const biasX = useSpring(0, BIAS_SPRING)
  const biasY = useSpring(0, BIAS_SPRING)
  const displayX = useTransform(() => rawX.get() + biasX.get())
  const displayY = useTransform(() => rawY.get() + biasY.get())
  // tracks the committed bias target (for onDragEnd final position)
  const biasTargetRef = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  isDraggingRef.current = isDragging

  useEffect(() => {
    if (!isDragging) {
      rawX.set(post.pos_x)
      rawY.set(post.pos_y)
      biasX.jump(0)
      biasY.jump(0)
      biasTargetRef.current = { x: 0, y: 0 }
    }
  }, [post.pos_x, post.pos_y, isDragging, rawX, rawY, biasX, biasY])

  // Stationary post attraction: read dragged post position every frame and spring toward it
  useAnimationFrame(() => {
    if (isDraggingRef.current) return
    const drag = getDraggedInfo?.()
    if (!drag || drag.id === post.id) {
      if (Math.abs(biasX.get()) > 0.1) biasX.set(0)
      if (Math.abs(biasY.get()) > 0.1) biasY.set(0)
      return
    }
    const el = outerRef.current
    const myW = el?.offsetWidth ?? 288
    const myH = el?.offsetHeight ?? 200
    const myX = rawX.get()
    const myY = rawY.get()
    const gRight  = drag.x - (myX + myW)
    const gLeft   = myX - (drag.x + drag.w)
    const gBottom = drag.y - (myY + myH)
    const gTop    = myY - (drag.y + drag.h)
    const overlapping = gRight < 0 && gLeft < 0 && gBottom < 0 && gTop < 0
    let ax = 0, ay = 0
    if (overlapping) {
      const penR = -gRight, penL = -gLeft, penB = -gBottom, penT = -gTop
      const minH = Math.min(penR, penL), minV = Math.min(penB, penT)
      if (minH <= minV) ax = penL <= penR ? STATIONARY_MAX : -STATIONARY_MAX
      else ay = penT <= penB ? STATIONARY_MAX : -STATIONARY_MAX
    } else {
      const vOverlap = Math.min(myY + myH, drag.y + drag.h) - Math.max(myY, drag.y)
      const hOverlap = Math.min(myX + myW, drag.x + drag.w) - Math.max(myX, drag.x)
      if (vOverlap > -MAGNET_RADIUS) {
        if (gRight >= 0 && gRight < MAGNET_RADIUS)
          ax = (1 - gRight / MAGNET_RADIUS) * STATIONARY_MAX
        else if (gLeft >= 0 && gLeft < MAGNET_RADIUS)
          ax = -(1 - gLeft / MAGNET_RADIUS) * STATIONARY_MAX
      }
      if (hOverlap > -MAGNET_RADIUS) {
        if (gBottom >= 0 && gBottom < MAGNET_RADIUS)
          ay = (1 - gBottom / MAGNET_RADIUS) * STATIONARY_MAX
        else if (gTop >= 0 && gTop < MAGNET_RADIUS)
          ay = -(1 - gTop / MAGNET_RADIUS) * STATIONARY_MAX
      }
    }
    biasX.set(ax)
    biasY.set(ay)
  })

  const outerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  const reduced = !!useReducedMotion()
  const { profile: currentProfile } = useProfile()
  const isAuthor = post.author_id === currentUserId
  const author = isAuthor && currentProfile ? currentProfile : post.author
  const isImageOnly = !!post.image_url && !post.title && !post.content && post.type !== 'tasks'
  const isMapOnly = !!post.map_location && !post.image_url && !post.title && !post.content && post.type !== 'tasks'
  const authorColor = getAvatarColor(author?.id ?? '')
  const initials = author?.display_name?.[0]?.toUpperCase() ?? '?'

  // Post-type semantic accent color (top border strip)
  const typeAccentColor = (isImageOnly || isMapOnly)
    ? null
    : post.type === 'tasks'
      ? '#faad86'   // Tangerine Dream
      : post.type === 'question'
        ? '#86fa96' // Mint
        : '#86d3fa' // Frozen Lake (note)

  // Task progress
  const taskItemsList = post.task_items ?? []
  const totalTasks = taskItemsList.length
  const completedTasks = taskItemsList.filter(t => t.checked).length
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Label color dot
  const labelHex = post.label_color
    ? LABEL_COLORS.find(c => c.id === post.label_color)?.hex ?? null
    : null

  const sortedReplies = useMemo(
    () => [...replies].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [replies]
  )

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="checkbox"]') || target.closest('a') || target.closest('[data-comment-bubble]')) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    // Snap bias spring to 0 so drag starts from the raw position
    biasX.jump(0)
    biasY.jump(0)
    biasTargetRef.current = { x: 0, y: 0 }
    const startPosX = rawX.get()
    const startPosY = rawY.get()
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX, startPosY }
    const el = outerRef.current
    setActiveDrag?.({ id: post.id, x: startPosX, y: startPosY, w: el?.offsetWidth ?? 288, h: el?.offsetHeight ?? 200 })
    setIsDragging(true)
  }, [rawX, rawY, biasX, biasY, post.id, setActiveDrag])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const el = outerRef.current
    const w = el?.offsetWidth ?? 288
    const h = el?.offsetHeight ?? 200
    const scale = (getZoom?.() ?? 100) / 100
    let newPos = {
      x: dragState.current.startPosX + (e.clientX - dragState.current.startX) / scale,
      y: dragState.current.startPosY + (e.clientY - dragState.current.startY) / scale,
    }
    if (boardBounds) newPos = clampToBoard(newPos, w, h, boardBounds)
    // Update raw position instantly (no spring lag during drag)
    rawX.set(newPos.x)
    rawY.set(newPos.y)
    // Compute magnetic bias and spring toward it
    const nearby = getNearbyPostRects?.(post.id) ?? []
    const bias = computeMagneticBias(newPos, w, h, nearby)
    biasTargetRef.current = bias
    biasX.set(bias.x)
    biasY.set(bias.y)
    // Broadcast dragged position so stationary posts can react
    setActiveDrag?.({ id: post.id, x: newPos.x, y: newPos.y, w, h })
  }, [boardBounds, getNearbyPostRects, post.id, rawX, rawY, biasX, biasY, setActiveDrag])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    const el = outerRef.current
    const w = el?.offsetWidth ?? 288
    const h = el?.offsetHeight ?? 200
    const rawPos = { x: rawX.get(), y: rawY.get() }
    // Check if we should snap-commit on release
    const nearby = getNearbyPostRects?.(post.id) ?? []
    const snap = computeSnapCommit(rawPos, w, h, nearby)
    let finalX: number, finalY: number
    if (snap) {
      finalX = snap.x
      finalY = snap.y
      // Commit raw to final position, then spring bias from current visual offset to 0
      // This keeps visual continuity and animates the post into place
      const visualOffsetX = rawPos.x + biasX.get() - finalX
      const visualOffsetY = rawPos.y + biasY.get() - finalY
      rawX.set(finalX)
      rawY.set(finalY)
      biasX.jump(visualOffsetX)
      biasY.jump(visualOffsetY)
      biasX.set(0)
      biasY.set(0)
    } else {
      finalX = rawPos.x + biasTargetRef.current.x
      finalY = rawPos.y + biasTargetRef.current.y
      rawX.set(finalX)
      rawY.set(finalY)
      biasX.jump(0)
      biasY.jump(0)
    }
    biasTargetRef.current = { x: 0, y: 0 }
    dragState.current = null
    setIsDragging(false)
    setActiveDrag?.(null)
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      onDragEnd(post.id, finalX, finalY)
    } else if (onFocusPost && cardRef.current) {
      onFocusPost(post, cardRef.current)
    }
  }, [post, onDragEnd, onFocusPost, rawX, rawY, biasX, biasY, setActiveDrag, getNearbyPostRects])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {/* Outer wrapper — canvas position driven by Framer Motion springs */}
        <motion.div
          ref={outerRef}
          id={`post-${post.id}`}
          className={cn('absolute select-none group/post', isDragging ? 'cursor-grabbing z-50' : 'cursor-grab', isFiltered && 'pointer-events-none')}
          style={{ x: displayX, y: displayY, touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
        {/* Inner wrapper — handles visual transforms (rotation, lift, scale) */}
        <motion.div
          animate={isDragging
            ? { rotate: 0, y: -6, scale: 1.03, filter: 'blur(0px)', opacity: 1 }
            : isFiltered
              ? { rotate: post.rotation, y: 0, scale: 1, filter: 'blur(4px)', opacity: 0.5 }
              : { rotate: post.rotation, y: 0, scale: 1, filter: 'blur(0px)', opacity: 1 }
          }
          whileHover={reduced || isDragging || isFiltered ? undefined : { y: -3, scale: 1.015 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Author badge — always visible on text posts, hover-only on image/map-only posts */}
          <div className={cn(
            'absolute -top-5 -right-5 group z-10 transition-opacity duration-150',
            (isImageOnly || isMapOnly) ? 'opacity-0 group-hover/post:opacity-100' : '',
          )}>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <span className="bg-[#1c1b19] text-white text-xs font-medium px-2.5 py-1 rounded-full rounded-br-none whitespace-nowrap shadow-sm">
                {author?.display_name ?? 'Unknown'}
              </span>
            </div>
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden cursor-default',
                'ring-[3px] ring-white shadow-md',
              )}
              style={{ backgroundColor: authorColor }}
            >
              {author?.avatar_url
                ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
          </div>

          {/* Card */}
          <div
            ref={cardRef}
            className={cn(
              'relative w-72 rounded-[18px] group/card border overflow-hidden transition-shadow duration-150',
              isDragging
                ? 'shadow-[0_8px_32px_rgba(0,0,0,0.16)]'
                : 'shadow-[0_4px_20px_rgba(0,0,0,0.09)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)]',
            )}
            style={{
              backgroundColor: '#ffffff',
              borderColor: 'rgba(0,0,0,0.08)',
              ...(typeAccentColor && {
                borderTopColor: typeAccentColor,
                borderTopWidth: '3px',
              }),
            }}
          >
            {/* Label color dot — top-right indicator of assigned label */}
            {labelHex && !isImageOnly && !isMapOnly && (
              <div
                className="absolute top-4 right-4 w-[7px] h-[7px] rounded-full z-10 pointer-events-none"
                style={{ backgroundColor: labelHex }}
                title={`Label: ${post.label_color}`}
              />
            )}

            {/* Image-only */}
            {isImageOnly && (
              <img
                src={post.image_url!}
                alt=""
                className="w-full block object-cover"
                draggable={false}
              />
            )}

            {/* Map-only */}
            {isMapOnly && (
              <>
                <img
                  src={getMapImageUrl(post.map_location!.lat, post.map_location!.lng)}
                  alt={post.map_location!.label}
                  className="w-full block"
                  draggable={false}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2.5"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
                >
                  <MapPin className="w-3 h-3 text-white/90 shrink-0" />
                  <span className="text-[11px] text-white font-medium truncate">{post.map_location!.label}</span>
                </div>
              </>
            )}

            {/* Text / task posts */}
            {!isImageOnly && !isMapOnly && (
              <div className="p-5 pt-6 pb-12">
                {post.type === 'question' && (
                  <span
                    className="inline-flex items-center text-[10px] font-semibold rounded-full px-2 py-0.5 mb-2"
                    style={{ backgroundColor: 'rgba(134, 250, 150, 0.22)', color: '#262626' }}
                  >
                    Question
                  </span>
                )}
                {post.title && (
                  <h3 className="font-bold text-[0.9375rem] text-jk-text mb-2 leading-snug tracking-tight text-balance">{post.title}</h3>
                )}
                {post.type === 'tasks' ? (
                  <>
                    {totalTasks > 0 && (
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className="flex-1 h-0.5 rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(0,0,0,0.07)' }}
                        >
                          <div
                            className="h-full rounded-full transition-[width] duration-500 ease-out"
                            style={{ width: `${taskProgress}%`, backgroundColor: '#faad86' }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-medium tabular-nums shrink-0"
                          style={{ color: '#b0afa9' }}
                        >
                          {completedTasks}/{totalTasks}
                        </span>
                      </div>
                    )}
                    <TaskList
                      items={post.task_items ?? []}
                      onToggle={onTaskToggle}
                      onAddTask={(label) => onAddTaskItem(post.id, label)}
                      postId={post.id}
                      currentUserId={currentUserId}
                    />
                  </>
                ) : (
                  post.content && (
                    <p className="text-[0.8125rem] font-medium text-jk-text leading-[1.55] whitespace-pre-wrap">{renderContent(post.content, { posts: allPosts, onJumpToPost })}</p>
                  )
                )}

                {post.image_url && (
                  <div className="mt-3">
                    <img src={post.image_url} alt="" className="w-full rounded-2xl object-cover" draggable={false} />
                  </div>
                )}

                {post.map_location && (
                  <div className="mt-3 rounded-2xl overflow-hidden">
                    <img
                      src={getMapImageUrl(post.map_location.lat, post.map_location.lng)}
                      alt={post.map_location.label}
                      className="w-full"
                      draggable={false}
                    />
                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-jk-surface-offset">
                      <MapPin className="w-3 h-3 text-destructive shrink-0" />
                      <span className="text-[10px] text-jk-text tracking-wide truncate">{post.map_location.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Comment button — bottom-right, hover to reveal */}
            {onReply && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 pointer-events-none">
                <GlassButton
                  size="sm"
                  glassVariant="liquid-refract"
                  className="pointer-events-auto gap-1 text-[11px] h-7 px-2.5"
                  onClick={(e) => { e.stopPropagation(); onReply(post) }}
                >
                  <CornerUpLeft className="w-3 h-3" />
                  Comment
                </GlassButton>
              </div>
            )}
          </div>

          {/* Comment bubbles — stacked to the right of the card */}
          {(sortedReplies.length > 0 || isReplying) && (
            <div
              data-comment-bubble
              className="absolute top-4 flex flex-col"
              style={{ left: 'calc(100% + 12px)', gap: '10px' }}
              onPointerDown={e => e.stopPropagation()}
            >
              {sortedReplies.map(reply => (
                <FigmaComment
                  key={reply.id}
                  className="h-8"
                  authorName={reply.author?.display_name ?? 'Someone'}
                  avatarUrl={reply.author?.avatar_url ?? undefined}
                  avatarColor={getAvatarColor(reply.author?.id ?? '')}
                  message={getReplyMessage(reply, allPosts)}
                  messageNode={reply.content ? renderContent(reply.content, { posts: allPosts, onJumpToPost }) : undefined}
                  imageUrl={reply.image_url ?? undefined}
                  timestamp={formatTimestamp(reply.created_at)}
                  width={200}
                  canDelete={reply.author_id === currentUserId}
                  onDelete={() => onDelete(reply.id)}
                />
              ))}
              {isReplying && onReplyDraftSave && onReplyDraftDiscard && (
                <ReplyBubble
                  currentProfile={currentProfile}
                  currentUserId={currentUserId}
                  posts={allPosts}
                  onSave={onReplyDraftSave}
                  onDiscard={onReplyDraftDiscard}
                />
              )}
            </div>
          )}
        </motion.div>{/* end inner visual-transform wrapper */}
        </motion.div>
      </ContextMenuTrigger>

      <GlassContextMenuContent>
        {/* Colour label picker */}
        {onSetColor && (
          <>
            <div className="flex items-center gap-1.5 px-1.5 py-1.5">
              {LABEL_COLORS.map(({ id, hex, name }) => {
                const active = post.label_color === id
                return (
                  <button
                    key={id}
                    title={name}
                    onClick={() => onSetColor(post.id, active ? null : id)}
                    className={cn(
                      'w-5 h-5 rounded-full transition-all duration-100 flex-shrink-0',
                      active
                        ? 'ring-2 ring-white/80 ring-offset-1 ring-offset-black/10 scale-110'
                        : 'opacity-70 hover:opacity-100 hover:scale-110',
                    )}
                    style={{ backgroundColor: hex }}
                  />
                )
              })}
            </div>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem onClick={() => {
          navigator.clipboard.writeText(`${window.location.href}#post-${post.id}`)
          toast.success('Link copied ✓')
        }}>
          <Copy className="w-4 h-4 mr-2" /> Copy link
        </ContextMenuItem>
        {onReply && (
          <ContextMenuItem onClick={() => onReply(post)}>
            <CornerUpLeft className="w-4 h-4 mr-2" /> Comment
          </ContextMenuItem>
        )}
        {(isAuthor || isBoardOwner) && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => onDelete(post.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </ContextMenuItem>
          </>
        )}
      </GlassContextMenuContent>
    </ContextMenu>
  )
}
