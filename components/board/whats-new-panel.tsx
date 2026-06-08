'use client'

import { X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { getAvatarColor } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import type { BoardActivity } from '@/lib/supabase/types'

interface WhatsNewPanelProps {
  open: boolean
  activities: BoardActivity[]
  prevVisitedAt: string | null
  onClose: () => void
  onJumpToPost: (postId: string) => void
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  <  1) return 'just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function activityLabel(a: BoardActivity): { headline: string; body: string | null } {
  if (a.activity_type === 'reply') {
    const to = a.replied_to_author_name ? `to ${a.replied_to_author_name}` : ''
    return {
      headline: `replied ${to}`.trim(),
      body: a.content_preview,
    }
  }
  if (a.activity_type === 'task_change') {
    const verb = a.task_checked ? 'checked off' : 'unchecked'
    return {
      headline: `${verb} a task`,
      body: a.task_label,
    }
  }
  // post
  const title = a.post_title ? `"${a.post_title}"` : null
  return {
    headline: title ? `posted ${title}` : 'posted a new card',
    body: title ? null : a.content_preview,
  }
}

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl: string | null; size?: number }) {
  const color = getAvatarColor(name)
  const initial = name?.[0]?.toUpperCase() ?? '?'
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center text-white font-semibold overflow-hidden ring-2 ring-white/10"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        : initial}
    </div>
  )
}

export function WhatsNewPanel({ open, activities, prevVisitedAt, onClose, onJumpToPost }: WhatsNewPanelProps) {
  const since = prevVisitedAt
    ? new Date(prevVisitedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="fixed right-0 top-0 bottom-0 z-50 w-80 flex flex-col bg-[#1c1b19] shadow-[−4px_0_40px_rgba(0,0,0,0.4)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/[0.07] shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-white">What's new</h2>
              {since && (
                <p className="text-[11px] text-white/35 mt-0.5">since {since}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Count pill */}
          <div className="px-4 py-2.5 shrink-0">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {activities.length} new {activities.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Activity list */}
          <div className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
            {activities.map((a, i) => {
              const { headline, body } = activityLabel(a)
              const isPostOrReply = a.activity_type !== 'task_change'
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 320, damping: 28 }}
                  className={cn(
                    'group flex items-start gap-3 px-3 py-3 rounded-xl transition-colors',
                    isPostOrReply
                      ? 'hover:bg-white/[0.06] cursor-pointer'
                      : 'cursor-default'
                  )}
                  onClick={isPostOrReply ? () => onJumpToPost(a.post_id) : undefined}
                >
                  <Avatar name={a.author_name} avatarUrl={a.author_avatar_url} size={30} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-white/80 leading-snug">
                      <span className="font-semibold text-white">{a.author_name}</span>
                      {' '}
                      <span>{headline}</span>
                    </p>
                    {body && (
                      <p className="mt-0.5 text-[11px] text-white/40 leading-snug line-clamp-2">{body}</p>
                    )}
                    <p className="mt-1 text-[10px] text-white/25">{relativeTime(a.occurred_at)}</p>
                  </div>
                  {isPostOrReply && (
                    <ArrowRight className="w-3.5 h-3.5 text-white/20 shrink-0 mt-1 group-hover:text-white/50 transition-colors" />
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
