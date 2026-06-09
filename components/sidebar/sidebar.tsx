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
import { LiquidGlass } from '@/components/ui/glasscn/liquid-glass'
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

// Shared glass button style — applied to both <button> and <Link> elements
const glassItem = [
  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-150',
  'border border-transparent',
  'hover:border-white/45 hover:bg-white/30',
].join(' ')

const glassItemActive = 'border-white/45 bg-white/40 shadow-[0_8px_24px_rgba(255,255,255,0.18)]'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 mb-1.5 text-[10px] font-semibold text-[#1a1917]/40 dark:text-white/40 uppercase tracking-widest select-none">
      {children}
    </p>
  )
}

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
    if (atBoardLimit) setShowUpgrade(true)
    else setShowCreate(true)
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
        {/* Trigger: logo button in top-left */}
        <SheetTrigger
          className="fixed top-0 left-0 z-20 h-12 w-14 flex items-center justify-center bg-jk-surface border-b border-r border-jk-border hover:bg-jk-surface-offset transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-jk-accent/50"
          aria-label="Open menu"
        >
          <img src="/logo.png" alt="Jackal" className="w-6 h-6 rounded-[7px] object-cover" />
        </SheetTrigger>

        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-3 gap-0 flex flex-col bg-transparent !border-0 !shadow-none"
          style={{ width: 'calc(16rem + 1.5rem)' }}
        >
          <LiquidGlass className="flex-1 flex flex-col rounded-[1.75rem]">
            {/* App header */}
            <Link
              href="/"
              className="flex items-center gap-2.5 px-4 py-4 border-b border-white/20 dark:border-white/10 hover:opacity-75 transition-opacity shrink-0"
            >
              <img src="/logo.png" alt="Jackal" className="w-7 h-7 rounded-lg object-cover shrink-0" />
              <span className="font-semibold text-sm text-[#1a1917] dark:text-white">Jackal</span>
            </Link>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 min-h-0">

              {/* ── Boards ── */}
              <section>
                <SectionLabel>Boards</SectionLabel>
                <div className="space-y-0.5">
                  {boards.map((board, i) => {
                    const isActive = pathname === `/board/${board.id}`
                    const color = BOARD_COLORS[i % BOARD_COLORS.length]
                    return (
                      <div key={board.id} className="group/row relative">
                        <Link
                          href={`/board/${board.id}`}
                          className={cn(
                            glassItem,
                            'w-full pr-8 text-[#1a1917] dark:text-white',
                            isActive && glassItemActive,
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
                            className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/row:opacity-100 transition-opacity p-1 rounded text-[#1a1917]/25 hover:text-red-500 dark:text-white/25 dark:hover:text-red-400"
                            title="Delete board"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )
                  })}

                  {/* New board / upgrade */}
                  <button
                    type="button"
                    onClick={handleNewBoard}
                    className={cn(
                      glassItem,
                      'w-full',
                      atBoardLimit
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-[#1a1917]/45 dark:text-white/40',
                    )}
                  >
                    {atBoardLimit
                      ? <Zap className="w-3.5 h-3.5 shrink-0" />
                      : <Plus className="w-3.5 h-3.5 shrink-0" />}
                    <span>{atBoardLimit ? 'Upgrade for more' : 'New board'}</span>
                  </button>
                </div>
              </section>

              {/* ── Account ── */}
              <section>
                <SectionLabel>Account</SectionLabel>
                <div className="space-y-0.5">

                  {/* Profile */}
                  {profile && (
                    <button
                      type="button"
                      onClick={() => setShowProfile(true)}
                      className={cn(glassItem, 'w-full text-[#1a1917] dark:text-white')}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0"
                        style={{ backgroundColor: avatarColor }}
                      >
                        {profile.avatar_url
                          ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          : initials}
                      </div>
                      <span className="truncate">{profile.display_name}</span>
                    </button>
                  )}

                  {/* Theme toggle */}
                  <button
                    type="button"
                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                    className={cn(glassItem, 'w-full text-[#1a1917] dark:text-white')}
                  >
                    {isDark
                      ? <Sun className="w-4 h-4 shrink-0" />
                      : <Moon className="w-4 h-4 shrink-0" />}
                    <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
                  </button>

                  {/* Billing — pro only */}
                  {plan === 'pro' && (
                    <button
                      type="button"
                      onClick={handleManageBilling}
                      className={cn(glassItem, 'w-full text-[#1a1917] dark:text-white')}
                    >
                      <CreditCard className="w-4 h-4 shrink-0" />
                      <span>Manage billing</span>
                    </button>
                  )}

                  {/* Upgrade — free plan */}
                  {plan === 'free' && (
                    <button
                      type="button"
                      onClick={() => setShowUpgrade(true)}
                      className={cn(glassItem, 'w-full')}
                    >
                      <Zap className="w-4 h-4 shrink-0 text-sky-500" />
                      <div className="text-left">
                        <div className="text-xs font-medium text-sky-600 dark:text-sky-400 leading-tight">Upgrade to Pro</div>
                        <div className="text-[10px] text-[#1a1917]/40 dark:text-white/30 leading-tight tabular-nums">
                          {ownedBoardCount}/{limits.boards} boards
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Sign out */}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className={cn(glassItem, 'w-full text-[#1a1917] dark:text-white')}
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    <span>Sign out</span>
                  </button>
                </div>
              </section>
            </div>
          </LiquidGlass>
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
