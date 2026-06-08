'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, LogOut, Moon, Sun, Zap, CreditCard, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/hooks/use-theme'
import { useProfile } from '@/components/providers/profile-provider'
import { createClient } from '@/lib/supabase/client'
import { getAvatarColor } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import { getPlanLimits } from '@/lib/plans'
import { CreateBoardModal } from '@/components/sidebar/create-board-modal'
import { ProfileModal } from '@/components/profile/profile-modal'
import { UpgradeModal } from '@/components/upgrade/upgrade-modal'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const BOARD_COLORS = [
  'bg-sky-400', 'bg-pink-400', 'bg-blue-400',
  'bg-green-400', 'bg-purple-400', 'bg-yellow-400',
]

interface SidebarProps {
  boards: { id: string; name: string; isOwner: boolean; unreadCount: number }[]
  ownedBoardCount: number
}

export function Sidebar({ boards, ownedBoardCount }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [showCreate, setShowCreate] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [deleteBoard, setDeleteBoard] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const { profile, setProfile } = useProfile()

  const avatarColor = getAvatarColor(profile?.id ?? '')
  const initials = profile?.display_name?.[0]?.toUpperCase() ?? '?'
  const plan = profile?.plan ?? 'free'
  const limits = getPlanLimits(plan)
  const atBoardLimit = ownedBoardCount >= limits.boards

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  async function handleManageBilling() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.assign(data.url)
  }

  function handleNewBoard() {
    if (atBoardLimit) {
      setShowUpgrade(true)
    } else {
      setShowCreate(true)
    }
  }

  async function handleDeleteBoard() {
    if (!deleteBoard) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('boards').delete().eq('id', deleteBoard.id)
    if (error) {
      toast.error('Failed to delete board')
      setDeleting(false)
      return
    }
    toast.success(`"${deleteBoard.name}" deleted`)
    setDeleteBoard(null)
    if (pathname === `/board/${deleteBoard.id}`) router.push('/')
    else router.refresh()
  }

  return (
    <>
      <Sheet>
        {/* Trigger: logo button, visually part of the topbar's left edge */}
        <SheetTrigger
          className="fixed top-0 left-0 z-20 h-12 w-14 flex items-center justify-center bg-jk-surface border-b border-r border-jk-border hover:bg-jk-surface-offset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jk-accent/50"
          aria-label="Open menu"
        >
          <img src="/logo.png" alt="Jackal" className="w-6 h-6 rounded-[7px] object-cover" />
        </SheetTrigger>

        {/* Sidebar: always dark regardless of app theme */}
        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 gap-0 bg-[#1c1b19] border-r border-white/10 flex flex-col"
          style={{ width: '14rem' }}
        >
          {/* Header */}
          <Link
            href="/"
            className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.08] hover:opacity-75 transition-opacity shrink-0"
          >
            <img src="/logo.png" alt="Jackal" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            <span className="font-semibold text-sm text-white">Jackal</span>
          </Link>

          {/* Board list */}
          <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 min-h-0">
            {boards.map((board, i) => {
              const isActive = pathname === `/board/${board.id}`
              const color = BOARD_COLORS[i % BOARD_COLORS.length]
              return (
                <div key={board.id} className="group/row relative flex items-center">
                  <Link
                    href={`/board/${board.id}`}
                    className={cn(
                      'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors flex-1 min-w-0 pr-7',
                      isActive
                        ? 'bg-white/12 text-white'
                        : 'text-white/55 hover:bg-white/8 hover:text-white/85'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                    <span className="truncate flex-1 min-w-0">{board.name}</span>
                    {board.unreadCount > 0 && !isActive && (
                      <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                        {board.unreadCount > 99 ? '99+' : board.unreadCount}
                      </span>
                    )}
                  </Link>
                  {board.isOwner && (
                    <button
                      type="button"
                      onClick={() => setDeleteBoard({ id: board.id, name: board.name })}
                      className="absolute right-1 opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded text-white/25 hover:text-red-400 focus-visible:opacity-100"
                      title="Delete board"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}

            {/* New board */}
            <button
              onClick={handleNewBoard}
              className={cn(
                'flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm transition-colors w-full mt-0.5',
                atBoardLimit
                  ? 'text-sky-400 hover:bg-white/8'
                  : 'text-white/30 hover:text-white/55 hover:bg-white/6'
              )}
            >
              {atBoardLimit
                ? <Zap className="w-3.5 h-3.5 shrink-0" />
                : <Plus className="w-3.5 h-3.5 shrink-0" />
              }
              <span>{atBoardLimit ? 'Upgrade for more' : 'New board'}</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="border-t border-white/[0.08] px-3 py-3 space-y-1 shrink-0">
            {/* Upgrade prompt — free plan only */}
            {plan === 'free' && (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-sky-400 hover:bg-white/8 transition-colors w-full"
              >
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-xs leading-tight">Upgrade to Pro</div>
                  <div className="text-[10px] text-white/30 leading-tight tabular-nums">
                    {ownedBoardCount}/{limits.boards} boards
                  </div>
                </div>
              </button>
            )}

            {/* User row: avatar + name + icon actions */}
            {profile && (
              <div className="flex items-center gap-2 px-2 py-1.5">
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-75 transition-opacity"
                  title="Edit profile"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 overflow-hidden ring-1 ring-white/20"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <span className="text-xs truncate text-white/50">
                    {profile.display_name}
                  </span>
                </button>

                {/* Icon actions */}
                <div className="flex items-center shrink-0">
                  {plan === 'pro' && (
                    <button
                      onClick={handleManageBilling}
                      className="p-1.5 rounded text-white/25 hover:text-white/55 transition-colors"
                      title="Manage billing"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className="p-1.5 rounded text-white/25 hover:text-white/55 transition-colors"
                    title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded text-white/25 hover:text-white/55 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <CreateBoardModal open={showCreate} onOpenChange={setShowCreate} />
      <ProfileModal
        open={showProfile}
        onOpenChange={setShowProfile}
        profile={profile}
        onUpdated={setProfile}
      />
      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        reason="boards"
      />
      <Dialog open={!!deleteBoard} onOpenChange={open => { if (!open) setDeleteBoard(null) }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete board?</DialogTitle>
            <DialogDescription>
              <strong>&ldquo;{deleteBoard?.name}&rdquo;</strong> and all its posts will be permanently deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteBoard(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteBoard} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
