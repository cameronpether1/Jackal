'use client'

import { useState } from 'react'
import { Zap, Check, Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PLAN_LIMITS } from '@/lib/plans'
import { cn } from '@/lib/utils'

type PlanKey = 'monthly' | 'yearly' | 'lifetime'

// Update display prices to match your Stripe dashboard
const PRICING_PLANS: {
  id: PlanKey
  name: string
  price: string
  period: string
  description: string
  badge?: string
  ctaLabel: string
  highlight?: boolean
  gradientFrom: string
}[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: '£5.99',
    period: '/mo',
    description: 'Full Pro access, cancel anytime.',
    ctaLabel: 'Start Monthly',
    gradientFrom: 'from-sky-500/10',
  },
  {
    id: 'yearly',
    name: 'Yearly',
    price: '£59.99',
    period: '/yr',
    description: 'Save over 15% vs monthly.',
    badge: 'Best Value',
    ctaLabel: 'Start Yearly',
    highlight: true,
    gradientFrom: 'from-violet-500/15',
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: '£115',
    period: 'once',
    description: 'Pay once, yours forever.',
    ctaLabel: 'Get Lifetime Access',
    gradientFrom: 'from-amber-500/10',
  },
]

const PRO_FEATURES = [
  'Unlimited whiteboards',
  'Unlimited board members',
  'Larger image uploads (25 MB)',
  'Guest view-only share links',
  'Board export as image',
]

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: 'boards' | 'members'
}

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState<PlanKey | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpgrade(plan: PlanKey) {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
        setLoading(null)
      }
    } catch {
      setError('Could not reach the server. Please try again.')
      setLoading(null)
    }
  }

  const description = reason === 'boards'
    ? `Free accounts are limited to ${PLAN_LIMITS.free.boards} whiteboards. Choose a plan to unlock more.`
    : `Free accounts are limited to ${PLAN_LIMITS.free.membersPerBoard} members per board. Choose a plan to unlock more.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-8">
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--jk-accent)]" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-2">
          {PRICING_PLANS.map(plan => (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-xl border overflow-hidden flex flex-col',
                plan.highlight
                  ? 'border-[var(--jk-accent)]/60'
                  : 'border-[var(--jk-border)]'
              )}
            >
              <div className={cn('px-5 pt-5 pb-4 bg-gradient-to-b to-transparent', plan.gradientFrom)}>
                {plan.badge && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--jk-accent)] mb-1.5">
                    <Sparkles className="w-2.5 h-2.5" />
                    {plan.badge}
                  </span>
                )}
                <p className="text-[11px] font-medium text-[var(--jk-text-faint)] uppercase tracking-wider">
                  {plan.name}
                </p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-[var(--jk-text)]">{plan.price}</span>
                  <span className="text-xs text-[var(--jk-text-faint)]">{plan.period}</span>
                </div>
                <p className="text-xs text-[var(--jk-text-faint)] mt-1 leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="px-5 pb-5 flex flex-col flex-1 gap-3 pt-3">
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading !== null}
                  size="sm"
                  className={cn(
                    'w-full text-xs h-8',
                    plan.highlight
                      ? 'bg-[var(--jk-accent)] hover:bg-sky-400 text-white'
                      : 'bg-[var(--jk-text)] text-[var(--jk-bg)] hover:bg-[var(--jk-text)]/90'
                  )}
                >
                  {loading === plan.id ? 'Redirecting…' : plan.ctaLabel}
                </Button>

                <ul className="space-y-1.5">
                  {PRO_FEATURES.map(label => (
                    <li key={label} className="flex items-start gap-2 text-[11px] text-[var(--jk-text-faint)]">
                      <Check className="w-3 h-3 text-[var(--jk-accent)] flex-shrink-0 mt-0.5" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        <p className="text-center text-xs text-[var(--jk-text-faint)]">
          Secure payment via Stripe · Monthly &amp; yearly plans can be cancelled anytime
        </p>
      </DialogContent>
    </Dialog>
  )
}
