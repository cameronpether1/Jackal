'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, LogOut, Moon, Plus, Sun, CreditCard, Zap, User } from 'lucide-react'
import { useTheme } from '@/hooks/use-theme'
import { useProfile } from '@/components/providers/profile-provider'
import { getPlanLimits } from '@/lib/plans'
import { createClient } from '@/lib/supabase/client'
import { GlassCommandDialog, GlassCommandInput } from '@/components/ui/glasscn/glass-command'
import {
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { CreateBoardModal } from '@/components/sidebar/create-board-modal'
import { ProfileModal } from '@/components/profile/profile-modal'
import { UpgradeModal } from '@/components/upgrade/upgrade-modal'

interface CommandMenuProps {
  boards: { id: string; name: string; isOwner: boolean }[]
  ownedBoardCount: number
}

export function CommandMenu({ boards, ownedBoardCount }: CommandMenuProps) {
  const [open, setOpen] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)

  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'
  const { profile, setProfile } = useProfile()
  const plan = profile?.plan ?? 'free'
  const limits = getPlanLimits(plan)
  const atBoardLimit = ownedBoardCount >= limits.boards

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) return
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Close first, then run action so the dialog exit animation plays
  const run = (fn: () => void) => {
    setOpen(false)
    setTimeout(fn, 120)
  }

  async function handleManageBilling() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.assign(data.url)
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  return (
    <>
      <GlassCommandDialog open={open} onOpenChange={setOpen}>
        <GlassCommandInput placeholder="Search boards and actions..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {boards.length > 0 && (
            <CommandGroup heading="Boards">
              {boards.map(board => (
                <CommandItem
                  key={board.id}
                  value={board.name}
                  onSelect={() => run(() => router.push(`/board/${board.id}`))}
                >
                  <Layout className="w-4 h-4 opacity-60" />
                  {board.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          <CommandSeparator />

          <CommandGroup heading="Actions">
            <CommandItem
              value="new board create"
              onSelect={() => run(() => {
                if (atBoardLimit) setShowUpgrade(true)
                else setShowCreate(true)
              })}
            >
              <Plus className="w-4 h-4 opacity-60" />
              New board
            </CommandItem>

            {profile && (
              <CommandItem
                value="profile account settings"
                onSelect={() => run(() => setShowProfile(true))}
              >
                <User className="w-4 h-4 opacity-60" />
                Profile
              </CommandItem>
            )}

            <CommandItem
              value="theme dark light mode toggle"
              onSelect={() => run(() => setTheme(isDark ? 'light' : 'dark'))}
            >
              {isDark
                ? <Sun className="w-4 h-4 opacity-60" />
                : <Moon className="w-4 h-4 opacity-60" />}
              {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </CommandItem>

            {plan === 'pro' && (
              <CommandItem
                value="billing subscription manage"
                onSelect={() => run(handleManageBilling)}
              >
                <CreditCard className="w-4 h-4 opacity-60" />
                Manage billing
              </CommandItem>
            )}

            {plan === 'free' && (
              <CommandItem
                value="upgrade pro plan"
                onSelect={() => run(() => setShowUpgrade(true))}
              >
                <Zap className="w-4 h-4 opacity-60" />
                Upgrade to Pro
              </CommandItem>
            )}

            <CommandItem
              value="sign out log out"
              onSelect={() => run(handleSignOut)}
            >
              <LogOut className="w-4 h-4 opacity-60" />
              Sign out
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </GlassCommandDialog>

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
