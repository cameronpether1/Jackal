'use client'

import { useEffect, useRef, useState } from 'react'
import { CornerUpLeft, Image, MapPin, X, Check } from 'lucide-react'
import { getAvatarColor } from '@/lib/avatar-color'
import { getMapImageUrl } from '@/lib/mapbox'
import { cn } from '@/lib/utils'
import type { MapLocation, PostType, PostWithRelations, Profile } from '@/lib/supabase/types'
import { LocationPicker } from '@/components/board/location-picker'

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'question', label: 'Question' },
]

const TYPE_ACTIVE_CLASS: Record<PostType, string> = {
  note: 'bg-[#86d3fa]/30 text-[#1a5a7a]',
  tasks: 'bg-[#faad86]/30 text-[#7a3a10]',
  question: 'bg-[#86fa96]/30 text-[#1a6a30]',
}

interface InlineCardEditorProps {
  x: number
  y: number
  rotation: number
  currentProfile: Profile | null
  currentUserId: string
  replyTo?: { postId: string; authorName: string } | null
  posts?: PostWithRelations[]
  onSave: (data: { type: PostType; title: string; content: string; imageFile?: File | null; mapLocation?: MapLocation | null }) => void
  onDiscard: () => void
}

export function InlineCardEditor({
  x, y, rotation, currentProfile, currentUserId, replyTo, posts = [], onSave, onDiscard
}: InlineCardEditorProps) {
  const [type, setType] = useState<PostType>('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [linkSearch, setLinkSearch] = useState<string | null>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const linkMatches = linkSearch !== null
    ? posts.filter(p => {
        if (p.reply_to_post_id) return false
        const hay = (p.title || p.content || '').toLowerCase()
        return linkSearch === '' || hay.includes(linkSearch.toLowerCase())
      }).slice(0, 5)
    : []

  function insertLink(post: PostWithRelations) {
    const ta = contentRef.current
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
  const authorColor = getAvatarColor(currentUserId)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview) }
  }, [imagePreview])

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Click/touch-outside to save
  useEffect(() => {
    function handlePointerDown(e: PointerEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleSave()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  })

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

  function handleSave() {
    if (!title.trim() && !content.trim() && !imageFile && !mapLocation) { onDiscard(); return }
    onSave({ type, title: title.trim(), content: content.trim(), imageFile, mapLocation })
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setContent(val)
    const caret = e.target.selectionStart ?? val.length
    const before = val.slice(0, caret)
    const match = before.match(/\[\[([^\]]*)$/)
    setLinkSearch(match ? match[1] : null)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (linkSearch !== null) { setLinkSearch(null); return }
      onDiscard(); return
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { handleSave(); return }
  }

  const formContent = (
    <div className={cn('space-y-2', isMobile ? 'px-4 pt-2 pb-4' : 'p-5 pt-6')}>
      {/* Reply-to banner */}
      {replyTo && (
        <div className="flex items-center gap-1.5 pb-1 text-[11px] text-jk-text-faint tracking-wide">
          <CornerUpLeft className="w-3 h-3 shrink-0" />
          <span>Replying to <span className="font-medium text-jk-text-muted">{replyTo.authorName}</span></span>
        </div>
      )}

      {/* Type selector + image/map buttons */}
      <div className="flex items-center gap-1.5 mb-3">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={cn(
              'text-xs px-2.5 py-1 rounded-full font-medium tracking-wide transition-colors',
              isMobile ? 'px-3 py-1.5' : '',
              type === opt.value ? TYPE_ACTIVE_CLASS[opt.value] : 'bg-jk-surface-offset text-jk-text-muted hover:bg-jk-border',
            )}
          >
            {opt.label}
          </button>
        ))}
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'p-1.5 rounded-full transition-colors',
              isMobile ? 'p-2' : '',
              imageFile ? 'text-jk-accent' : 'text-jk-text-faint hover:text-jk-text-muted',
            )}
            title="Add image"
          >
            <Image className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowLocationPicker(v => !v)}
            className={cn(
              'p-1.5 rounded-full transition-colors',
              isMobile ? 'p-2' : '',
              mapLocation ? 'text-jk-accent' : 'text-jk-text-faint hover:text-jk-text-muted',
            )}
            title="Add location"
          >
            <MapPin className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <input
        ref={titleRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={type === 'tasks' ? 'Tasks' : type === 'question' ? 'Your question…' : 'Title'}
        className={cn(
          'w-full font-bold text-[0.9375rem] text-jk-text outline-none placeholder:text-jk-text-faint bg-transparent',
          isMobile && 'text-base',
        )}
      />

      {/* Content */}
      <div className="relative">
        <textarea
          ref={contentRef}
          value={content}
          onChange={handleContentChange}
          placeholder={
            type === 'tasks' ? 'One task per line…'
            : type === 'question' ? 'Add more detail…'
            : 'Write something… (type [[ to link a post)'
          }
          rows={isMobile ? 4 : 3}
          className={cn(
            'w-full text-sm text-jk-text-muted outline-none resize-none placeholder:text-jk-text-faint bg-transparent',
            isMobile && 'text-base leading-relaxed',
          )}
        />
        {linkSearch !== null && linkMatches.length > 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-jk-surface border border-jk-border rounded-2xl shadow-lg z-50 overflow-hidden">
            {linkMatches.map(p => (
              <button
                key={p.id}
                type="button"
                onMouseDown={e => { e.preventDefault(); insertLink(p) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-jk-surface-offset transition-colors"
              >
                <span className="text-[10px] text-jk-text-faint capitalize tracking-wide shrink-0">{p.type}</span>
                <span className="truncate text-jk-text">{p.title || p.content?.slice(0, 40) || 'Untitled'}</span>
              </button>
            ))}
          </div>
        )}
        {linkSearch !== null && linkMatches.length === 0 && (
          <div className="absolute left-0 right-0 bottom-full mb-1 bg-jk-surface border border-jk-border rounded-2xl shadow-lg z-50 px-3 py-2 text-xs text-jk-text-faint">
            No posts found
          </div>
        )}
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="relative mt-1">
          <img src={imagePreview} alt="" className="w-full rounded-2xl object-cover max-h-36" />
          <button
            type="button"
            onClick={removeImage}
            className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Location picker */}
      {showLocationPicker && !mapLocation && (
        <LocationPicker
          onSelect={loc => { setMapLocation(loc); setShowLocationPicker(false) }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}

      {/* Map preview */}
      {mapLocation && (
        <div className="relative mt-1 rounded-2xl overflow-hidden">
          <img
            src={getMapImageUrl(mapLocation.lat, mapLocation.lng)}
            alt={mapLocation.label}
            className="w-full"
            draggable={false}
          />
          <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-sm px-2.5 py-1.5 flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-destructive shrink-0" />
            <span className="text-[10px] text-jk-text tracking-wide truncate flex-1">{mapLocation.label}</span>
            <button
              type="button"
              onClick={() => setMapLocation(null)}
              className="text-jk-text-faint hover:text-jk-text-muted transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Hint / Save button */}
      {isMobile ? (
        <button
          type="button"
          onClick={handleSave}
          className="w-full mt-1 h-11 rounded-xl bg-jk-accent text-white text-sm font-semibold flex items-center justify-center gap-2 transition-opacity active:opacity-80"
        >
          <Check className="w-4 h-4" />
          Save post
        </button>
      ) : (
        <p className="text-[10px] text-jk-text-faint tracking-wide pt-1">
          ⌘↵ to save · Esc to discard · click away to save
        </p>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <div
        ref={cardRef}
        className="fixed inset-x-0 z-[60] border-t border shadow-[0_-8px_32px_rgba(0,0,0,0.14)] rounded-t-3xl overflow-hidden"
        style={{ bottom: 0, paddingBottom: 'env(safe-area-inset-bottom)', backgroundColor: '#F4F4F4', borderColor: 'rgba(0,0,0,0.08)' }}
        onKeyDown={handleKeyDown}
      >
        {/* Drag handle indicator */}
        <div className="w-10 h-1 rounded-full bg-jk-border mx-auto mt-3 mb-0" />
        {formContent}
      </div>
    )
  }

  return (
    <div
      ref={cardRef}
      className="absolute w-72 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.16)] z-50 ring-2 ring-jk-accent/40 border"
      style={{ left: x, top: y, transform: `rotate(${rotation}deg)`, backgroundColor: '#F4F4F4', borderColor: 'rgba(0,0,0,0.08)' }}
      onKeyDown={handleKeyDown}
    >
      {/* Author badge */}
      <div className="absolute -top-5 -right-5 group z-10">
        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
          <span className="bg-[#1c1b19] text-white text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap shadow-sm">
            {currentProfile?.display_name ?? 'You'}
          </span>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ring-[3px] ring-white overflow-hidden shadow-md"
          style={{ backgroundColor: authorColor }}
        >
          {currentProfile?.avatar_url
            ? <img src={currentProfile.avatar_url} alt="" className="w-full h-full object-cover" />
            : currentProfile?.display_name?.[0]?.toUpperCase() ?? '?'}
        </div>
      </div>
      {formContent}
    </div>
  )
}
