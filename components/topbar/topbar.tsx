'use client'

import { useState } from 'react'
import { UserPlus, Share2, Download, Users, CalendarDays } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/utils'
import { InvitePanel } from '@/components/topbar/invite-panel'
import { ShareModal } from '@/components/share/share-modal'
import { UpgradeModal } from '@/components/upgrade/upgrade-modal'
import type { Board, BoardMemberWithProfile, Profile } from '@/lib/supabase/types'

const SPRING = { type: 'spring', stiffness: 600, damping: 32 } as const

interface TopbarProps {
  board: Board
  members: BoardMemberWithProfile[]
  currentUser: Profile | null
  currentUserId: string
  isOwner: boolean
  calendarOpen: boolean
  onCalendarToggle: () => void
  onExport?: () => void
}

export function Topbar({ board, members, currentUser, currentUserId, isOwner, calendarOpen, onCalendarToggle, onExport }: TopbarProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'boards' | 'members'>('boards')
  const isPro = currentUser?.plan === 'pro'
  const reduced = !!useReducedMotion()

  function handleShare() {
    if (!isPro) { setUpgradeReason('boards'); setUpgradeOpen(true); return }
    setShareOpen(true)
  }

  function handleExport() {
    if (!isPro) { setUpgradeReason('boards'); setUpgradeOpen(true); return }
    onExport?.()
  }

  return (
    <>
      {/* Floating pill topbar — absolute so it doesn't affect whiteboard layout */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        {/* Mount entrance: pill drops in from above */}
        <motion.div
          className="pointer-events-auto flex items-center bg-[#1c1b19] rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)] px-2 py-2 gap-0.5"
          initial={{ opacity: 0, y: reduced ? 0 : -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >

          {/* Members */}
          <motion.button
            onClick={() => setInviteOpen(true)}
            title="View members"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full hover:bg-white/[0.08] transition-colors duration-150"
            whileTap={reduced ? undefined : { scale: 0.88 }}
            transition={SPRING}
          >
            <Users className="w-3 h-3 text-white/40" />
            <span className="text-[11px] font-medium text-white/50 tabular-nums">{members.length}</span>
          </motion.button>

          <div className="w-px h-3.5 bg-white/[0.1] mx-0.5" />

          {/* Board name */}
          <span className="text-xs font-semibold text-white/90 px-2.5 max-w-[180px] truncate select-none">
            {board.name}
          </span>

          <div className="w-px h-3.5 bg-white/[0.1] mx-0.5" />

          {/* Calendar toggle — icon scales up when active to confirm state */}
          <motion.button
            onClick={onCalendarToggle}
            title="Board calendar"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-full transition-colors duration-150',
              calendarOpen
                ? 'text-[#38bdf8] bg-[#38bdf8]/15'
                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.08]',
            )}
            whileTap={reduced ? undefined : { scale: 0.85 }}
            transition={SPRING}
          >
            <motion.span
              className="flex"
              animate={{ scale: reduced ? 1 : calendarOpen ? 1.18 : 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </motion.span>
          </motion.button>

          {/* Secondary actions */}
          {isOwner && (
            <motion.button
              onClick={handleShare}
              title={isPro ? 'Share board' : 'Upgrade to share'}
              className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors duration-150"
              whileTap={reduced ? undefined : { scale: 0.88 }}
              transition={SPRING}
            >
              <Share2 className="w-3.5 h-3.5" />
            </motion.button>
          )}
          <motion.button
            onClick={handleExport}
            title={isPro ? 'Export as image' : 'Upgrade to export'}
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-colors duration-150"
            whileTap={reduced ? undefined : { scale: 0.88 }}
            transition={SPRING}
          >
            <Download className="w-3.5 h-3.5" />
          </motion.button>

          <div className="w-1" />

          {/* Invite CTA */}
          <motion.button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white text-[11px] font-semibold transition-colors duration-150"
            whileHover={reduced ? undefined : { scale: 1.03 }}
            whileTap={reduced ? undefined : { scale: 0.95 }}
            transition={SPRING}
          >
            <UserPlus className="w-3 h-3" />
            <span className="hidden sm:inline">Invite</span>
          </motion.button>

        </motion.div>
      </div>

      <InvitePanel
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        board={board}
        members={members}
        currentUser={currentUser}
        isOwner={isOwner}
      />
      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        board={board}
      />
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        reason={upgradeReason}
      />
    </>
  )
}
