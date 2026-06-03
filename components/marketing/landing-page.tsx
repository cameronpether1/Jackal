'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, CheckSquare, StickyNote, MessageSquare, Image, Zap,
} from 'lucide-react'
import { MorphingText } from '@/components/magicui/morphing-text'
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid'
import { LightRays } from '@/components/ui/light-rays'
import { createClient } from '@/lib/supabase/client'
import { getAvatarColor } from '@/lib/avatar-color'
import type { Profile } from '@/lib/supabase/types'

const HERO_WORDS = ['collaborate', 'create', 'organise', 'build', 'plan', 'ship']

const FEATURES = [
  {
    name: 'Real-time collaboration',
    description: 'Every change appears instantly for your whole team. No refresh, no conflicts — just flow.',
    Icon: Zap,
    href: '/login',
    cta: 'Get started',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#0ea5e9" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    ),
  },
  {
    name: 'Task tracking',
    description: "Create task lists, check items off, and celebrate with confetti when you're done.",
    Icon: CheckSquare,
    href: '/login',
    cta: 'Get started',
    className: 'col-span-3 lg:col-span-1',
    background: null,
  },
  {
    name: 'Rich post types',
    description: 'Notes, questions, and task lists — express every kind of idea in its natural format.',
    Icon: StickyNote,
    href: '/login',
    cta: 'Get started',
    className: 'col-span-3 lg:col-span-1',
    background: null,
  },
  {
    name: 'Threaded replies',
    description: 'Keep conversations in context. Replies live inside the post they belong to.',
    Icon: MessageSquare,
    href: '/login',
    cta: 'Get started',
    className: 'col-span-3 lg:col-span-1',
    background: null,
  },
  {
    name: 'Image attachments',
    description: 'Drop a photo straight into a post. Perfect for mockups, screenshots, and inspiration.',
    Icon: Image,
    href: '/login',
    cta: 'Get started',
    className: 'col-span-3 lg:col-span-1',
    background: (
      <div className="absolute top-4 right-4 w-24 h-24 rounded-xl bg-sky-100/80 border border-sky-200/50 overflow-hidden opacity-60">
        <div className="w-full h-full bg-linear-to-br from-sky-200 to-blue-300" />
      </div>
    ),
  },
  {
    name: 'Multiplayer boards',
    description: 'Invite your whole team. Everyone sees the board live, all at once.',
    Icon: Users,
    href: '/login',
    cta: 'Get started',
    className: 'col-span-3 lg:col-span-2',
    background: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10">
        <div className="grid grid-cols-4 gap-3 scale-125 rotate-6">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="w-12 h-16 rounded-xl bg-sky-400" />
          ))}
        </div>
      </div>
    ),
  },
]

