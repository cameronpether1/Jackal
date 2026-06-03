'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Plus, LogOut, Moon, Sun, PanelLeft, Zap, CreditCard } from 'lucide-react'
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

const BOARD_COLORS = [
  'bg-sky-400', 'bg-pink-400', 'bg-blue-400',
  'bg-green-400', 'bg-purple-400', 'bg-yellow-400',
]

interface SidebarProps {
  boards: { id: string; name: string }[]
  ownedBoardCount: number
}

export function Sidebar({ boards, ownedBoardCount }: SidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const [showCreate, setShowCreate] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const { profile, setProfile } = useProfile()

  const avatarColor = getAvatarColor(profile?.id ?? '')
  const initials = profile?.display_name?.[0]?.toUpperCase() ?? '?'
  const plan = profile?.plan ?? 'free'
  const limits = getPlanLimits(plan)
  const atBoardLimit = ownedBoardCount >= limits.boards

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/login'
)  }

  async function handleManageBilling() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.assign(data.url
)  }

  function handleNewBoard() {
    if (atBoardLimit) {
      setShowUpgrade(true)
    } else {
      setShowCreate(true)
    }
  }

  return (
    <>
      <Sheet>
        <SheetTrigger
          className="fixed top-2.5 left-3 z-50 w-9 h-9 rounded-lg flex items-center justify-center bg-jk-surface hover:bg-jk-surface-offset border border-jk-border shadow-sm transition-colors"
          aria-label="Open sidebar"
        >
          <PanelLeft className="w-4 h-4 text-jk-text-muted" />
        </SheetTrigger>

        <SheetContent
          side="left"
          showCloseButton={false}
          className="p-0 gap-0 bg-jk-surface dark:bg-[#0e0d0c] border-r border-jk-border dark:border-white/10"
          style={{ width: '14rem' }}
        >
          {/* Header */}
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-5 border-b border-jk-border dark:border-white/10 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Jackal" className="w-7 h-7 rounded-lg object-cover shrink-0" />
            <span className="font-semibold text-sm text-jk-text dark:text-white">Jackal</span>
          </Link>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
            <div className="px-2 pb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-jk-text-faint dark:text-white/40">
                Boards
              </p>
            </div>
            {boards.map((board, i) => {
              const isActive = pathname === `/board/${board.id}`
              const color = BOARD_COLORS[i % BOARD_COLORS.length]
              return (
                <Link
                  key={board.id}
                  href={`/board/${board.id}`}
                  className={cn(
                    'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-jk-surface-offset dark:bg-white/15 text-jk-text dark:text-white'
                      : 'text-jk-text-muted dark:text-white/60 hover:bg-jk-surface-offset dark:hover:bg-white/8 hover:text-jk-text dark:hover:text-white'
                  )}
                >
                  <span className={cn('w-2 h-2 rounded-full shrink-0', color)} />
                  <span className="truncate">{board.name}</span>
                </Link>
              )
            })}
            <button
              onClick={handleNewBoard}
              className={cn(
                'flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors w-full mt-1',
                atBoardLimit
                  ? 'text-jk-accent hover:bg-jk-surface-offset'
                  : 'text-jk-text-faint dark:text-white/40 hover:text-jk-text-muted dark:hover:text-white/70 hover:bg-jk-surface-offset dark:hover:bg-white/8'
              )}
            >
              {atBoardLimit ? (
                <Zap className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>{atBoardLimit ? 'Upgrade for more boards' : 'New board'}</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="border-t border-jk-border dark:border-white/10 px-3 py-3 space-y-1">
            {/* Plan indicator */}
            {plan === 'free' ? (
              <button
                onClick={() => setShowUpgrade(true)}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-jk-accent hover:bg-jk-surface-offset transition-colors w-full"
              >
                <Zap className="w-4 h-4 shrink-0" />
                <div className="text-left min-w-0">
                  <div className="font-medium text-xs leading-tight">Upgrade to Pro</div>
                  <div className="text-[10px] text-jk-text-faint leading-tight">
                    {ownedBoardCount}/{limits.boards} boards used
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={handleManageBilling}
                className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-jk-text-faint dark:text-white/40 hover:text-jk-text-muted hover:bg-jk-surface-offset transition-colors w-full"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Pro · Manage billing</span>
              </button>
            )}

            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm text-jk-text-faint dark:text-white/40 hover:text-jk-text-muted dark:hover:text-white/70 hover:bg-jk-surface-offset dark:hover:bg-white/8 transition-colors w-full"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>

            {profile && (
              <div className="flex items-center gap-2 px-2 py-2">
                <button
                  onClick={() => setShowProfile(true)}
                  className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
                  title="Edit profile"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0 overflow-hidden ring-1 ring-black/10 dark:ring-white/20"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {profile.avatar_url
                      ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      : initials}
                  </div>
                  <span className="text-xs truncate text-jk-text-muted dark:text-white/60">
                    {profile.display_name}
                  </span>
                </button>
                <button
                  onClick={handleSignOut}
                  className="shrink-0 text-jk-text-faint dark:text-white/30 hover:text-jk-text-muted dark:hover:text-white/70 transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
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
    </>
  )
}
