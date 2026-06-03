'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { errMsg } from '@/lib/error'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface CreateBoardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateBoardModal({ open, onOpenChange }: CreateBoardModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: board, error } = await supabase
        .from('boards')
        .insert({ name: name.trim(), owner_id: user.id })
        .select()
        .single()

      if (error) throw error

      await supabase.from('board_members').insert({
        board_id: board.id,
        user_id: user.id,
        role: 'owner',
      })

      toast.success(`Board "${board.name}" created`)
      onOpenChange(false)
      setName('')
      router.push(`/board/${board.id}`)
      router.refresh()
    } catch (err: unknown) {
      toast.error(errMsg(err, 'Failed to create board'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create a new board</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="board-name">Board name</Label>
            <Input
              id="board-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Family Board"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="bg-jk-accent hover:bg-sky-400 text-white"
            >
              {loading ? 'Creating…' : 'Create board'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
