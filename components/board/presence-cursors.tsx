'use client'

import { getAvatarColor } from '@/lib/avatar-color'

export type OnlineUser = {
  userId: string
  displayName: string
  avatarUrl: string | null
  avatarColor: string
  cursor: { x: number; y: number } | null
}

export function PresenceCursors({ users }: { users: OnlineUser[] }) {
  const visible = users.filter(u => u.cursor !== null)
  if (!visible.length) return null

  return (
    <>
      {visible.map(user => (
        <div
          key={user.userId}
          className="absolute pointer-events-none z-[100] select-none"
          style={{
            left: user.cursor!.x,
            top: user.cursor!.y,
            transition: 'left 80ms linear, top 80ms linear',
          }}
        >
          <svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 2L16 12L9.5 12.5L7 20L2 2Z"
              fill={user.avatarColor}
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          <div
            className="absolute top-[18px] left-3 px-2 py-0.5 rounded-full rounded-tl-none text-[11px] font-semibold text-white whitespace-nowrap shadow-sm"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.displayName || 'Someone'}
          </div>
        </div>
      ))}
    </>
  )
}
