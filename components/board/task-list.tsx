'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import confetti from 'canvas-confetti'
import { createClient } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { TaskItem } from '@/lib/supabase/types'

interface TaskListProps {
  items: TaskItem[]
  onToggle: (taskId: string, checked: boolean) => void
  postId: string
  currentUserId: string
}

export function TaskList({ items, onToggle, postId, currentUserId }: TaskListProps) {
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [showInput, setShowInput] = useState(false)

  const sorted = [...items].sort((a, b) => a.position - b.position)

  function handleToggle(taskId: string, checked: boolean) {
    if (checked && items.length > 0) {
      const remainingUnchecked = items.filter(t => !t.checked && t.id !== taskId)
      if (remainingUnchecked.length === 0) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#38bdf8', '#fcd34d', '#86efac', '#67e8f9', '#c084fc'],
          scalar: 1.1,
        })
      }
    }
    onToggle(taskId, checked)
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newLabel.trim()) return
    setAdding(true)
    const supabase = createClient()
    try {
      await supabase.from('task_items').insert({
        post_id: postId,
        label: newLabel.trim(),
        position: items.length,
      })
      setNewLabel('')
      setShowInput(false)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-1.5">
      {sorted.map(item => (
        <div key={item.id} className="flex items-start gap-2">
          <Checkbox
            checked={item.checked}
            onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
            className="mt-0.5 shrink-0"
          />
          <span
            className={cn(
              'text-sm text-jk-text leading-tight',
              item.checked && 'line-through text-jk-text-faint'
            )}
          >
            {item.label}
          </span>
        </div>
      ))}

      {showInput ? (
        <form onSubmit={handleAddTask} className="flex gap-1.5 mt-2">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Add task…"
            autoFocus
            className="flex-1 text-sm bg-jk-surface-offset rounded px-2 py-1 outline-none text-jk-text placeholder:text-jk-text-faint"
            onKeyDown={e => { if (e.key === 'Escape') setShowInput(false) }}
          />
          <button type="submit" disabled={adding} className="text-xs text-jk-accent font-medium px-1">Add</button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1 text-xs text-jk-text-faint hover:text-jk-accent transition-colors mt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add task
        </button>
      )}
    </div>
  )
}
