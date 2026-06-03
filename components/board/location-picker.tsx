'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
import type { MapLocation } from '@/lib/supabase/types'

interface LocationPickerProps {
  onSelect: (location: MapLocation) => void
  onClose: () => void
}

interface GeoFeature {
  id: string
  text: string
  place_name: string
  center: [number, number]
}

export function LocationPicker({ onSelect, onClose }: LocationPickerProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoFeature[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (query.length < 3) { setResults([]); return }
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=5`
        )
        const data = await res.json()
        setResults(data.features ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1.5 rounded-xl bg-[#f0ede8] px-2.5 py-1.5">
        <MapPin className="w-3.5 h-3.5 text-[#b0afa9] shrink-0" />
        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for a location…"
          className="flex-1 text-xs text-[#1c1b19] bg-transparent outline-none placeholder:text-[#b0afa9]"
        />
        {loading
          ? <Loader2 className="w-3 h-3 text-[#b0afa9] animate-spin shrink-0" />
          : <button type="button" onClick={onClose} className="text-[#b0afa9] hover:text-[#6b6a67] transition-colors"><X className="w-3 h-3" /></button>
        }
      </div>

      {results.length > 0 && (
        <div className="mt-1 rounded-xl border border-[#e5e2dc] bg-white shadow-sm overflow-hidden">
          {results.map(feature => (
            <button
              key={feature.id}
              type="button"
              onClick={() => {
                const [lng, lat] = feature.center
                onSelect({ lat, lng, label: feature.place_name })
              }}
              className="w-full text-left px-3 py-2 text-xs text-[#1c1b19] hover:bg-[#f0ede8] transition-colors border-b border-[#f0ede8] last:border-0"
            >
              <span className="font-medium">{feature.text}</span>
              <span className="text-[#b0afa9] ml-1 truncate">
                {feature.place_name.replace(feature.text, '').replace(/^,\s*/, '')}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
