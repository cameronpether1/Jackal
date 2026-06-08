'use client'

import { useState } from 'react'
import { UserPlus, Share2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvitePanel } from '@/components/topbar/invite-panel'
import { MemberAvatarStack } from '@/components/topbar/member-avatar-stack'
import { ShareModal } from '@/components/share/share-modal'
import { UpgradeModal } from '@/components/upgrade/upgrade-modal'
import type { Board, BoardMemberWithProfile, Profile } from '@/lib/supabase/types'

interface TopbarProps {
  board: Board
  members: BoardMemberWithProfile[]
  currentUser: Profile | null
  currentUserId: string
  isOwner: boolean
  onExport?: () => void
}

export function Topbar({ board, members, currentUser, currentUserId, isOwner, onExport }: TopbarProps) {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'boards' | 'members'>('boards')
  const isPro = currentUser?.plan === 'pro'

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
      <header className="flex items-center pl-14 pr-3 h-12 bg-jk-surface border-b border-jk-border shrink-0 z-10 relative">
        {/* Left: member avatars (clickable to open members/invite panel) */}
        <div className="hidden sm:flex items-center">
          <button
            onClick={() => setInviteOpen(true)}
            aria-label="View members"
            className="flex items-center gap-2 group"
          >
            <MemberAvatarStack members={members} currentUserId={currentUserId} />
            <span className="text-[11px] text-jk-text-faint tabular-nums group-hover:text-jk-text-muted transition-colors">
              {members.length}
            </span>
          </button>
        </div>

        {/* Center: board title */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-jk-text truncate max-w-[160px] sm:max-w-[240px] pointer-events-none">
          {board.name}
        </h1>

        {/* Right: secondary actions + primary CTA */}
        <div className="flex items-center gap-0.5 ml-auto">
          {isOwner && (
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={handleShare}
              title={isPro ? 'Share board' : 'Upgrade to share'}
              className="text-jk-text-muted"
            >
              <Share2 />
            </Button>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleExport}
            title={isPro ? 'Export as image' : 'Upgrade to export'}
            className="text-jk-text-muted"
          >
            <Download />
          </Button>
          <div className="w-px h-4 bg-jk-border mx-1.5" />
          <Button
            size="sm"
            className="bg-jk-accent hover:bg-sky-400 text-white gap-1.5 text-xs font-medium"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Invite</span>
          </Button>
        </div>
      </header>

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
