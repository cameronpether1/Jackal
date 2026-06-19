"use client"

import * as React from "react"
import { ContextMenu as ContextMenuPrimitive } from "@base-ui/react/context-menu"

import { cn } from "@/lib/utils"
import { LiquidGlass } from "./liquid-glass"

type GlassContextMenuContentProps = {
  className?: string
  align?: ContextMenuPrimitive.Positioner.Props["align"]
  alignOffset?: number
  side?: ContextMenuPrimitive.Positioner.Props["side"]
  sideOffset?: number
  children?: React.ReactNode
}

function GlassContextMenuContent({
  className,
  align = "start",
  alignOffset = 4,
  side = "bottom",
  sideOffset = 4,
  children,
}: GlassContextMenuContentProps) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <LiquidGlass
          className="rounded-xl"
          style={{
            "--color-accent": "rgba(255,255,255,0.55)",
            "--color-accent-foreground": "#000000",
          } as React.CSSProperties}
        >
          <ContextMenuPrimitive.Popup
            data-slot="context-menu-content"
            className={cn(
              "z-50 max-h-(--available-height) min-w-36 origin-(--transform-origin) overflow-x-hidden overflow-y-auto rounded-xl p-1 bg-transparent shadow-none ring-0 text-foreground duration-100 outline-none",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
              className,
            )}
          >
            {children}
          </ContextMenuPrimitive.Popup>
        </LiquidGlass>
      </ContextMenuPrimitive.Positioner>
    </ContextMenuPrimitive.Portal>
  )
}

export { GlassContextMenuContent }
