'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { Image as ImageIcon, X } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getAvatarColor } from '@/lib/avatar-color'
import type { PostWithRelations, Profile } from '@/lib/supabase/types'

interface ReplyBubbleProps {
  currentProfile: Profile | null
  currentUserId: string
  posts?: PostWithRelations[]
  width?: number
  onSave: (data: { content: string; imageFile?: File | null }) => void
  onDiscard: () => void
}

export function ReplyBubble({ currentProfile, currentUserId, posts = [], width = 200, onSave, onDiscard }: ReplyBubbleProps) {
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [linkSearch, setLinkSearch] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const authorColor = getAvatarColor(currentUserId)
  const displayName = currentProfile?.display_name ?? 'You'
  const initials = displayName[0]?.toUpperCase() ?? '?'

  const linkMatches = linkSearch !== null
    ? posts.filter(p => {
        if (p.reply_to_post_id) return false
        const hay = (p.title || p.content || '').toLowerCase()
        return linkSearch === '' || hay.includes(linkSearch.toLowerCase())
      }).slice(0, 5)
    : []

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview) }
  }, [imagePreview])

  const handleSave = useCallback(() => {
    if (!content.trim() && !imageFile) { onDiscard(); return }
    onSave({ content: content.trim(), imageFile })
  }, [content, imageFile, onSave, onDiscard])

  // Use capture so this fires before any stopPropagation in the comment bubble container
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleSave()
      }
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  })

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setContent(val)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = `${ta.scrollHeight}px`
    const caret = e.target.selectionStart ?? val.length
    const before = val.slice(0, caret)
    const match = before.match(/\[\[([^\]]*)$/)
    setLinkSearch(match ? match[1] : null)
  }

  function insertLink(post: PostWithRelations) {
    const ta = textareaRef.current
    if (!ta) return
    const caret = ta.selectionStart ?? content.length
    const before = content.slice(0, caret)
    const after = content.slice(caret)
    const newBefore = before.replace(/\[\[[^\]]*$/, `[[${post.id}]] `)
    setContent(newBefore + after)
    setLinkSearch(null)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = newBefore.length
      ta.setSelectionRange(pos, pos)
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (linkSearch !== null) { setLinkSearch(null); return }
      onDiscard()
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function removeImage() {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div
      ref={containerRef}
      data-comment-bubble
      className="relative overflow-visible rounded-2xl rounded-tl-none bg-background shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.18),0px_3px_8px_0px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
      style={{ width }}
      onKeyDown={handleKeyDown}
      onPointerDown={e => e.stopPropagation()}
    >
      {/* Avatar — matches FigmaComment position exactly */}
      <div className="absolute left-3 top-3 z-10">
        <Avatar className="h-6 w-6">
          <AvatarImage src={currentProfile?.avatar_url ?? undefined} alt={displayName} />
          <AvatarFallback style={{ backgroundColor: authorColor, color: 'white', fontSize: '10px', fontWeight: 700 }}>
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>

      <div className="flex flex-col gap-0.5 py-3 pr-4 pl-11">
        {/* Author + timestamp row — matches FigmaComment layout */}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-[11px] text-foreground leading-4">{displayName}</span>
          <span className="font-medium text-[11px] text-muted-foreground leading-4">Just now</span>
        </div>

        {/* Textarea — same font/size as FigmaComment message */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Comment…"
            rows={1}
            className="w-full text-left font-medium text-[11px] text-foreground leading-4 bg-transparent outline-none resize-none placeholder:text-muted-foreground/50 overflow-hidden"
            style={{ minHeight: '16px' }}
          />

          {linkSearch !== null && (
            <div
              className="absolute left-0 bottom-full mb-1 bg-jk-surface border border-jk-border rounded-xl shadow-lg z-50 overflow-hidden"
              style={{ width: '160px' }}
            >
              {linkMatches.length > 0 ? (
                linkMatches.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={e => { e.preventDefault(); insertLink(p) }}
                    className="w-full flex items-center gap-1.5 px-2 py-1.5 text-left hover:bg-jk-surface-offset transition-colors"
                  >
                    <span className="text-[9px] text-jk-text-faint capitalize shrink-0">{p.type}</span>
                    <span className="text-[10px] truncate text-jk-text">{p.title || p.content?.slice(0, 30) || 'Untitled'}</span>
                  </button>
                ))
              ) : (
                <div className="px-2 py-1.5 text-[10px] text-jk-text-faint">No posts found</div>
              )}
            </div>
          )}
        </div>

        {imagePreview && (
          <div className="relative mt-1">
            <img src={imagePreview} alt="" className="w-full rounded-lg object-cover" style={{ maxHeight: '120px' }} />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </div>
        )}

        {/* Image attach — subtle, bottom-right */}
        <div className="flex justify-end mt-0.5">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            title="Attach image"
          >
            <ImageIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
