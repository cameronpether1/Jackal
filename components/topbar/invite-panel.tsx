'use client'

import { useState, useEffect } from 'react'
import { Send, Zap, UserMinus } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  const [localMembers, setLocalMembers] = useState(members)
  const [confirmRemove, setConfirmRemove] = useState<BoardMemberWithProfile | null>(null)
  const [removing, setRemoving] = useState(false)
  const router = useRouter()

  // Keep local list in sync when server data updates (e.g. after router.refresh)
  useEffect(() => { setLocalMembers(members) }, [members])

  const plan = currentUser?.plan ?? 'free'
  const limits = getPlanLimits(plan)
  const atMemberLimit = localMembers.length >= limits.membersPerBoard

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

  async function handleConfirmRemove() {
    if (!confirmRemove) return
    setRemoving(true)
    try {
      const res = await fetch(`/api/board-members/${confirmRemove.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to remove member')
      }
      setLocalMembers(prev => prev.filter(m => m.id !== confirmRemove.id))
      toast.success(`${confirmRemove.profile?.display_name ?? 'Member'} removed`)
      setConfirmRemove(null)
      router.refresh()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove member')
    } finally {
      setRemoving(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md flex flex-col max-h-[85vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle>Members — {board.name}</DialogTitle>
          </DialogHeader>

          {/* Scrollable member list */}
          <div className="overflow-y-auto flex-1 -mx-1 px-1">
            <div className="space-y-0.5">
              {localMembers.map(member => {
                const p = member.profile
                const color = getAvatarColor(p?.id ?? '')
                const isMe = p?.id === currentUser?.id
                const canRemove = isOwner && !isMe && member.role !== 'owner'
                return (
                  <div key={member.id} className="flex items-center gap-3 py-2 rounded-lg">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0 overflow-hidden"
                      style={{ backgroundColor: color }}
                    >
                      {p?.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : p?.display_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-jk-text truncate">
                        {p?.display_name ?? 'Unknown'}
                        {isMe && <span className="text-jk-text-faint font-normal"> (you)</span>}
                      </div>
                      <div className="text-xs text-jk-text-muted truncate">{p?.username}</div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize shrink-0">
                      {member.role}
                    </Badge>
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(member)}
                        className="p-1.5 rounded-md text-jk-text-faint hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                        title={`Remove ${p?.display_name ?? 'member'}`}
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      // Spacer so rows without a button stay aligned
                      <div className="w-7 shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Invite section — always visible, pinned to bottom */}
          {isOwner && (
            <div className="space-y-2 pt-3 border-t border-border shrink-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-jk-text">Invite by email</p>
                {plan === 'free' && (
                  <span className="text-xs text-jk-text-faint">
                    {localMembers.length}/{limits.membersPerBoard} members
                  </span>
                )}
              </div>

              {atMemberLimit ? (
                <button
                  onClick={() => setShowUpgrade(true)}
                  className="flex items-center gap-2 w-full text-sm text-jk-accent hover:underline"
                >
                  <Zap className="w-4 h-4 shrink-0" />
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
                    className="bg-jk-accent hover:bg-sky-400 text-white shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <Dialog open={!!confirmRemove} onOpenChange={open => { if (!open) setConfirmRemove(null) }}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              <strong>{confirmRemove?.profile?.display_name ?? 'This member'}</strong> will lose access to{' '}
              <strong>{board.name}</strong>. Their posts will remain on the board.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(null)} disabled={removing}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemove} disabled={removing}>
              {removing ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
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
