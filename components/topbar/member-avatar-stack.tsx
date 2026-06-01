'use client'

import { getAvatarColor } from '@/lib/avatar-color'
import { useProfile } from '@/components/providers/profile-provider'
import type { BoardMemberWithProfile } from '@/lib/supabase/types'

interface MemberAvatarStackProps {
  members: BoardMemberWithProfile[]
  currentUserId: string
  onlineIds?: Set<string>
}

export function MemberAvatarStack({ members, currentUserId, onlineIds }: MemberAvatarStackProps) {
  const { profile: currentProfile } = useProfile()
  const visible = members.slice(0, 5)
  const overflow = members.length - visible.length

  return (
    <div className="flex items-center -space-x-2">
      {visible.map(member => {
        const isMe = member.user_id === currentUserId
        // Use live context profile for current user so avatar updates instantly
        const p = isMe && currentProfile ? currentProfile : member.profile
        const color = getAvatarColor(p?.id ?? '')
        const isOnline = onlineIds?.has(member.user_id)
        return (
          <div key={member.id} className="relative" title={p?.display_name ?? 'Unknown'}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-medium ring-2 ring-[var(--jk-surface)] overflow-hidden"
              style={{ backgroundColor: color }}
            >
              {p?.avatar_url
                ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                : p?.display_name?.[0]?.toUpperCase() ?? '?'}
            </div>
            {(isOnline || isMe) && (
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-green-400 rounded-full ring-1 ring-[var(--jk-surface)]" />
            )}
          </div>
        )
      })}
      {overflow > 0 && (
        <div className="w-7 h-7 rounded-full bg-[var(--jk-surface-offset)] flex items-center justify-center text-xs text-[var(--jk-text-muted)] ring-2 ring-[var(--jk-surface)]">
          +{overflow}
        </div>
      )}
    </div>
  )
}
