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
      <DialogContent
        showCloseButton={false}
        className="border-0 bg-transparent p-0 shadow-none ring-0 gap-0 sm:max-w-[360px] top-[72px] translate-y-0"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Share {board.name}</DialogTitle>
          <DialogDescription>
            Anyone with this link can view the board without signing in.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-[#1c1b19] rounded-[1.5rem] shadow-[0_16px_48px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.08)] overflow-hidden">

          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <Link className="w-3.5 h-3.5 text-white/40 shrink-0" />
              <p className="text-sm font-semibold text-white/90 leading-tight">Share "{board.name}"</p>
            </div>
            <p className="text-xs text-white/35 pl-[22px]">
              Anyone with this link can view the board without signing in.
            </p>
          </div>

          <div className="h-px bg-white/[0.06] mx-4" />

          {/* Content */}
          <div className="px-4 py-4 space-y-3">
            {loading ? (
              <div className="h-8 rounded-full bg-white/[0.06] animate-pulse" />
            ) : token ? (
              <>
                <div className="flex gap-2 items-center">
                  <input
                    readOnly
                    value={shareUrl ?? ''}
                    onClick={e => (e.target as HTMLInputElement).select()}
                    className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.1] rounded-full px-3.5 py-2 text-xs font-mono text-white/60 focus:outline-none focus:border-white/25 transition-colors cursor-text"
                  />
                  <button
                    onClick={handleCopy}
                    title={copied ? 'Copied!' : 'Copy link'}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.14] text-white/50 hover:text-white/90 transition-colors shrink-0"
                  >
                    {copied
                      ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                      : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className="flex items-center gap-1.5 text-xs text-white/30 hover:text-red-400 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  {revoking ? 'Revoking…' : 'Revoke link'}
                </button>
              </>
            ) : (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white text-xs font-semibold transition-colors disabled:opacity-40"
              >
                <Link className="w-3.5 h-3.5" />
                Create share link
              </button>
            )}
          </div>

          <div className="h-px bg-white/[0.06] mx-4" />

          <p className="text-[11px] text-white/25 px-5 py-3.5">
            Guests can view posts but cannot reply, react, or add new posts.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
