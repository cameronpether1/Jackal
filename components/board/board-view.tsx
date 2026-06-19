'use client'

import { useRef, useState, useEffect } from 'react'
import { Topbar } from '@/components/topbar/topbar'
import { Whiteboard } from '@/components/board/whiteboard'
import { BoardCalendar } from '@/components/board/board-calendar'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { type LabelColor } from '@/lib/label-colors'
import type { Board, BoardMemberWithProfile, PostWithRelations, Profile, Sticker } from '@/lib/supabase/types'

function MenuHint() {
  const [state, setState] = useState<'hidden' | 'visible' | 'fading'>('hidden')

  useEffect(() => {
    if (localStorage.getItem('jk_menu_hint')) return
    const show = setTimeout(() => setState('visible'), 800)
    const fade = setTimeout(() => setState('fading'), 4500)
    const hide = setTimeout(() => {
      setState('hidden')
      localStorage.setItem('jk_menu_hint', '1')
    }, 5200)
    return () => { clearTimeout(show); clearTimeout(fade); clearTimeout(hide) }
  }, [])

  if (state === 'hidden') return null

  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none',
        'flex items-center gap-2.5 px-4 py-2.5 rounded-full',
        'bg-[#1c1b19]/90 text-white text-[13px] font-medium shadow-lg backdrop-blur-sm',
        'transition-opacity duration-700',
        state === 'visible' ? 'opacity-100' : 'opacity-0',
      )}
    >
      <kbd className="inline-flex items-center justify-center w-5 h-5 rounded-[4px] bg-white/20 text-[11px] font-semibold leading-none">
        J
      </kbd>
      to open menu
    </div>
  )
}

interface BoardViewProps {
  board: Board
  members: BoardMemberWithProfile[]
  currentUser: Profile | null
  currentUserId: string
  isOwner: boolean
  initialPosts: PostWithRelations[]
  initialStickers: Sticker[]
}

export function BoardView({
  board, members, currentUser, currentUserId, isOwner,
  initialPosts, initialStickers,
}: BoardViewProps) {
  const exportFnRef = useRef<(() => Promise<void>) | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<LabelColor[]>([])

  function handleToggleFilter(color: LabelColor) {
    setActiveFilters(prev =>
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    )
  }

  return (
    <div className="relative flex flex-col h-full">
      <MenuHint />
      <Topbar
        board={board}
        members={members}
        currentUser={currentUser}
        currentUserId={currentUserId}
        isOwner={isOwner}
        calendarOpen={calendarOpen}
        onCalendarToggle={() => setCalendarOpen(v => !v)}
        onExport={() => exportFnRef.current?.()}
        activeFilters={activeFilters}
        onToggleFilter={handleToggleFilter}
        onClearFilters={() => setActiveFilters([])}
      />
      <Whiteboard
        boardId={board.id}
        boardName={board.name}
        initialPosts={initialPosts}
        initialStickers={initialStickers}
        currentUserId={currentUserId}
        currentProfile={currentUser}
        isOwner={isOwner}
        onExportReady={fn => { exportFnRef.current = fn }}
        activeFilters={activeFilters}
      />

      <Drawer open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DrawerContent className="rounded-t-2xl border-t-0 pb-6 items-center">
          <DrawerTitle className="sr-only">Board Calendar</DrawerTitle>
          <BoardCalendar
            boardId={board.id}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onClose={() => setCalendarOpen(false)}
          />
        </DrawerContent>
      </Drawer>
    </div>
  )
}
