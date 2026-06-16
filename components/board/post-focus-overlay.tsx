'use client'

import { forwardRef, useCallback, useEffect, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { MapPin, CornerUpLeft } from 'lucide-react'
import { TaskList } from '@/components/board/task-list'
import { getAvatarColor } from '@/lib/avatar-color'
import { getMapImageUrl } from '@/lib/mapbox'
import { renderContent } from '@/lib/render-content'
import type { PostWithRelations } from '@/lib/supabase/types'

function formatPillDate(iso: string): string {
  const d = new Date(iso)
  const day = d.getDate()
  const suffix = [11, 12, 13].includes(day)
    ? 'th'
    : day % 10 === 1 ? 'st'
    : day % 10 === 2 ? 'nd'
    : day % 10 === 3 ? 'rd'
    : 'th'
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  const month = d.toLocaleDateString('en-US', { month: 'short' })
  return `${weekday} ${day}${suffix} ${month}`
}

interface PostFocusOverlayProps {
  post: PostWithRelations | null
  replies: PostWithRelations[]
  currentUserId: string
  allPosts?: PostWithRelations[]
  bgRef?: Ref<HTMLDivElement>
  pillsRef?: Ref<HTMLDivElement>
  onClose: () => void
  onTaskToggle: (taskId: string, checked: boolean) => void
  onAddTaskItem: (postId: string, label: string) => void
  onReply: (post: PostWithRelations) => void
  onJumpToPost?: (postId: string) => void
}

export const PostFocusOverlay = forwardRef<HTMLDivElement, PostFocusOverlayProps>(
  function PostFocusOverlay(
    { post, replies, currentUserId, allPosts = [], bgRef, pillsRef, onClose, onTaskToggle, onAddTaskItem, onReply, onJumpToPost },
    panelRef
  ) {
    const [mounted, setMounted] = useState(false)
    useEffect(() => { setMounted(true) }, [])

    const author = post?.author
    const authorColor = getAvatarColor(author?.id ?? '')
    const initials = author?.display_name?.[0]?.toUpperCase() ?? '?'
    const sortedReplies = [...replies].sort((a, b) => a.created_at.localeCompare(b.created_at))

    const handleReply = useCallback(() => {
      if (!post) return
      onClose()
      onReply(post)
    }, [onClose, onReply, post])

    useEffect(() => {
      if (!post) return
      function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [post, onClose])

    if (!mounted) return null

    return createPortal(
      <>
        {/* Frosted glass — sibling of panel, never transformed, just fades */}
        <div
          ref={bgRef}
          className="fixed inset-0 z-[69] pointer-events-none"
          style={{
            backgroundColor: 'rgba(244, 244, 242, 0.82)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            opacity: 0,
            display: post ? 'block' : 'none',
          }}
        />

        {/* Morphing panel — GSAP controls scale/position, content lives here */}
        <div
          ref={panelRef}
          className="fixed inset-0 z-[70] overflow-hidden"
          style={{ display: post ? 'block' : 'none' }}
        >
            {post && (
              <div className="absolute inset-0 flex flex-col">
                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-10 pt-10 pb-24">
                  <div className="max-w-2xl mx-auto">
                    {post.type === 'question' && (
                      <span className="inline-block text-xs font-semibold text-[#1a6a30] tracking-wide mb-3">Question</span>
                    )}

                    {post.title && (
                      <h2 className="font-bold text-3xl text-jk-text mb-5 leading-tight tracking-tight text-balance">{post.title}</h2>
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
                        <p className="text-base text-jk-text-muted leading-relaxed whitespace-pre-wrap text-pretty max-w-[65ch]">
                          {renderContent(post.content, { posts: allPosts, onJumpToPost })}
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
                        <div className="flex items-center gap-1.5 px-3 py-2 bg-black/5">
                          <MapPin className="w-3.5 h-3.5 text-destructive shrink-0" />
                          <span className="text-xs text-jk-text tracking-wide truncate">{post.map_location.label}</span>
                        </div>
                      </div>
                    )}

                    {sortedReplies.length > 0 && (
                      <div className="mt-10 pt-6 border-t border-jk-border space-y-6">
                        <p className="text-xs font-medium text-jk-text-muted tracking-wide">
                          {sortedReplies.length} {sortedReplies.length === 1 ? 'comment' : 'comments'}
                        </p>
                        {sortedReplies.map((reply) => {
                          const replyColor = getAvatarColor(reply.author?.id ?? '')
                          const replyInitials = reply.author?.display_name?.[0]?.toUpperCase() ?? '?'
                          return (
                            <div key={reply.id} className="flex items-start gap-3">
                              <div
                                className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden mt-0.5"
                                style={{ backgroundColor: replyColor }}
                              >
                                {reply.author?.avatar_url
                                  ? <img src={reply.author.avatar_url} alt="" className="w-full h-full object-cover" />
                                  : replyInitials}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span className="text-sm font-semibold text-jk-text">
                                    {reply.author?.display_name ?? 'Unknown'}
                                  </span>
                                  <span className="text-xs text-jk-text-faint tracking-wide">
                                    {new Date(reply.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </span>
                                </div>
                                {reply.title && (
                                  <p className="text-sm font-bold text-jk-text leading-snug mb-1">{reply.title}</p>
                                )}
                                {reply.type === 'tasks' ? (
                                  <TaskList
                                    items={reply.task_items ?? []}
                                    onToggle={onTaskToggle}
                                    onAddTask={(label) => onAddTaskItem(reply.id, label)}
                                    postId={reply.id}
                                    currentUserId={currentUserId}
                                  />
                                ) : (
                                  reply.content && (
                                    <p className="text-[0.9375rem] text-jk-text-muted leading-relaxed whitespace-pre-wrap">
                                      {renderContent(reply.content, { posts: allPosts, onJumpToPost })}
                                    </p>
                                  )
                                )}
                                {reply.image_url && (
                                  <img
                                    src={reply.image_url}
                                    alt=""
                                    className="mt-2 w-full rounded-xl object-cover max-h-48"
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

                {/* Bottom pill bar */}
                <div ref={pillsRef} className="absolute bottom-5 left-5 right-5 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div data-pill className="flex items-center gap-1.5 bg-[#1c1b19] text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold overflow-hidden shrink-0"
                        style={{ backgroundColor: authorColor }}
                      >
                        {author?.avatar_url
                          ? <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <span>{author?.display_name ?? 'Unknown'}</span>
                    </div>
                    <div data-pill className="bg-[#1c1b19] text-white text-xs font-medium px-3 py-1.5 rounded-full">
                      {formatPillDate(post.created_at)}
                    </div>
                  </div>

                  <button
                    data-pill
                    type="button"
                    onClick={handleReply}
                    className="pointer-events-auto flex items-center gap-1.5 bg-[#1c1b19] text-white/75 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#2a2927] transition-colors"
                  >
                    <CornerUpLeft className="w-3.5 h-3.5" />
                    Comment
                  </button>
                </div>
              </div>
            )}
        </div>
      </>,
      document.body
    )
  }
)
