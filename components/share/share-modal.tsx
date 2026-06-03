'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Trash2, Link } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Board } from '@/lib/supabase/types'

interface ShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board: Board
}

export function ShareModal({ open, onOpenChange, board }: ShareModalProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState(false)

  const shareUrl = token
    ? `${window.location.origin}/share/${token}`
    : null

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/share?boardId=${board.id}`)
      .then(r => r.json())
      .then(d => setToken(d.token ?? null))
      .finally(() => setLoading(false))
  }, [open, board.id])

  async function handleCreate() {
    setLoading(true)
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: board.id }),
    })
    const data = await res.json()
    setToken(data.token ?? null)
    setLoading(false)
  }

  async function handleCopy() {
    if (!shareUrl) return
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRevoke() {
    setRevoking(true)
    await fetch('/api/share', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ boardId: board.id }),
    })
    setToken(null)
    setRevoking(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link className="w-4 h-4 text-jk-accent" />
            Share "{board.name}"
          </DialogTitle>
          <DialogDescription>
            Anyone with this link can view the board without signing in.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="h-10 rounded-lg bg-jk-surface-offset animate-pulse" />
        ) : token ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                readOnly
                value={shareUrl ?? ''}
                className="flex-1 text-xs font-mono text-jk-text-muted"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevoke}
              disabled={revoking}
              className="text-destructive hover:text-destructive gap-1.5 px-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {revoking ? 'Revoking…' : 'Revoke link'}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-jk-accent hover:bg-sky-400 text-white gap-2"
          >
            <Link className="w-4 h-4" />
            Create share link
          </Button>
        )}

        <p className="text-xs text-jk-text-faint">
          Guests can view posts but cannot reply, react, or add new posts.
        </p>
      </DialogContent>
    </Dialog>
  )
}
