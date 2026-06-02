'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2, Shuffle } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { errMsg } from '@/lib/error'
import { getAvatarColor } from '@/lib/avatar-color'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Profile } from '@/lib/supabase/types'

interface ProfileModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: Profile | null
  onUpdated: (profile: Profile) => void
}

export function ProfileModal({ open, onOpenChange, profile, onUpdated }: ProfileModalProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authorColor = getAvatarColor(profile?.id ?? '')

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploading(true)
    const supabase = createClient()
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      // Bust cache with timestamp
      const url = `${data.publicUrl}?t=${Date.now()}`
      setAvatarUrl(url)
    } catch (err) {
      toast.error(errMsg(err, 'Failed to upload image'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleRandomAvatar() {
    if (!profile) return
    setUploading(true)
    const supabase = createClient()
    try {
      const res = await fetch('/api/random-avatar')
      if (!res.ok) throw new Error('Failed to fetch avatar')
      const blob = await res.blob()
      const path = `${profile.id}/avatar.webp`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(`${data.publicUrl}?t=${Date.now()}`)
    } catch (err) {
      toast.error(errMsg(err, 'Failed to fetch random avatar'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!profile || !displayName.trim()) return
    setSaving(true)
    const supabase = createClient()
    try {
      const updates = {
        display_name: displayName.trim(),
        avatar_url: avatarUrl,
      }
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      onUpdated({ ...profile, ...updates })
      toast.success('Profile updated ✓')
      onOpenChange(false)
    } catch (err) {
      toast.error(errMsg(err, 'Failed to save profile'))
    } finally {
      setSaving(false)
    }
  }

  const initials = displayName?.[0]?.toUpperCase() ?? profile?.display_name?.[0]?.toUpperCase() ?? '?'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="relative group"
            >
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-md"
                style={{ backgroundColor: authorColor }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {uploading
                  ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                  : <Camera className="w-5 h-5 text-white" />
                }
              </div>
            </button>
            <p className="text-xs text-[var(--jk-text-muted)]">Click to upload a photo</p>
            <button
              type="button"
              onClick={handleRandomAvatar}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-[var(--jk-accent)] hover:underline disabled:opacity-50"
            >
              <Shuffle className="w-3 h-3" />
              Random avatar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Display name */}
          <div className="space-y-1.5">
            <Label htmlFor="display-name">Display name</Label>
            <Input
              id="display-name"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            />
          </div>

          {/* Username (read-only) */}
          {profile?.username && (
            <div className="space-y-1.5">
              <Label className="text-[var(--jk-text-muted)]">Username</Label>
              <p className="text-sm text-[var(--jk-text-muted)] font-mono">@{profile.username}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !displayName.trim()}
              className="bg-[var(--jk-accent)] hover:bg-sky-400 text-white"
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
