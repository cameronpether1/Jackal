'use client'

import { useRef, useCallback, useState, useMemo, useEffect } from 'react'
import { Trash2, Copy, CornerUpLeft, MapPin, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { TaskList } from '@/components/board/task-list'
import { GlassButton } from '@/components/ui/glasscn/glass-button'
import { getAvatarColor } from '@/lib/avatar-color'
import { useProfile } from '@/components/providers/profile-provider'
import { cn } from '@/lib/utils'
import type { PostWithRelations } from '@/lib/supabase/types'
import { renderContent } from '@/lib/render-content'
import { getMapImageUrl } from '@/lib/mapbox'
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
  onTaskToggle: (taskId: string, checked: boolean) => void
  onAddTaskItem: (postId: string, label: string) => void
  onDelete: (postId: string) => void
  onReply?: (post: PostWithRelations) => void
  onFocusPost?: (post: PostWithRelations, rect: DOMRect) => void
}

const LINK_REF = /\[\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\]/g

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
  onDragEnd, onTaskToggle, onAddTaskItem, onDelete, onReply, onFocusPost,
}: PostCardProps) {
  const [pos, setPos] = useState({ x: post.pos_x, y: post.pos_y })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) setPos({ x: post.pos_x, y: post.pos_y })
  }, [post.pos_x, post.pos_y, isDragging])
  const outerRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  const { profile: currentProfile } = useProfile()
  const isAuthor = post.author_id === currentUserId
  const author = isAuthor && currentProfile ? currentProfile : post.author
  const isImageOnly = !!post.image_url && !post.title && !post.content && post.type !== 'tasks'
  const isMapOnly = !!post.map_location && !post.image_url && !post.title && !post.content && post.type !== 'tasks'
  const authorColor = getAvatarColor(author?.id ?? '')
  const initials = author?.display_name?.[0]?.toUpperCase() ?? '?'

  const sortedReplies = useMemo(
    () => [...replies].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    [replies]
  )

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="checkbox"]') || target.closest('a') || target.closest('[data-comment-bubble]')) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y }
    setIsDragging(true)
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    setPos({
      x: dragState.current.startPosX + (e.clientX - dragState.current.startX),
      y: dragState.current.startPosY + (e.clientY - dragState.current.startY),
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    const newX = dragState.current.startPosX + dx
    const newY = dragState.current.startPosY + dy
    dragState.current = null
    setIsDragging(false)
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) onDragEnd(post.id, newX, newY)
  }, [post.id, onDragEnd])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        {/* Outer wrapper — handles absolute positioning, drag, rotation, and badge */}
        <div
          ref={outerRef}
          id={`post-${post.id}`}
          className={cn('absolute select-none group/post', isDragging ? 'cursor-grabbing z-50' : 'cursor-grab')}
          style={{
            left: pos.x,
            top: pos.y,
            transform: isDragging ? 'rotate(0deg) translateY(-4px) scale(1.02)' : `rotate(${post.rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), left 350ms ease-in-out, top 350ms ease-in-out',
            touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
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

          {/* Card — always overflow-hidden since badge is now outside */}
          <div
            ref={cardRef}
            className={cn(
              'relative w-72 rounded-3xl group/card border overflow-hidden',
              'shadow-[0_4px_24px_rgba(0,0,0,0.09)]',
              isDragging
                ? 'shadow-[0_16px_48px_rgba(0,0,0,0.18)]'
                : 'hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
            )}
            style={{ transition: 'box-shadow 150ms ease', backgroundColor: '#F4F4F4', borderColor: 'rgba(0,0,0,0.08)' }}
          >
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
                  <span className="inline-block text-xs font-semibold text-[#1a6a30] mb-1.5">Question</span>
                )}
                {post.title && (
                  <h3 className="font-bold text-sm text-jk-text mb-2 leading-snug">{post.title}</h3>
                )}
                {post.type === 'tasks' ? (
                  <TaskList
                    items={post.task_items ?? []}
                    onToggle={onTaskToggle}
                    onAddTask={(label) => onAddTaskItem(post.id, label)}
                    postId={post.id}
                    currentUserId={currentUserId}
                  />
                ) : (
                  post.content && (
                    <p className="text-sm text-jk-text-muted leading-relaxed whitespace-pre-wrap">{renderContent(post.content, { posts: allPosts, onJumpToPost })}</p>
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
                      <span className="text-[10px] text-jk-text truncate">{post.map_location.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Unified button overlay — bottom-left (expand) and bottom-right (comment), hover to reveal */}
            {(onFocusPost || onReply) && (
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 pointer-events-none">
                {onFocusPost ? (
                  <GlassButton
                    size="sm"
                    glassVariant="liquid-refract"
                    className="pointer-events-auto gap-1 text-[11px] h-7 px-2.5"
                    onClick={(e) => { e.stopPropagation(); if (cardRef.current) onFocusPost(post, cardRef.current.getBoundingClientRect()) }}
                  >
                    <Maximize2 className="w-3 h-3" />
                    Expand
                  </GlassButton>
                ) : <span />}
                {onReply ? (
                  <GlassButton
                    size="sm"
                    glassVariant="liquid-refract"
                    className="pointer-events-auto gap-1 text-[11px] h-7 px-2.5"
                    onClick={(e) => { e.stopPropagation(); onReply(post) }}
                  >
                    <CornerUpLeft className="w-3 h-3" />
                    Comment
                  </GlassButton>
                ) : <span />}
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
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
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
      </ContextMenuContent>
    </ContextMenu>
  )
}
