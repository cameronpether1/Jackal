'use client'

import { useRef, useState } from 'react'
import { Topbar } from '@/components/topbar/topbar'
import { Whiteboard } from '@/components/board/whiteboard'
import type { Board, BoardMemberWithProfile, PostWithRelations, Profile, Sticker } from '@/lib/supabase/types'

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

  return (
    <div className="relative flex flex-col h-full">
      <Topbar
        board={board}
        members={members}
        currentUser={currentUser}
        currentUserId={currentUserId}
        isOwner={isOwner}
        calendarOpen={calendarOpen}
        onCalendarToggle={() => setCalendarOpen(v => !v)}
        onExport={() => exportFnRef.current?.()}
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
        calendarOpen={calendarOpen}
        onCalendarClose={() => setCalendarOpen(false)}
      />
    </div>
  )
}
