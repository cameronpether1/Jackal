'use client'

import { createContext, useContext, useState } from 'react'

export interface BoardActions {
  onNewPost?: () => void
  onAddSticker?: () => void
  onFitAll?: () => void
  onZoomIn?: () => void
  onZoomOut?: () => void
  zoom?: number
  onOpenNotifications?: () => void
  notificationCount?: number
}

interface BoardActionsContextValue {
  actions: BoardActions | null
  setActions: (a: BoardActions | null) => void
}

const BoardActionsContext = createContext<BoardActionsContextValue>({
  actions: null,
  setActions: () => {},
})

export function BoardActionsProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<BoardActions | null>(null)
  return (
    <BoardActionsContext.Provider value={{ actions, setActions }}>
      {children}
    </BoardActionsContext.Provider>
  )
}

export function useBoardActions() {
  return useContext(BoardActionsContext)
}
