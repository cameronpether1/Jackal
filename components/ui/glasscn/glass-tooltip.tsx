"use client";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { FrostGlassVariantProp, glassVariantStyles } from "@/lib/glass-variants";
import { cn } from "@/lib/utils";

import { TooltipContent } from "../tooltip";
import { LiquidGlass } from "./liquid-glass";

type GlassTooltipContentProps = TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset"> &
  FrostGlassVariantProp;

function GlassTooltipContent({
  className,
  glassVariant = "liquid-refract",
  side = "top",
  sideOffset = 6,
  align = "start",
  alignOffset = 0,
  children,
  ...props
}: GlassTooltipContentProps) {
  if (glassVariant === "liquid-refract") {
    return (
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={side}
          sideOffset={sideOffset}
          align={align}
          alignOffset={alignOffset}
          className="isolate z-50"
        >
          <LiquidGlass className="rounded-xl">
            <TooltipPrimitive.Popup
              data-slot="glass-tooltip-content"
              data-glass-variant={glassVariant}
              className={cn(
                "z-50 flex w-auto origin-(--transform-origin) flex-col bg-transparent p-2.5 text-sm text-foreground shadow-none outline-hidden ring-0 duration-100",
                "data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95",
                "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
                className,
              )}
              {...props}
            >
              {children}
            </TooltipPrimitive.Popup>
          </LiquidGlass>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    );
  }

  return (
    <TooltipContent
      data-slot="glass-tooltip-content"
      data-glass-variant={glassVariant}
      className={cn("text-foreground", glassVariantStyles[glassVariant], className)}
      side={side}
      sideOffset={sideOffset}
      align={align}
      alignOffset={alignOffset}
      {...props}
    >
      {children}
    </TooltipContent>
  );
}

export { GlassTooltipContent };
