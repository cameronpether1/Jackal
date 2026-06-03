'use client'

import { cn } from '@/lib/utils'
import type { Reaction } from '@/lib/supabase/types'

const EMOJIS = ['👋', '❤️', '😂', '🎉', '🤷']

interface ReactionRowProps {
  reactions: Reaction[]
  currentUserId: string
  onToggle: (emoji: string) => void
}

export function ReactionRow({ reactions, currentUserId, onToggle }: ReactionRowProps) {
  const counts = EMOJIS.reduce<Record<string, { count: number; hasMe: boolean }>>((acc, emoji) => {
    const matching = reactions.filter(r => r.emoji === emoji)
    acc[emoji] = {
      count: matching.length,
      hasMe: matching.some(r => r.user_id === currentUserId),
    }
    return acc
  }, {})

  const activeEmojis = EMOJIS.filter(e => counts[e].count > 0)

  return (
    <div className="flex items-center gap-1 flex-wrap min-h-[24px]">
      {activeEmojis.map(emoji => (
        <button
          key={emoji}
          onClick={() => onToggle(emoji)}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors',
            counts[emoji].hasMe
              ? 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-400'
              : 'bg-jk-surface-offset text-jk-text-muted hover:bg-sky-50 dark:hover:bg-sky-950/50'
          )}
        >
          <span>{emoji}</span>
          <span className="font-medium">{counts[emoji].count}</span>
        </button>
      ))}
      <div className="flex gap-0.5 ml-auto">
        {EMOJIS.filter(e => !counts[e].count).map(emoji => (
          <button
            key={emoji}
            onClick={() => onToggle(emoji)}
            className="text-base opacity-30 hover:opacity-70 transition-opacity p-0.5"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
