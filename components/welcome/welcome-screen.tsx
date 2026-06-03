'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { errMsg } from '@/lib/error'
import { getPlanLimits } from '@/lib/plans'
import type { Profile } from '@/lib/supabase/types'

interface WelcomeScreenProps {
  profile: Profile | null
  ownedBoardCount: number
}

export function WelcomeScreen({ profile, ownedBoardCount }: WelcomeScreenProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [upgrading, setUpgrading] = useState(false)
  const router = useRouter()

  const plan = profile?.plan ?? 'free'
  const limits = getPlanLimits(plan)
  const atLimit = ownedBoardCount >= limits.boards

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: board, error } = await supabase
        .from('boards')
        .insert({ name: name.trim(), owner_id: user.id })
        .select()
        .single()

      if (error) throw error

      await supabase.from('board_members').insert({
        board_id: board.id,
        user_id: user.id,
        role: 'owner',
      })

      toast.success(`Board "${board.name}" created`)
      router.push(`/board/${board.id}`)
    } catch (err: unknown) {
      toast.error(errMsg(err, 'Failed to create board'))
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade() {
    setUpgrading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.assign(data.url)
      else setUpgrading(false)
    } catch {
      setUpgrading(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-jk-bg dot-grid px-4">
      <div className="bg-jk-surface rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-10 w-full max-w-sm text-center">
        <img src="/logo.png" alt="Jackal" className="w-12 h-12 rounded-xl object-cover mb-5 mx-auto" />

        {atLimit ? (
          <>
            <h1 className="text-xl font-semibold text-jk-text mb-1">
              Board limit reached
            </h1>
            <p className="text-sm text-jk-text-muted mb-7">
              You&apos;ve used all {limits.boards} free boards. Upgrade to Pro for unlimited whiteboards.
            </p>
            <Button
              onClick={handleUpgrade}
              disabled={upgrading}
              className="w-full bg-jk-accent hover:bg-sky-400 text-white font-medium rounded-lg gap-2"
            >
              <Zap className="w-4 h-4" />
              {upgrading ? 'Redirecting…' : 'Upgrade to Pro'}
              {!upgrading && <ArrowRight className="w-4 h-4" />}
            </Button>
            <p className="text-xs text-jk-text-faint mt-3">
              Secure payment via Stripe · Cancel anytime
            </p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-jk-text mb-1">
              Welcome{profile?.display_name ? `, ${profile.display_name}` : ''}!
            </h1>
            <p className="text-sm text-jk-text-muted mb-7">
              Create your first board to get started.
            </p>
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Family Board"
                autoFocus
                className="text-center"
              />
              <Button
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full bg-jk-accent hover:bg-sky-400 text-white font-medium rounded-lg"
              >
                {loading ? 'Creating…' : 'Create board →'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
