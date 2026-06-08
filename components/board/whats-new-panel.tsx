'use client'

import { useMemo } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getAvatarColor } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import type { BoardActivity } from '@/lib/supabase/types'

const MotionCard = motion.create(Card)

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
    return { headline: `replied ${to}`.trim(), body: a.content_preview }
  }
  if (a.activity_type === 'task_change') {
    const verb = a.task_checked ? 'checked off' : 'unchecked'
    return { headline: `${verb} a task`, body: a.task_label }
  }
  const title = a.post_title ? `"${a.post_title}"` : null
  return { headline: title ? `posted ${title}` : 'posted a new card', body: title ? null : a.content_preview }
}

function Avatar({ name, avatarUrl, size = 32 }: { name: string; avatarUrl: string | null; size?: number }) {
  const color = getAvatarColor(name)
  return (
    <div
      className="rounded-full shrink-0 flex items-center justify-center text-white font-semibold overflow-hidden"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.38 }}
    >
      {avatarUrl
        ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        : name?.[0]?.toUpperCase() ?? '?'}
    </div>
  )
}

const AVATAR_SPRING = { type: 'spring' as const, stiffness: 380, damping: 22 }
const ROW_SPRING    = { type: 'spring' as const, stiffness: 320, damping: 28 }

export function WhatsNewPanel({ open, activities, prevVisitedAt, onClose, onJumpToPost }: WhatsNewPanelProps) {
  const uniqueAuthors = useMemo(() => {
    const seen = new Set<string>()
    return activities.filter(a => !seen.has(a.author_id) && seen.add(a.author_id) !== undefined)
  }, [activities])

  const displayAuthors = uniqueAuthors.slice(0, 4)

  const nameList = useMemo(() => {
    const names = uniqueAuthors.map(a => a.author_name.split(' ')[0])
    if (names.length === 0) return ''
    if (names.length === 1) return names[0]
    if (names.length === 2) return `${names[0]} and ${names[1]}`
    const rest = names.length - 2
    return `${names[0]}, ${names[1]} and ${rest} ${rest === 1 ? 'other' : 'others'}`
  }, [uniqueAuthors])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={onClose}
          />

          <MotionCard
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className={cn(
              'fixed z-50 flex flex-col overflow-hidden',
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
              'w-[min(360px,calc(100vw-32px))]',
              'max-h-[min(600px,calc(100vh-64px))]',
              'shadow-[0_16px_64px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_64px_rgba(0,0,0,0.6)]',
            )}
          >
            {/* ── Hero: avatar cluster + summary ──────────────────── */}
            <div className="relative shrink-0 px-5 pt-5 pb-5 bg-gradient-to-b from-muted to-card rounded-t-xl">
              {/* Close — matches Dialog's ghost icon-sm button */}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close"
                className="absolute top-2 right-2"
              >
                <X />
              </Button>

              {/* Overlapping avatars */}
              <div className="flex justify-center mb-4">
                <div className="flex items-center">
                  {displayAuthors.map((a, i) => (
                    <motion.div
                      key={a.author_id}
                      initial={{ opacity: 0, scale: 0.55, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ ...AVATAR_SPRING, delay: i * 0.07 }}
                      style={{ zIndex: displayAuthors.length - i, marginLeft: i === 0 ? 0 : -14 }}
                      className="ring-[3px] ring-card rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.12)]"
                    >
                      <Avatar name={a.author_name} avatarUrl={a.author_avatar_url} size={52} />
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <p className="text-center text-[13.5px] leading-snug text-jk-text">
                <span className="font-semibold">{nameList}</span>
                {' added '}
                <span className="font-semibold">{activities.length} new {activities.length === 1 ? 'item' : 'items'}</span>
              </p>

              {/* Unread dot */}
              <div className="flex justify-center mt-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] text-jk-text-faint">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                  since your last visit
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-border shrink-0" />

            {/* ── Scrollable activity feed ─────────────────────────── */}
            <div className="overflow-y-auto flex-1">
              {activities.map((a, i) => {
                const { headline, body } = activityLabel(a)
                const isClickable = a.activity_type !== 'task_change'
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...ROW_SPRING, delay: 0.1 + i * 0.035 }}
                    onClick={isClickable ? () => onJumpToPost(a.post_id) : undefined}
                    className={cn(
                      'group flex items-start gap-3 px-4 py-3.5',
                      'border-b border-border last:border-0',
                      isClickable
                        ? 'cursor-pointer hover:bg-muted'
                        : 'cursor-default',
                      'transition-colors duration-100',
                    )}
                  >
                    <div className="shrink-0 mt-0.5">
                      <Avatar name={a.author_name} avatarUrl={a.author_avatar_url} size={32} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug text-jk-text">
                        <span className="font-semibold">{a.author_name}</span>
                        {' '}
                        <span className="text-jk-text-muted">{headline}</span>
                      </p>
                      {body && (
                        <p className="mt-0.5 text-[11.5px] text-jk-text-muted line-clamp-2 leading-snug">
                          {body}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-jk-text-faint">
                        {relativeTime(a.occurred_at)}
                      </p>
                    </div>

                    {isClickable && (
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 mt-1 text-jk-text-faint group-hover:text-jk-text-muted transition-colors" />
                    )}
                  </motion.div>
                )
              })}
            </div>
          </MotionCard>
        </>
      )}
    </AnimatePresence>
  )
}
