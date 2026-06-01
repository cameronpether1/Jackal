'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAvatarColor } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import type { PostType, PostWithRelations, Profile } from '@/lib/supabase/types'

const POST_TYPES: { value: PostType; label: string; emoji: string }[] = [
  { value: 'note', label: 'Note', emoji: '📝' },
  { value: 'tasks', label: 'Tasks', emoji: '✅' },
  { value: 'question', label: 'Question', emoji: '❓' },
]

interface ComposeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
  currentUserId: string
  currentProfile: Profile | null
  onPostCreated: (post: PostWithRelations) => void
  existingPostCount: number
}

export function ComposeModal({
  open,
  onOpenChange,
  boardId,
  currentUserId,
  currentProfile,
  onPostCreated,
  existingPostCount,
}: ComposeModalProps) {
  const [type, setType] = useState<PostType>('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const authorColor = getAvatarColor(currentUserId)

  function reset() {
    setTitle('')
    setContent('')
    setType('note')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (type !== 'tasks' && !content.trim() && !title.trim()) return
    if (type === 'tasks' && !content.trim()) return

    setLoading(true)
    const supabase = createClient()
    try {
      // Stagger new cards slightly
      const offsetX = 80 + (existingPostCount % 6) * 20
      const offsetY = 100 + Math.floor(existingPostCount / 6) * 220
      const rotation = (Math.random() * 4 - 2)

      const { data: post, error } = await supabase
        .from('posts')
        .insert({
          board_id: boardId,
          author_id: currentUserId,
          type,
          title: title.trim() || null,
          content: type === 'tasks' ? null : content.trim() || null,
          pos_x: offsetX,
          pos_y: offsetY,
          rotation,
        })
        .select('*, author:profiles(*)')
        .single()

      if (error) throw error

      // For tasks, split content lines into task_items
      if (type === 'tasks' && content.trim()) {
        const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
        if (lines.length > 0) {
          await supabase.from('task_items').insert(
            lines.map((label, position) => ({ post_id: post.id, label, position }))
          )
        }
        const { data: withTasks } = await supabase
          .from('posts')
          .select('*, author:profiles(*), task_items(*), reactions(*)')
          .eq('id', post.id)
          .single()
        if (withTasks) {
          onPostCreated(withTasks as PostWithRelations)
        }
      } else {
        onPostCreated({ ...post, task_items: [], reactions: [] } as PostWithRelations)
      }

      toast.success('Post added ✓')
      reset()
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New post</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Type selector */}
          <div className="flex gap-2">
            {POST_TYPES.map(pt => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setType(pt.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border',
                  type === pt.value
                    ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-300'
                    : 'border-transparent bg-[var(--jk-surface-offset)] text-[var(--jk-text-muted)] hover:bg-sky-50/50'
                )}
              >
                <span>{pt.emoji}</span>
                {pt.label}
              </button>
            ))}
          </div>

          {/* Title field */}
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="text-sm"
          />

          {/* Content field */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={
              type === 'tasks'
                ? 'One task per line…'
                : type === 'question'
                ? 'What do you want to ask?'
                : 'Write a note…'
            }
            rows={4}
            className="w-full resize-none rounded-lg border border-[var(--jk-border)] bg-[var(--jk-surface-offset)] px-3 py-2 text-sm text-[var(--jk-text)] placeholder:text-[var(--jk-text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--jk-accent)]/30"
          />

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: authorColor }}
              >
                {currentProfile?.display_name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <span className="text-xs text-[var(--jk-text-muted)]">
                Posting as {currentProfile?.display_name ?? 'you'}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { reset(); onOpenChange(false) }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-[var(--jk-accent)] hover:bg-sky-400 text-white"
              >
                {loading ? 'Posting…' : 'Post'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