export function LandingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setAuthChecked(true)
    })
  }, [])

  return (
    <div className="min-h-screen bg-white text-neutral-900 antialiased">

      {/* ── Hero area with light-ray wash ── */}
      <div className="relative overflow-hidden bg-linear-to-b from-sky-50 via-sky-50/40 to-white">
        <LightRays
          color="rgba(14, 165, 233, 0.28)"
          count={9}
          speed={16}
          blur={40}
          length="80vh"
        />

        {/* ── Floating dark navbar ── */}
        <div className="relative z-50 sticky top-0 flex justify-center pt-4 px-4">
          <nav className="flex items-center gap-6 bg-[#0c1a2e] text-white rounded-full px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.30)]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mr-2">
              <img src="/logo.png" alt="Jackal" className="w-6 h-6 rounded-md object-cover shrink-0" />
              <span className="font-semibold text-sm">Jackal</span>
            </Link>

            {/* Links */}
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
              Features
            </Link>
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">
              Pricing
            </Link>

            <div className="flex items-center gap-2 ml-2">
              {authChecked && profile ? (
                <Link
                  href="/welcome"
                  className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white/20 hover:ring-white/50 transition-all shrink-0"
                  style={{ backgroundColor: getAvatarColor(profile.id) }}
                  title={profile.display_name}
                >
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt={profile.display_name} className="w-full h-full object-cover" />
                    : profile.display_name?.[0]?.toUpperCase() ?? '?'}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-medium bg-[#0ea5e9] text-white rounded-full px-4 py-1.5 hover:bg-sky-400 transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* ── Hero ── */}
        <section className="relative z-10 flex flex-col items-center text-center px-4 pt-20 pb-24">
          <div className="inline-flex items-center gap-2 bg-sky-100/80 border border-sky-200 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            <span className="text-sm text-sky-700 font-medium">Now in open beta</span>
          </div>

          <MorphingText texts={HERO_WORDS} className="text-[#0ea5e9]" />

          <p className="mt-6 text-lg text-neutral-500 max-w-lg leading-relaxed">
            Visual boards, task tracking, and real-time collaboration —
            all in one place. No setup. Just start.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/login"
              className="rounded-full bg-[#0ea5e9] text-white px-7 py-3 text-sm font-medium hover:bg-sky-400 transition-colors shadow-sm"
            >
              Get started for free
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-sky-200 px-7 py-3 text-sm font-medium text-sky-700 hover:bg-sky-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </section>
      </div>

      {/* ── Board preview / hero visual ── */}
      <section className="px-4 sm:px-8 max-w-5xl mx-auto mb-20 -mt-8">
        <div className="w-full aspect-[16/7] rounded-2xl overflow-hidden border border-sky-100 shadow-[0_8px_48px_rgba(14,165,233,0.10)] bg-[#f0f8ff]">
          {/* Dot-grid canvas preview */}
          <div className="w-full h-full relative"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(14,165,233,0.12) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          >
            {/* Simulated post cards */}
            {[
              { x: '8%',  y: '12%', w: '22%', h: '44%', label: 'Q3 goals',     type: 'note',     rotate: '-1.5deg' },
              { x: '32%', y: '8%',  w: '24%', h: '52%', label: 'Ship it 🚀',   type: 'task',     rotate: '1deg'    },
              { x: '58%', y: '14%', w: '22%', h: '40%', label: 'Design notes',  type: 'note',     rotate: '-0.8deg' },
              { x: '18%', y: '56%', w: '20%', h: '32%', label: 'Ideas?',        type: 'question', rotate: '1.2deg'  },
              { x: '68%', y: '52%', w: '22%', h: '38%', label: 'Assets',        type: 'note',     rotate: '-1deg'   },
            ].map((card, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.09)] p-4"
                style={{ left: card.x, top: card.y, width: card.w, height: card.h, transform: `rotate(${card.rotate})` }}
              >
                {card.type === 'question' && (
                  <span className="text-[10px] font-semibold text-sky-500 block mb-1">Question</span>
                )}
                <div className="font-bold text-xs text-neutral-800">{card.label}</div>
                {card.type === 'task' && (
                  <div className="mt-2 space-y-1.5">
                    {['Design review', 'Write copy', 'Ship'].map((t, j) => (
                      <div key={j} className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded border ${j < 2 ? 'bg-[#0ea5e9] border-[#0ea5e9]' : 'border-neutral-300'}`} />
                        <span className={`text-[10px] ${j < 2 ? 'line-through text-neutral-400' : 'text-neutral-600'}`}>{t}</span>
                      </div>
                    ))}
                  </div>
                )}
                {card.type === 'note' && (
                  <div className="mt-1.5 space-y-1">
                    <div className="h-1.5 rounded-full bg-sky-50 w-full" />
                    <div className="h-1.5 rounded-full bg-sky-50 w-3/4" />
                    <div className="h-1.5 rounded-full bg-sky-50 w-5/6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento grid features ── */}
      <section id="features" className="px-4 sm:px-8 max-w-5xl mx-auto pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything your team needs
          </h2>
          <p className="mt-3 text-neutral-500">
            Built for how teams actually work — together.
          </p>
        </div>

        <BentoGrid>
          {FEATURES.map(f => (
            <BentoCard key={f.name} {...f} />
          ))}
        </BentoGrid>
      </section>

      {/* ── CTA strip ── */}
      <section className="border-t border-sky-100 py-20 text-center px-4">
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          Ready to bring your team together?
        </h2>
        <p className="text-neutral-500 mb-8">Free to get started. No credit card required.</p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-[#0ea5e9] text-white px-8 py-3.5 text-sm font-semibold hover:bg-sky-400 transition-colors shadow-sm"
        >
          Get started for free
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-sky-100 py-8 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <img src="/logo.png" alt="Jackal" className="w-5 h-5 rounded-md object-cover" />
          Jackal © {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-6 text-sm text-neutral-400">
          <Link href="/login" className="hover:text-sky-500 transition-colors">Log in</Link>
          <Link href="/login" className="hover:text-sky-500 transition-colors">Sign up</Link>
        </div>
      </footer>

    </div>
  )
}
