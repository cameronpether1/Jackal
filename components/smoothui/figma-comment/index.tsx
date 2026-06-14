"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { useClickOutside } from "./use-click-outside";

const CLOSED_SIZE = 32;
const AVATAR_CLOSED_LEFT = 4;
const AVATAR_CLOSED_TOP = 4;
const AVATAR_OPEN_LEFT = 12;
const AVATAR_OPEN_TOP = 12;
const CONTENT_DELAY = 0.15;
const INITIAL_BLUR_PX = 6;
const EXIT_BLUR_PX = 3;
const MEASURE_DELAY_SHORT = 100;
const MEASURE_DELAY_LONG = 500;
const CONTAINER_CLOSE_DELAY = 0.08;
const BLUR_EASE_X1 = 0.22;
const BLUR_EASE_Y1 = 1;
const BLUR_EASE_X2 = 0.36;
const BLUR_EASE_Y2 = 1;
const BLUR_EASE: [number, number, number, number] = [
  BLUR_EASE_X1,
  BLUR_EASE_Y1,
  BLUR_EASE_X2,
  BLUR_EASE_Y2,
];

export interface FigmaCommentProps {
  authorName?: string;
  avatarAlt?: string;
  avatarUrl?: string;
  avatarColor?: string;
  className?: string;
  imageUrl?: string;
  message?: string;
  messageNode?: React.ReactNode;
  onOpenChange?: (isOpen: boolean) => void;
  onDelete?: () => void;
  canDelete?: boolean;
  timestamp?: string;
  width?: number;
}

export default function FigmaComment({
  avatarUrl,
  avatarAlt = "Avatar",
  avatarColor,
  className,
  imageUrl,
  authorName = "Someone",
  timestamp = "Just now",
  message = "",
  messageNode,
  width = 200,
  onOpenChange,
  onDelete,
  canDelete = false,
}: FigmaCommentProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isOpen = isPinned || isHovered;
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(CLOSED_SIZE);
  const shouldReduceMotion = useReducedMotion();

  useClickOutside(containerRef, () => {
    if (isPinned || isHovered) {
      setIsPinned(false);
      setIsHovered(false);
    }
  });

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  useEffect(() => {
    const measureHeight = () => {
      if (contentRef.current) {
        const innerDiv = contentRef.current.firstElementChild as HTMLElement;
        if (innerDiv) {
          const height = innerDiv.scrollHeight;
          if (height > 0) setContentHeight(height);
        }
      }
    };
    const t1 = setTimeout(measureHeight, MEASURE_DELAY_SHORT);
    const t2 = setTimeout(measureHeight, MEASURE_DELAY_LONG);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [message]);

  const handleToggle = () => {
    setIsPinned(prev => !prev);
    setIsHovered(false);
  };

  return (
    <div className={cn("relative", className)}>
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                width: isOpen ? width : CLOSED_SIZE,
                height: isOpen ? contentHeight : CLOSED_SIZE,
              }
        }
        className="absolute top-0 left-0 cursor-pointer overflow-hidden rounded-2xl rounded-tl-none bg-background shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.18),0px_3px_8px_0px_rgba(0,0,0,0.1),0px_1px_3px_0px_rgba(0,0,0,0.1)]"
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        ref={containerRef}
        style={
          shouldReduceMotion
            ? {
                width: isOpen ? width : CLOSED_SIZE,
                height: isOpen ? contentHeight : CLOSED_SIZE,
              }
            : undefined
        }
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                type: "spring" as const,
                stiffness: 550,
                damping: 45,
                mass: 0.7,
                delay: isOpen ? 0 : CONTAINER_CLOSE_DELAY,
                duration: 0.25,
              }
        }
      >
        {/* Avatar */}
        <motion.div
          animate={
            shouldReduceMotion
              ? {}
              : {
                  left: isOpen ? AVATAR_OPEN_LEFT : AVATAR_CLOSED_LEFT,
                  top: isOpen ? AVATAR_OPEN_TOP : AVATAR_CLOSED_TOP,
                }
          }
          className="absolute z-10"
          style={
            shouldReduceMotion
              ? {
                  left: isOpen ? AVATAR_OPEN_LEFT : AVATAR_CLOSED_LEFT,
                  top: isOpen ? AVATAR_OPEN_TOP : AVATAR_CLOSED_TOP,
                }
              : undefined
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  type: "spring" as const,
                  stiffness: 300,
                  damping: 25,
                  duration: 0.25,
                }
          }
        >
          <Avatar className="h-6 w-6">
            <AvatarImage alt={avatarAlt} src={avatarUrl} />
            <AvatarFallback
              style={avatarColor ? { backgroundColor: avatarColor, color: 'white', fontSize: '10px', fontWeight: 700 } : undefined}
            >
              {authorName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        {/* Hidden measurement div */}
        <div
          className="pointer-events-none absolute"
          ref={contentRef}
          style={{ width: `${width}px`, top: "-9999px", left: 0, position: "absolute" }}
        >
          <div className="flex flex-col items-start gap-0.5 py-3 pr-4 pl-11">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-[11px] text-foreground leading-4">{authorName}</p>
              <p className="font-medium text-[11px] text-muted-foreground leading-4">{timestamp}</p>
            </div>
            {message ? (
              <p className="text-left font-medium text-[11px] text-foreground leading-4 whitespace-pre-wrap">{message}</p>
            ) : null}
            {imageUrl ? (
              <div className="mt-1.5 w-full rounded-lg overflow-hidden" style={{ height: '120px' }} />
            ) : null}
            {canDelete ? <div className="mt-1 w-4 h-4 self-end" /> : null}
          </div>
        </div>

        {/* Visible content when open */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              animate={
                shouldReduceMotion ? { opacity: 1 } : { opacity: 1, filter: "blur(0px)" }
              }
              className="absolute inset-0 flex flex-col items-start gap-0.5 py-3 pr-4 pl-11"
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, filter: `blur(${String(EXIT_BLUR_PX)}px)` }
              }
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, filter: `blur(${String(INITIAL_BLUR_PX)}px)` }
              }
              style={{ width: `${width}px` }}
              transition={
                (shouldReduceMotion
                  ? { duration: 0 }
                  : (isExiting: boolean) => ({
                      opacity: { duration: 0.25, ease: BLUR_EASE, delay: isExiting ? 0 : CONTENT_DELAY },
                      filter: { duration: 0.25, ease: BLUR_EASE, delay: isExiting ? 0 : CONTENT_DELAY },
                    })) as import("motion/react").Transition
              }
            >
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-[11px] text-foreground leading-4">{authorName}</p>
                <p className="font-medium text-[11px] text-muted-foreground leading-4">{timestamp}</p>
              </div>
              {messageNode != null ? (
                <p className="text-left font-medium text-[11px] text-foreground leading-4 whitespace-pre-wrap">{messageNode}</p>
              ) : message ? (
                <p className="text-left font-medium text-[11px] text-foreground leading-4 whitespace-pre-wrap">{message}</p>
              ) : null}
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt=""
                  className="mt-1.5 w-full rounded-lg object-cover"
                  style={{ height: '120px' }}
                  draggable={false}
                />
              ) : null}
              {canDelete ? (
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onDelete?.() }}
                  className="mt-1 self-end p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
