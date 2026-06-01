'use client'

import { useRef } from 'react'
import { Topbar } from '@/components/topbar/topbar'
import { Whiteboard } from '@/components/board/whiteboard'
import type { Board, BoardMemberWithProfile, PostWithRelations, Profile } from '@/lib/supabase/types'

interface BoardViewProps {
  board: Board
  members: BoardMemberWithProfile[]
  currentUser: Profile | null
  currentUserId: string
  isOwner: boolean
  initialPosts: PostWithRelations[]
}

export function BoardView({ board, members, currentUser, currentUserId, isOwner, initialPosts }: BoardViewProps) {
  const exportFnRef = useRef<(() => Promise<void>) | null>(null)

  return (
    <div className="flex flex-col h-full">
      <Topbar
        board={board}
        members={members}
        currentUser={currentUser}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onExport={() => exportFnRef.current?.()}
      />
      <Whiteboard
        boardId={board.id}
        boardName={board.name}
        initialPosts={initialPosts}
        currentUserId={currentUserId}
        currentProfile={currentUser}
        onExportReady={fn => { exportFnRef.current = fn }}
      />
    </div>
  )
}
