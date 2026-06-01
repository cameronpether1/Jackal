'use client'

import { useState } from 'react'
import { Zap, Check, ArrowRight } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PLAN_LIMITS } from '@/lib/plans'

const PRO_FEATURES = [
  'Unlimited whiteboards',
  'Unlimited board members',
  'Larger image uploads (25 MB)',
  'Guest view-only share links (coming soon)',
  'Board export as image (coming soon)',
]

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reason: 'boards' | 'members'
}

export function UpgradeModal({ open, onOpenChange, reason }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const description = reason === 'boards'
    ? `Free accounts are limited to ${PLAN_LIMITS.free.boards} whiteboards. Upgrade to Pro for unlimited boards and more.`
    : `Free accounts are limited to ${PLAN_LIMITS.free.membersPerBoard} members per board. Upgrade to Pro for unlimited members.`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[var(--jk-accent)]" />
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 py-1">
          {PRO_FEATURES.map(label => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-[var(--jk-text)]">
              <Check className="w-3.5 h-3.5 text-[var(--jk-accent)] flex-shrink-0" />
              {label}
            </li>
          ))}
        </ul>

        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full bg-[var(--jk-accent)] hover:bg-sky-400 text-white gap-2 mt-1"
        >
          {loading ? 'Redirecting to Stripe…' : 'Upgrade to Pro'}
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
        <p className="text-center text-xs text-[var(--jk-text-faint)]">
          Secure payment via Stripe · Cancel anytime
        </p>
      </DialogContent>
    </Dialog>
  )
}
