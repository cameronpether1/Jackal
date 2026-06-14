'use client'

import { useRef, useCallback, useState, useEffect, useId, useMemo, CSSProperties } from 'react'
import { Trash2 } from 'lucide-react'
import { gsap } from 'gsap'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'

interface StickerPeelProps {
  imageSrc: string
  posX: number
  posY: number
  createdBy: string
  currentUserId: string
  isBoardOwner?: boolean
  onDragEnd: (x: number, y: number) => void
  onDelete: () => void
  rotate?: number
  peelBackHoverPct?: number
  peelBackActivePct?: number
  width?: number
  shadowIntensity?: number
  lightingIntensity?: number
  peelDirection?: number
}

interface CSSVars extends CSSProperties {
  '--sticker-rotate'?: string
  '--sticker-p'?: string
  '--sticker-peelback-hover'?: string
  '--sticker-peelback-active'?: string
  '--sticker-width'?: string
  '--sticker-shadow-opacity'?: number
  '--sticker-lighting-constant'?: number
  '--peel-direction'?: string
  '--sticker-start'?: string
  '--sticker-end'?: string
}

export function StickerPeel({
  imageSrc,
  posX,
  posY,
  createdBy,
  currentUserId,
  isBoardOwner = false,
  onDragEnd,
  onDelete,
  rotate = 30,
  peelBackHoverPct = 10,
  peelBackActivePct = 70,
  width = 120,
  shadowIntensity = 0.6,
  lightingIntensity = 0.47,
  peelDirection = 27,
}: StickerPeelProps) {
  const [pos, setPos] = useState({ x: posX, y: posY })
  const [isDragging, setIsDragging] = useState(false)
  const [dragRotation, setDragRotation] = useState(0)
  const dragState = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number; lastClientX: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const outerRef = useRef<HTMLDivElement>(null)
  const pointLightRef = useRef<SVGFEPointLightElement>(null)
  const pointLightFlippedRef = useRef<SVGFEPointLightElement>(null)

  // useId() produces the same value on server and client — no hydration mismatch.
  // Strip colons so it's safe in CSS selectors and SVG id attributes.
  const uid = useId().replace(/:/g, '')
  const defaultPadding = 12

  // Drag via pointer events (same pattern as PostCard, works in scaled canvas)
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    e.preventDefault()
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    dragState.current = {
      startX: e.clientX, startY: e.clientY,
      startPosX: pos.x, startPosY: pos.y,
      lastClientX: e.clientX,
    }
    setIsDragging(true)
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const deltaX = e.clientX - dragState.current.lastClientX
    dragState.current.lastClientX = e.clientX
    setDragRotation(r => Math.max(-20, Math.min(20, r + deltaX * 0.35)))
    setPos({
      x: dragState.current.startPosX + (e.clientX - dragState.current.startX),
      y: dragState.current.startPosY + (e.clientY - dragState.current.startY),
    })
  }, [])

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current) return
    const newX = dragState.current.startPosX + (e.clientX - dragState.current.startX)
    const newY = dragState.current.startPosY + (e.clientY - dragState.current.startY)
    dragState.current = null
    setIsDragging(false)
    setDragRotation(0)
    onDragEnd(newX, newY)
  }, [onDragEnd])

  // SVG point-light follows cursor for the peel lighting effect
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateLight = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (pointLightRef.current) gsap.set(pointLightRef.current, { attr: { x, y } })
      const normalizedAngle = Math.abs(peelDirection % 360)
      if (pointLightFlippedRef.current) {
        if (normalizedAngle !== 180) {
          gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } })
        } else {
          gsap.set(pointLightFlippedRef.current, { attr: { x: -1000, y: -1000 } })
        }
      }
    }

    container.addEventListener('mousemove', updateLight)
    return () => container.removeEventListener('mousemove', updateLight)
  }, [peelDirection])

  // Touch-active class for mobile peel trigger
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const add = () => container.classList.add('touch-active')
    const remove = () => container.classList.remove('touch-active')
    container.addEventListener('touchstart', add)
    container.addEventListener('touchend', remove)
    container.addEventListener('touchcancel', remove)
    return () => {
      container.removeEventListener('touchstart', add)
      container.removeEventListener('touchend', remove)
      container.removeEventListener('touchcancel', remove)
    }
  }, [])

  const cssVars: CSSVars = useMemo(() => ({
    '--sticker-rotate': `${rotate}deg`,
    '--sticker-p': `${defaultPadding}px`,
    '--sticker-peelback-hover': `${peelBackHoverPct}%`,
    '--sticker-peelback-active': `${peelBackActivePct}%`,
    '--sticker-width': `${width}px`,
    '--sticker-shadow-opacity': shadowIntensity,
    '--sticker-lighting-constant': lightingIntensity,
    '--peel-direction': `${peelDirection}deg`,
    '--sticker-start': `calc(-1 * ${defaultPadding}px)`,
    '--sticker-end': `calc(100% + ${defaultPadding}px)`,
  }), [rotate, peelBackHoverPct, peelBackActivePct, width, shadowIntensity, lightingIntensity, peelDirection])

  const stickerMainStyle: CSSProperties = {
    clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end))`,
    transition: 'clip-path 0.6s ease-out',
    filter: `url(#${uid}-dropShadow)`,
    willChange: 'clip-path, transform',
  }

  const flapStyle: CSSProperties = {
    clipPath: `polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-start) var(--sticker-start))`,
    top: `calc(-100% - var(--sticker-p) - var(--sticker-p))`,
    transform: 'scaleY(-1)',
    transition: 'all 0.6s ease-out',
    willChange: 'clip-path, transform',
  }

  const imageStyle: CSSProperties = {
    transform: `rotate(calc(${rotate}deg - ${peelDirection}deg))`,
    width: `${width}px`,
  }

  const shadowImageStyle: CSSProperties = {
    ...imageStyle,
    filter: `url(#${uid}-expandAndFill)`,
  }

  const isCreator = createdBy === currentUserId
  const canDelete = isCreator || isBoardOwner

  const stickerEl = (
    <div
      ref={outerRef}
      className="absolute select-none"
      style={{
        left: pos.x,
        top: pos.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: `rotate(${dragRotation}deg)`,
        transition: isDragging ? 'none' : 'transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        touchAction: 'none',
        zIndex: isDragging ? 50 : 30,
        ...cssVars,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Per-instance hover CSS scoped to this sticker's uid */}
      <style dangerouslySetInnerHTML={{ __html: `
        [data-sticker-uid="${uid}"].sticker-container:hover .sticker-main,
        [data-sticker-uid="${uid}"].sticker-container.touch-active .sticker-main {
          clip-path: polygon(var(--sticker-start) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
        }
        [data-sticker-uid="${uid}"].sticker-container:hover .sticker-flap,
        [data-sticker-uid="${uid}"].sticker-container.touch-active .sticker-flap {
          clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-hover), var(--sticker-start) var(--sticker-peelback-hover)) !important;
          top: calc(-100% + 2 * var(--sticker-peelback-hover) - 1px) !important;
        }
        [data-sticker-uid="${uid}"].sticker-container:active .sticker-main {
          clip-path: polygon(var(--sticker-start) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-end) var(--sticker-end), var(--sticker-start) var(--sticker-end)) !important;
        }
        [data-sticker-uid="${uid}"].sticker-container:active .sticker-flap {
          clip-path: polygon(var(--sticker-start) var(--sticker-start), var(--sticker-end) var(--sticker-start), var(--sticker-end) var(--sticker-peelback-active), var(--sticker-start) var(--sticker-peelback-active)) !important;
          top: calc(-100% + 2 * var(--sticker-peelback-active) - 1px) !important;
        }
      ` }} />

      <svg width="0" height="0" aria-hidden>
        <defs>
          <filter id={`${uid}-pointLight`}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity} lightingColor="white">
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={`${uid}-pointLightFlipped`}>
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity * 7} lightingColor="white">
              <fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={`${uid}-dropShadow`}>
            <feDropShadow dx="2" dy="4" stdDeviation={3 * shadowIntensity} floodColor="black" floodOpacity={shadowIntensity} />
          </filter>
          <filter id={`${uid}-expandAndFill`}>
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      <div
        ref={containerRef}
        className="sticker-container relative"
        data-sticker-uid={uid}
        style={{
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTouchCallout: 'none',
          WebkitTapHighlightColor: 'transparent',
          transform: `rotate(${peelDirection}deg)`,
          transformOrigin: 'center',
        }}
      >
        <div className="sticker-main" style={stickerMainStyle}>
          <div style={{ filter: `url(#${uid}-pointLight)` }}>
            <img src={imageSrc} alt="" className="block" style={imageStyle} draggable={false} onContextMenu={e => e.preventDefault()} />
          </div>
        </div>

        {/* Shadow cast by peel flap */}
        <div className="absolute top-4 left-2 w-full h-full opacity-40" style={{ filter: 'brightness(0) blur(8px)' }}>
          <div className="sticker-flap" style={flapStyle}>
            <img src={imageSrc} alt="" className="block" style={shadowImageStyle} draggable={false} onContextMenu={e => e.preventDefault()} />
          </div>
        </div>

        {/* Peel flap with lighting */}
        <div className="sticker-flap absolute w-full h-full left-0" style={flapStyle}>
          <div style={{ filter: `url(#${uid}-pointLightFlipped)` }}>
            <img src={imageSrc} alt="" className="block" style={shadowImageStyle} draggable={false} onContextMenu={e => e.preventDefault()} />
          </div>
        </div>
      </div>
    </div>
  )

  if (!canDelete) return stickerEl

  return (
    <ContextMenu>
      <ContextMenuTrigger>{stickerEl}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="w-4 h-4 mr-2" /> Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
