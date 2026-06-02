'use client'

import { useState } from 'react'
import { Send, Zap } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAvatarColor } from '@/lib/avatar-color'
import { getPlanLimits } from '@/lib/plans'
import { UpgradeModal } from '@/components/upgrade/upgrade-modal'
import type { Board, BoardMemberWithProfile, Profile } from '@/lib/supabase/types'

interface InvitePanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board: Board
  members: BoardMemberWithProfile[]
  currentUser: Profile | null
  isOwner: boolean
}

export function InvitePanel({ open, onOpenChange, board, members, currentUser, isOwner }: InvitePanelProps) {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const plan = currentUser?.plan ?? 'free'
  const limits = getPlanLimits(plan)
  const atMemberLimit = members.length >= limits.membersPerBoard

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: board.id, email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to send invite')
      }
      toast.success(`Invite sent to ${email} ✓`)
      setEmail('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Members — {board.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-1 mt-2">
            {members.map(member => {
              const p = member.profile
              const color = getAvatarColor(p?.id ?? '')
              const isMe = p?.id === currentUser?.id
              return (
                <div key={member.id} className="flex items-center gap-3 py-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: color }}
                  >
                    {p?.avatar_url
                      ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                      : p?.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--jk-text)] truncate">
                      {p?.display_name ?? 'Unknown'}
                      {isMe && <span className="text-[var(--jk-text-faint)] font-normal"> (you)</span>}
                    </div>
                    <div className="text-xs text-[var(--jk-text-muted)] truncate">{p?.username}</div>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize flex-shrink-0">
                    {member.role}
                  </Badge>
                </div>
              )
            })}
          </div>

          {isOwner && (
            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--jk-text)]">Invite by email</p>
                {plan === 'free' && (
                  <span className="text-xs text-[var(--jk-text-faint)]">
                    {members.length}/{limits.membersPerBoard} members
                  </span>
                )}
              </div>

              {atMemberLimit ? (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-2 w-full text-sm text-[var(--jk-accent)] hover:underline"
                >
                  <Zap className="w-4 h-4 flex-shrink-0" />
                  Upgrade to Pro to invite more members
                </button>
              ) : (
                <form onSubmit={handleInvite} className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="person@example.com"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !email.trim()}
                    className="bg-[var(--jk-accent)] hover:bg-sky-400 text-white flex-shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        reason="members"
      />
    </>
  )
}
