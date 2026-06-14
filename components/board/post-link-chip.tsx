'use client'

import { Link2 } from 'lucide-react'
import type { PostWithRelations } from '@/lib/supabase/types'

interface PostLinkChipProps {
  postId: string
  posts: PostWithRelations[]
  onJump?: (postId: string) => void
}

export function PostLinkChip({ postId, posts, onJump }: PostLinkChipProps) {
  const post = posts.find(p => p.id === postId)
  const label = post
    ? (post.title || post.content?.slice(0, 40) || 'Untitled')
    : 'Deleted post'

  return (
    <button
      type="button"
      onClick={e => { e.stopPropagation(); onJump?.(postId) }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-jk-accent/10 text-jk-accent text-xs font-medium hover:bg-jk-accent/20 transition-colors cursor-pointer align-baseline mx-0.5"
    >
      <Link2 className="w-2.5 h-2.5 shrink-0" />
      <span className="truncate max-w-[120px]">{label}</span>
    </button>
  )
}
