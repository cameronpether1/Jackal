'use client'

import * as HoverCardPrimitive from '@radix-ui/react-hover-card'
import Image from 'next/image'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LinkPreviewProps {
  children: React.ReactNode
  url: string
  className?: string
  width?: number
  height?: number
  quality?: number
}

export function LinkPreview({
  children,
  url,
  className,
  width = 200,
  height = 125,
  quality = 50,
}: LinkPreviewProps) {
  const params = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    colorScheme: 'dark',
    'viewport.isMobile': 'true',
    'viewport.deviceScaleFactor': '1',
    'viewport.width': String(width * 3),
    'viewport.height': String(height * 3),
  })
  const src = `https://api.microlink.io/?${params}`

  const [isOpen, setOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => { setIsMounted(true) }, [])

  const x = useMotionValue(0)
  const translateX = useSpring(x, { stiffness: 100, damping: 15 })

  const handleMouseMove = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect()
    x.set((event.clientX - rect.left - rect.width / 2) / 2)
  }

  return (
    <>
      {isMounted && (
        <span className="hidden">
          <Image src={src} width={width} height={height} quality={quality} priority alt="" />
        </span>
      )}
      <HoverCardPrimitive.Root openDelay={50} closeDelay={100} onOpenChange={setOpen}>
        <HoverCardPrimitive.Trigger asChild>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('text-blue-500 hover:underline break-all', className)}
            onMouseMove={handleMouseMove}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {children}
          </a>
        </HoverCardPrimitive.Trigger>
        <HoverCardPrimitive.Portal>
        <HoverCardPrimitive.Content
          className="z-[200]"
          side="top"
          align="center"
          sideOffset={10}
        >
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 20 } }}
                exit={{ opacity: 0, y: 20, scale: 0.6 }}
                className="shadow-xl rounded-xl"
                style={{ x: translateX }}
              >
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-1 bg-white border-2 border-transparent shadow rounded-xl hover:border-neutral-200"
                  style={{ fontSize: 0 }}
                >
                  <Image
                    src={src}
                    width={width}
                    height={height}
                    quality={quality}
                    priority
                    className="rounded-lg"
                    alt="link preview"
                  />
                </a>
              </motion.div>
            )}
          </AnimatePresence>
        </HoverCardPrimitive.Content>
        </HoverCardPrimitive.Portal>
      </HoverCardPrimitive.Root>
    </>
  )
}
