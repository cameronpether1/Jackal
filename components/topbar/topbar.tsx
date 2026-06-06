'use client'

import { useState } from 'react'
import { Users, Share2, Download } from 'lucide-react'
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
      <header className="flex items-center justify-between pr-3 pl-14 h-12 sm:h-14 bg-jk-surface border-b border-jk-border shrink-0 z-10">
        <div className="hidden sm:flex items-center gap-3 min-w-0">
          <MemberAvatarStack members={members} currentUserId={currentUserId} />
          <span className="text-jk-text-muted text-sm">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <h1 className="text-sm font-semibold text-jk-text absolute left-1/2 -translate-x-1/2 truncate max-w-[160px] sm:max-w-xs">
          {board.name}
        </h1>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isOwner && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-sm"
              onClick={handleShare}
              title={isPro ? 'Share board' : 'Upgrade to share'}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-sm"
            onClick={handleExport}
            title={isPro ? 'Export as image' : 'Upgrade to export'}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-sm"
            onClick={() => setInviteOpen(true)}
          >
            <Users className="w-3.5 h-3.5" />
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
