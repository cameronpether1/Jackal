'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const [loading, setLoading] = useState(false)
  const [magicSent, setMagicSent] = useState(false)
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        })
        if (error) throw error
        setMagicSent(true)
        toast.success('Magic link sent! Check your email.')
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        })
        if (error) throw error
        toast.success('Account created! Check your email to confirm.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.assign(next
)      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (magicSent) {
    return (
      <div className="bg-jk-surface rounded-2xl p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
        <div className="text-3xl mb-3">📬</div>
        <h2 className="font-semibold text-jk-text mb-1">Check your email</h2>
        <p className="text-sm text-jk-text-muted">
          We sent a magic link to <strong>{email}</strong>
        </p>
        <button
          className="mt-4 text-sm text-jk-accent hover:underline"
          onClick={() => setMagicSent(false)}
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <div className="bg-jk-surface rounded-2xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-jk-text">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
        </div>

        {mode !== 'magic' && (
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-jk-text">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-jk-accent hover:bg-sky-400 text-white font-medium rounded-lg"
        >
          {loading ? 'Loading…' : mode === 'magic' ? 'Send magic link' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-4 space-y-2 text-center text-sm">
        {mode === 'signin' && (
          <>
            <button
              type="button"
              onClick={() => setMode('magic')}
              className="text-jk-accent hover:underline block w-full"
            >
              Sign in with magic link instead
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className="text-jk-text-muted hover:text-jk-text"
            >
              Don&apos;t have an account? <span className="text-jk-accent">Sign up</span>
            </button>
          </>
        )}
        {mode === 'signup' && (
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="text-jk-text-muted hover:text-jk-text"
          >
            Already have an account? <span className="text-jk-accent">Sign in</span>
          </button>
        )}
        {mode === 'magic' && (
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="text-jk-text-muted hover:text-jk-text"
          >
            Use password instead
          </button>
        )}
      </div>
    </div>
  )
}
