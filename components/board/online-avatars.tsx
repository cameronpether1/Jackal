'use client'

import type { OnlineUser } from './presence-cursors'

const MAX_VISIBLE = 5

export function OnlineAvatars({ users }: { users: OnlineUser[] }) {
  if (!users.length) return null

  const visible = users.slice(0, MAX_VISIBLE)
  const overflow = users.length - MAX_VISIBLE

  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-1 pointer-events-none">
      <div className="flex -space-x-2">
        {visible.map(user => (
          <div
            key={user.userId}
            title={user.displayName}
            className="relative w-8 h-8 rounded-full ring-2 ring-jk-bg overflow-hidden flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.avatarUrl
              ? <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
              : (user.displayName?.[0]?.toUpperCase() ?? '?')}
          </div>
        ))}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full ring-2 ring-jk-bg bg-jk-surface-offset flex items-center justify-center text-[11px] font-semibold text-jk-text-muted shrink-0">
            +{overflow}
          </div>
        )}
      </div>
    </div>
  )
}
