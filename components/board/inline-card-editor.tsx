'use client'

import { useEffect, useRef, useState } from 'react'
import { CornerUpLeft, Image, MapPin, X } from 'lucide-react'
import { getAvatarColor } from '@/lib/avatar-color'
import { getMapImageUrl } from '@/lib/mapbox'
import { cn } from '@/lib/utils'
import type { MapLocation, PostType, Profile } from '@/lib/supabase/types'
import { LocationPicker } from '@/components/board/location-picker'

const TYPE_OPTIONS: { value: PostType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'question', label: 'Question' },
]

interface InlineCardEditorProps {
  x: number
  y: number
  rotation: number
  currentProfile: Profile | null
  currentUserId: string
  replyTo?: { postId: string; authorName: string } | null
  onSave: (data: { type: PostType; title: string; content: string; imageFile?: File | null; mapLocation?: MapLocation | null }) => void
  onDiscard: () => void
}

export function InlineCardEditor({
  x, y, rotation, currentProfile, currentUserId, replyTo, onSave, onDiscard
}: InlineCardEditorProps) {
  const [type, setType] = useState<PostType>('note')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [mapLocation, setMapLocation] = useState<MapLocation | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authorColor = getAvatarColor(currentUserId)

  useEffect(() => {
    return () => { if (imagePreview) URL.revokeObjectURL(imagePreview) }
  }, [imagePreview])

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // Click-outside to save
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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { onDiscard(); return }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { handleSave(); return }
  }

  return (
    <div
      ref={cardRef}
      className="absolute w-72 bg-white rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.16)] z-50 ring-2 ring-[#0ea5e9]/40"
      style={{ left: x, top: y, transform: `rotate(${rotation}deg)` }}
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

      <div className="p-5 pt-6 space-y-2">
        {/* Reply-to banner */}
        {replyTo && (
          <div className="flex items-center gap-1.5 pb-1 text-[11px] text-[#b0afa9]">
            <CornerUpLeft className="w-3 h-3 shrink-0" />
            <span>Replying to <span className="font-medium text-[#6b6a67]">{replyTo.authorName}</span></span>
          </div>
        )}
        {/* Type selector + image button */}
        <div className="flex items-center gap-1.5 mb-3">
          {TYPE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
                type === opt.value
                  ? 'bg-[#1c1b19] text-white'
                  : 'bg-[#f0ede8] text-[#6b6a67] hover:bg-[#e5e2dc]'
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
                imageFile ? 'text-jk-accent' : 'text-[#b0afa9] hover:text-[#6b6a67]'
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
                mapLocation ? 'text-jk-accent' : 'text-[#b0afa9] hover:text-[#6b6a67]'
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
          className="w-full font-bold text-sm text-[#1c1b19] outline-none placeholder:text-[#b0afa9] bg-transparent"
        />

        {/* Content */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            type === 'tasks'
              ? 'One task per line…'
              : type === 'question'
              ? 'Add more detail…'
              : 'Write something…'
          }
          rows={3}
          className="w-full text-sm text-[#6b6a67] outline-none resize-none placeholder:text-[#b0afa9] bg-transparent"
        />

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
              <MapPin className="w-3 h-3 text-[#ee4444] shrink-0" />
              <span className="text-[10px] text-[#1c1b19] truncate flex-1">{mapLocation.label}</span>
              <button
                type="button"
                onClick={() => setMapLocation(null)}
                className="text-[#b0afa9] hover:text-[#6b6a67] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Hint */}
        <p className="text-[10px] text-[#b0afa9] pt-1">
          ⌘↵ to save · Esc to discard · click away to save
        </p>
      </div>
    </div>
  )
}
