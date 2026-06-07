'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, MapPin, CornerUpLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskList } from '@/components/board/task-list'
import { getAvatarColor } from '@/lib/avatar-color'
import { getMapImageUrl } from '@/lib/mapbox'
import { renderContent } from '@/lib/render-content'
import type { PostWithRelations } from '@/lib/supabase/types'

const TYPE_LABEL: Record<string, string> = { note: 'Note', tasks: 'Tasks', question: 'Question' }

function rectToClipPath(rect: DOMRect): string {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const top = Math.max(0, rect.top)
  const right = Math.max(0, vw - rect.right)
  const bottom = Math.max(0, vh - rect.bottom)
  const left = Math.max(0, rect.left)
  return `inset(${top}px ${right}px ${bottom}px ${left}px round 24px)`
}

interface PostFocusOverlayProps {
  post: PostWithRelations
  replies: PostWithRelations[]
  currentUserId: string
  cardRect: DOMRect
  onClose: () => void
  onTaskToggle: (taskId: string, checked: boolean) => void
  onReply: (post: PostWithRelations) => void
}

export function PostFocusOverlay({ post, replies, currentUserId, cardRect, onClose, onTaskToggle, onReply }: PostFocusOverlayProps) {
  const [clipPath, setClipPath] = useState(() => rectToClipPath(cardRect))
  const [easing, setEasing] = useState<'open' | 'close'>('open')
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const author = post.author
  const authorColor = getAvatarColor(author?.id ?? '')
  const initials = author?.display_name?.[0]?.toUpperCase() ?? '?'
  const sortedReplies = [...replies].sort((a, b) => a.created_at.localeCompare(b.created_at))
  const formattedDate = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  // Expand from card position to full screen on mount
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setClipPath('inset(0px round 0px)')
      })
    })
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) return
    setEasing('close')
    setClipPath(rectToClipPath(cardRect))
    closeTimerRef.current = setTimeout(onClose, 300)
  }, [onClose, cardRect])

  const handleReply = useCallback(() => {
    if (closeTimerRef.current) return
    setEasing('close')
    setClipPath(rectToClipPath(cardRect))
    closeTimerRef.current = setTimeout(() => { onClose(); onReply(post) }, 300)
  }, [onClose, onReply, post, cardRect])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    }
  }, [handleClose])

  return createPortal(
    <div
      className={cn(
        'post-focus-overlay fixed inset-0 z-[70] flex overflow-hidden bg-jk-surface',
        `post-type-${post.type}`,
      )}
      style={{
        clipPath,
        transition: easing === 'open'
          ? 'clip-path 460ms cubic-bezier(0.16, 1, 0.3, 1)'
          : 'clip-path 300ms cubic-bezier(0.4, 0, 1, 1)',
      }}
    >
      {/* Floating back button */}
      <button
        onClick={handleClose}
        className="absolute top-6 left-6 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-jk-surface-offset hover:bg-jk-border transition-colors text-jk-text-muted hover:text-jk-text shadow-sm"
        aria-label="Back"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Main scrollable content */}
      <div className="flex-1 overflow-y-auto px-16 pt-20 pb-32">
        <div className="max-w-2xl mx-auto">
          {post.type === 'question' && (
            <span className="inline-block text-xs font-semibold text-[#1a6a30] mb-3">Question</span>
          )}

          {post.title && (
            <h2 className="font-bold text-3xl text-jk-text mb-5 leading-tight">{post.title}</h2>
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
              <p className="text-base text-jk-text-muted leading-relaxed whitespace-pre-wrap">
                {renderContent(post.content)}
              </p>
            )
          )}

          {post.image_url && (
            <div className="mt-6">
              <img src={post.image_url} alt="" className="w-full rounded-2xl object-cover" draggable={false} />
            </div>
          )}

          {post.map_location && (
            <div className="mt-6 rounded-2xl overflow-hidden">
              <img
                src={getMapImageUrl(post.map_location.lat, post.map_location.lng)}
                alt={post.map_location.label}
                className="w-full"
                draggable={false}
              />
              <div className="flex items-center gap-1.5 px-3 py-2 bg-jk-surface-offset">
                <MapPin className="w-3.5 h-3.5 text-destructive shrink-0" />
                <span className="text-xs text-jk-text truncate">{post.map_location.label}</span>
              </div>
            </div>
          )}

          {/* Replies */}
          {sortedReplies.length > 0 && (
            <div className="mt-10 pt-6 border-t border-jk-border space-y-6">
              <p className="text-xs text-jk-text-faint">
                {sortedReplies.length} {sortedReplies.length === 1 ? 'reply' : 'replies'}
              </p>
              {sortedReplies.map((reply, index) => {
                const isRight = index % 2 === 1
                const replyColor = getAvatarColor(reply.author?.id ?? '')
                const replyInitials = reply.author?.display_name?.[0]?.toUpperCase() ?? '?'
                return (
                  <div key={reply.id} className={cn('flex items-start gap-3', isRight && 'flex-row-reverse')}>
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden"
                      style={{ backgroundColor: replyColor }}
                    >
                      {reply.author?.avatar_url
                        ? <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        : replyInitials}
                    </div>
                    <div className={cn('flex-1 min-w-0', isRight && 'text-right')}>
                      <span className="block text-xs font-semibold text-jk-text-muted mb-0.5">
                        {reply.author?.display_name}
                      </span>
                      {reply.title && (
                        <p className="text-sm font-bold text-jk-text leading-snug mb-1">{reply.title}</p>
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
                          <p className="text-sm text-jk-text-muted leading-relaxed whitespace-pre-wrap">
                            {renderContent(reply.content)}
                          </p>
                        )
                      )}
                      {reply.image_url && (
                        <img
                          src={reply.image_url}
                          alt=""
                          className="mt-2 w-full rounded-xl object-cover"
                          draggable={false}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right metadata sidebar */}
      <div className="w-56 border-l border-jk-border px-8 py-20 shrink-0 flex flex-col gap-8 overflow-y-auto">
        <div>
          <p className="text-[9px] font-semibold text-jk-text-faint uppercase tracking-widest mb-2">Author</p>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0"
              style={{ backgroundColor: authorColor }}
            >
              {author?.avatar_url
                ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                : initials}
            </div>
            <span className="text-xs text-jk-text font-medium truncate">{author?.display_name ?? 'Unknown'}</span>
          </div>
        </div>

        <div>
          <p className="text-[9px] font-semibold text-jk-text-faint uppercase tracking-widest mb-1.5">Type</p>
          <p className="text-xs text-jk-text">{TYPE_LABEL[post.type]}</p>
        </div>

        <div>
          <p className="text-[9px] font-semibold text-jk-text-faint uppercase tracking-widest mb-1.5">Created</p>
          <p className="text-xs text-jk-text">{formattedDate}</p>
        </div>

        {sortedReplies.length > 0 && (
          <div>
            <p className="text-[9px] font-semibold text-jk-text-faint uppercase tracking-widest mb-1.5">Replies</p>
            <p className="text-xs text-jk-text">{sortedReplies.length}</p>
          </div>
        )}
      </div>

      {/* Floating action bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1 bg-[#1c1b19] rounded-full px-3 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
          <button
            type="button"
            onClick={handleReply}
            className="flex items-center gap-1.5 text-xs text-white/75 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <CornerUpLeft className="w-3.5 h-3.5" />
            Reply
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
