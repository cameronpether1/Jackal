'use client'

import { useRef, useCallback, useState } from 'react'
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
import { getAvatarColor } from '@/lib/avatar-color'
import { useProfile } from '@/components/providers/profile-provider'
import { cn } from '@/lib/utils'
import type { PostWithRelations } from '@/lib/supabase/types'
import { renderContent } from '@/lib/render-content'
import { getMapImageUrl } from '@/lib/mapbox'

interface PostCardProps {
  post: PostWithRelations
  currentUserId: string
  replies?: PostWithRelations[]
  isNew?: boolean
  onDragEnd: (postId: string, x: number, y: number) => void
  onTaskToggle: (taskId: string, checked: boolean) => void
  onDelete: (postId: string) => void
  onReply?: (post: PostWithRelations) => void
  onFocusPost?: (post: PostWithRelations, rect: DOMRect) => void
}

export function PostCard({
  post, currentUserId, replies = [], isNew,
  onDragEnd, onTaskToggle, onDelete, onReply, onFocusPost,
}: PostCardProps) {
  const [pos, setPos] = useState({ x: post.pos_x, y: post.pos_y })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  const { profile: currentProfile } = useProfile()
  const isAuthor = post.author_id === currentUserId
  const author = isAuthor && currentProfile ? currentProfile : post.author
  const isImageOnly = !!post.image_url && !post.title && !post.content && post.type !== 'tasks'
  const isMapOnly = !!post.map_location && !post.image_url && !post.title && !post.content && post.type !== 'tasks'
  const isFullBleed = isImageOnly || isMapOnly
  const authorColor = getAvatarColor(author?.id ?? '')
  const initials = author?.display_name?.[0]?.toUpperCase() ?? '?'

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="checkbox"]') || target.closest('a')) return
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
        <div
          ref={cardRef}
          id={`post-${post.id}`}
          className={cn(
            'absolute w-72 rounded-3xl select-none group/card border',
            isFullBleed ? 'overflow-hidden' : 'overflow-visible',
            `post-type-${post.type}`,
            isNew && !isDragging ? 'post-is-new' : 'shadow-[0_4px_24px_rgba(0,0,0,0.09)]',
            isDragging
              ? 'cursor-grabbing shadow-[0_16px_48px_rgba(0,0,0,0.18)] z-50'
              : 'cursor-grab hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
          )}
          style={{
            left: pos.x,
            top: pos.y,
            transform: isDragging ? 'rotate(0deg) translateY(-4px) scale(1.02)' : `rotate(${post.rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 150ms ease',
            touchAction: 'none',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* Author badge */}
          <div className={cn('group z-10', isFullBleed ? 'absolute top-2 right-2' : 'absolute -top-5 -right-5')}>
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <span className="bg-[#1c1b19] text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                {author?.display_name ?? 'Unknown'}
              </span>
            </div>
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden cursor-default',
                isNew ? 'avatar-is-new' : 'ring-[3px] ring-white shadow-md',
              )}
              style={{ backgroundColor: authorColor }}
            >
              {author?.avatar_url
                ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
          </div>

          {/* Full-bleed layouts */}
          {isImageOnly ? (
            <>
              <img
                src={post.image_url!}
                alt=""
                className="w-full block object-cover"
                draggable={false}
              />
              {(onFocusPost || onReply) && (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                  {onFocusPost ? (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFocusPost(post, cardRef.current!.getBoundingClientRect()) }}
                      className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Expand
                    </button>
                  ) : <span />}
                  {onReply && (
                    <button
                      type="button"
                      onClick={() => onReply(post)}
                      className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 transition-colors"
                    >
                      <CornerUpLeft className="w-3 h-3" />
                      Reply
                    </button>
                  )}
                </div>
              )}
            </>
          ) : isMapOnly ? (
            <>
              <img
                src={getMapImageUrl(post.map_location!.lat, post.map_location!.lng)}
                alt={post.map_location!.label}
                className="w-full block"
                draggable={false}
              />
              {/* Location label */}
              <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-3 py-2.5"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)' }}
              >
                <MapPin className="w-3 h-3 text-white/90 shrink-0" />
                <span className="text-[11px] text-white font-medium truncate">{post.map_location!.label}</span>
              </div>
              {/* Action buttons on hover */}
              {(onFocusPost || onReply) && (
                <div className="absolute top-2 left-2 right-14 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                  {onFocusPost && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onFocusPost(post, cardRef.current!.getBoundingClientRect()) }}
                      className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 transition-colors"
                    >
                      <Maximize2 className="w-3 h-3" />
                      Expand
                    </button>
                  )}
                  {onReply && (
                    <button
                      type="button"
                      onClick={() => onReply(post)}
                      className="flex items-center gap-1 text-[11px] text-white/80 hover:text-white bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 transition-colors"
                    >
                      <CornerUpLeft className="w-3 h-3" />
                      Reply
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (

          <div className="p-5 pt-6">
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
                postId={post.id}
                currentUserId={currentUserId}
              />
            ) : (
              post.content && (
                <p className="text-sm text-jk-text-muted leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p>
              )
            )}

            {/* Image alongside text */}
            {post.image_url && (
              <div className="mt-3">
                <img
                  src={post.image_url}
                  alt=""
                  className="w-full rounded-2xl object-cover"
                  draggable={false}
                />
              </div>
            )}

            {/* Map alongside text */}
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

            {/* Inline replies */}
            {replies.length > 0 && (
              <div className="mt-4 pt-3 border-t border-jk-border space-y-3">
                {[...replies]
                  .sort((a, b) => a.created_at.localeCompare(b.created_at))
                  .map((reply, index) => {
                    const isRight = index % 2 === 1
                    const replyColor = getAvatarColor(reply.author?.id ?? '')
                    const replyInitials = reply.author?.display_name?.[0]?.toUpperCase() ?? '?'
                    return (
                      <div key={reply.id} className={cn('flex items-start gap-2', isRight && 'flex-row-reverse')}>
                        <div
                          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden"
                          style={{ backgroundColor: replyColor }}
                        >
                          {reply.author?.avatar_url
                            ? <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" />
                            : replyInitials}
                        </div>
                        <div className={cn('flex-1 min-w-0', isRight && 'text-right')}>
                          <span className="block text-[10px] font-semibold text-jk-text-muted">{reply.author?.display_name}</span>
                          {reply.title && (
                            <p className="text-xs font-bold text-jk-text mt-0.5 leading-snug">{reply.title}</p>
                          )}
                          {reply.type === 'tasks' ? (
                            <TaskList
                              items={reply.task_items ?? []}
                              onToggle={onTaskToggle}
                              postId={reply.id}
                              currentUserId={currentUserId}
                            />
                          ) : (
                            reply.content && (
                              <p className="text-xs text-jk-text-muted leading-relaxed whitespace-pre-wrap">{renderContent(reply.content)}</p>
                            )
                          )}
                          {reply.image_url && (
                            <img
                              src={reply.image_url}
                              alt=""
                              className="mt-1.5 w-full rounded-xl object-cover"
                              draggable={false}
                            />
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Expand + Reply buttons */}
            {(onFocusPost || onReply) && (
              <div className="flex items-center justify-between mt-2">
                {onFocusPost ? (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onFocusPost(post, cardRef.current!.getBoundingClientRect()) }}
                    className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 flex items-center gap-1 text-[11px] text-jk-text-faint hover:text-jk-accent transition-[opacity,color] duration-150"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Expand
                  </button>
                ) : <span />}
                {onReply && (
                  <button
                    type="button"
                    onClick={() => onReply(post)}
                    className="[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/card:opacity-100 flex items-center gap-1 text-[11px] text-jk-text-faint hover:text-jk-accent transition-[opacity,color] duration-150"
                  >
                    <CornerUpLeft className="w-3 h-3" />
                    Reply
                  </button>
                )}
              </div>
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
            <CornerUpLeft className="w-4 h-4 mr-2" /> Reply
          </ContextMenuItem>
        )}
        {isAuthor && (
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
