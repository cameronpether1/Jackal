'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { getAvatarColor } from '@/lib/avatar-color'
import type { Profile } from '@/lib/supabase/types'

export function LandingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
      setAuthChecked(true)
    })
  }, [])

  const isLoggedIn = !!profile

  const ctaHref = authChecked && isLoggedIn ? '/welcome' : '/login'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FBFAF5', color: '#333332' }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="shrink-0 w-11">
          {authChecked && profile && (
            <Link href="/welcome">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden"
                style={{ backgroundColor: getAvatarColor(profile.id) }}
              >
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  : profile.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-medium transition-opacity hover:opacity-60"
            style={{ color: '#333332' }}
          >
            Login
          </Link>
          <Link
            href="/login?mode=signup"
            className="text-sm font-semibold px-5 py-2 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#333332', color: '#FBFAF5' }}
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1
          className="font-black italic leading-[0.95] tracking-tight text-balance"
          style={{
            fontSize: 'clamp(3.5rem, 8vw, 6rem)',
            color: '#333332',
            fontFamily: 'var(--font-playfair)',
          }}
        >
          Add Dimension<br />to Groups
        </h1>

        <div className="mt-10">
          <Link
            href={ctaHref}
            className="inline-block text-sm font-semibold px-8 py-3.5 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#333332', color: '#FBFAF5' }}
          >
            Open Jackal
          </Link>
        </div>
      </main>

    </div>
  )
}
