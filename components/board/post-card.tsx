'use client'

import { useRef, useCallback, useState } from 'react'
import { Trash2, Copy, CornerUpLeft, MapPin } from 'lucide-react'
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
  onDragEnd: (postId: string, x: number, y: number) => void
  onTaskToggle: (taskId: string, checked: boolean) => void
  onDelete: (postId: string) => void
  onReply?: (post: PostWithRelations) => void
  onFocusPost?: (post: PostWithRelations) => void
}

export function PostCard({
  post, currentUserId, replies = [],
  onDragEnd, onTaskToggle, onDelete, onReply, onFocusPost,
}: PostCardProps) {
  const [pos, setPos] = useState({ x: post.pos_x, y: post.pos_y })
  const [isDragging, setIsDragging] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null)

  const { profile: currentProfile } = useProfile()
  const isAuthor = post.author_id === currentUserId
  const author = isAuthor && currentProfile ? currentProfile : post.author
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

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('[role="checkbox"]') || target.closest('a')) return
    onFocusPost?.(post)
  }, [post, onFocusPost])

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={cardRef}
          id={`post-${post.id}`}
          className={cn(
            'absolute w-72 bg-white rounded-3xl select-none overflow-visible group/card',
            'shadow-[0_4px_24px_rgba(0,0,0,0.10)]',
            isDragging
              ? 'cursor-grabbing shadow-[0_16px_48px_rgba(0,0,0,0.18)] z-50'
              : 'cursor-grab hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
            'transition-shadow duration-150',
          )}
          style={{
            left: pos.x,
            top: pos.y,
            transform: isDragging ? 'rotate(0deg) translateY(-2px)' : `rotate(${post.rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 200ms ease, box-shadow 150ms ease',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onDoubleClick={onDoubleClick}
        >
          {/* Author badge */}
          <div className="absolute -top-5 -right-5 group z-10">
            <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
              <span className="bg-[#1c1b19] text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
                {author?.display_name ?? 'Unknown'}
              </span>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ring-[3px] ring-white overflow-hidden shadow-md cursor-default"
              style={{ backgroundColor: authorColor }}
            >
              {author?.avatar_url
                ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
          </div>

          <div className="p-5 pt-6">
            {post.type === 'question' && (
              <span className="inline-block text-xs font-semibold text-pink-500 mb-1.5">Question</span>
            )}
            {post.title && (
              <h3 className="font-bold text-sm text-[#1c1b19] mb-2 leading-snug">{post.title}</h3>
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
                <p className="text-sm text-[#6b6a67] leading-relaxed whitespace-pre-wrap">{renderContent(post.content)}</p>
              )
            )}

            {/* Image */}
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

            {/* Map */}
            {post.map_location && (
              <div className="mt-3 rounded-2xl overflow-hidden">
                <img
                  src={getMapImageUrl(post.map_location.lat, post.map_location.lng)}
                  alt={post.map_location.label}
                  className="w-full"
                  draggable={false}
                />
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#f8f7f5]">
                  <MapPin className="w-3 h-3 text-[#ee4444] shrink-0" />
                  <span className="text-[10px] text-[#1c1b19] truncate">{post.map_location.label}</span>
                </div>
              </div>
            )}

            {/* Inline replies */}
            {replies.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#f0ede8] space-y-3">
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
                          <span className="block text-[10px] font-semibold text-[#6b6a67]">{reply.author?.display_name}</span>
                          {reply.title && (
                            <p className="text-xs font-bold text-[#1c1b19] mt-0.5 leading-snug">{reply.title}</p>
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
                              <p className="text-xs text-[#6b6a67] leading-relaxed whitespace-pre-wrap">{renderContent(reply.content)}</p>
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

            {/* Reply button */}
            {onReply && (
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => onReply(post)}
                  className="opacity-0 group-hover/card:opacity-100 transition-opacity duration-150 flex items-center gap-1 text-[11px] text-[#b0afa9] hover:text-jk-accent transition-colors"
                >
                  <CornerUpLeft className="w-3 h-3" />
                  Reply
                </button>
              </div>
            )}
          </div>
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
