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
} from '@/components/ui/dialog'
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
        <DialogContent
          showCloseButton={false}
          className="border-0 bg-transparent p-0 shadow-none ring-0 gap-0 sm:max-w-[360px] top-[72px] translate-y-0"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Members — {board.name}</DialogTitle>
          </DialogHeader>

          <div className="bg-[#1c1b19] rounded-[1.5rem] shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden flex flex-col max-h-[min(560px,75vh)]">

            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between shrink-0">
              <div>
                <p className="text-sm font-semibold text-white/90 leading-tight">{board.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {localMembers.length} {localMembers.length === 1 ? 'member' : 'members'}
                </p>
              </div>
              {plan === 'free' && (
                <span className="text-[11px] tabular-nums text-white/25">
                  {localMembers.length}/{limits.membersPerBoard}
                </span>
              )}
            </div>

            <div className="h-px bg-white/[0.06] mx-4 shrink-0" />

            {/* Scrollable member list */}
            <div className="overflow-y-auto flex-1 px-3 py-2">
              {localMembers.map(member => {
                const p = member.profile
                const color = getAvatarColor(p?.id ?? '')
                const isMe = p?.id === currentUser?.id
                const canRemove = isOwner && !isMe && member.role !== 'owner'
                return (
                  <div key={member.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors group/row">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 overflow-hidden"
                      style={{ backgroundColor: color }}
                    >
                      {p?.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : p?.display_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/85 truncate leading-tight">
                        {p?.display_name ?? 'Unknown'}
                        {isMe && <span className="text-white/30 font-normal"> · you</span>}
                      </div>
                      <div className="text-[11px] text-white/30 truncate">{p?.username}</div>
                    </div>
                    <span className="text-[10px] font-medium text-white/30 bg-white/[0.07] px-2 py-0.5 rounded-full shrink-0 capitalize">
                      {member.role}
                    </span>
                    {canRemove ? (
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(member)}
                        title={`Remove ${p?.display_name ?? 'member'}`}
                        className="opacity-0 group-hover/row:opacity-100 p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <div className="w-[22px] shrink-0" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Invite section */}
            {isOwner && (
              <>
                <div className="h-px bg-white/[0.06] mx-4 shrink-0" />
                <div className="px-4 py-3.5 shrink-0">
                  {atMemberLimit ? (
                    <button
                      onClick={() => setShowUpgrade(true)}
                      className="flex items-center gap-2 w-full text-xs text-[#38bdf8] hover:text-[#0ea5e9] transition-colors"
                    >
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      Upgrade to Pro to add more members
                    </button>
                  ) : (
                    <form onSubmit={handleInvite} className="flex gap-2 items-center">
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="person@example.com"
                        className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.1] rounded-full px-3.5 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/25 focus:bg-white/[0.12] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={sending || !email.trim()}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white transition-colors disabled:opacity-40 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation */}
      <Dialog open={!!confirmRemove} onOpenChange={open => { if (!open) setConfirmRemove(null) }}>
        <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none ring-0 gap-0 sm:max-w-[320px]">
          <DialogHeader className="sr-only">
            <DialogTitle>Remove member?</DialogTitle>
            <DialogDescription>
              {confirmRemove?.profile?.display_name ?? 'This member'} will lose access to {board.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-[#1c1b19] rounded-[1.5rem] shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">
            <div className="px-6 pt-6 pb-5">
              <p className="text-sm font-semibold text-white/90 mb-1.5">Remove member?</p>
              <p className="text-xs text-white/45 leading-relaxed">
                <span className="text-white/70">{confirmRemove?.profile?.display_name ?? 'This member'}</span>{' '}
                will lose access to <span className="text-white/70">{board.name}</span>. Their posts will remain on the board.
              </p>
            </div>
            <div className="h-px bg-white/[0.06]" />
            <div className="flex items-center gap-2 px-4 py-3.5">
              <button
                onClick={() => setConfirmRemove(null)}
                disabled={removing}
                className="flex-1 text-xs font-medium text-white/50 hover:text-white/80 bg-white/[0.07] hover:bg-white/[0.1] rounded-full py-2 transition-colors disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                disabled={removing}
                className="flex-1 text-xs font-medium text-white bg-red-500/80 hover:bg-red-500 rounded-full py-2 transition-colors disabled:opacity-40"
              >
                {removing ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
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
