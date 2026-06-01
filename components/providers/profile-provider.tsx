'use client'

import { createContext, useContext, useState } from 'react'
import type { Profile } from '@/lib/supabase/types'

interface ProfileContextValue {
  profile: Profile | null
  setProfile: (p: Profile) => void
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  setProfile: () => {},
})

export function ProfileProvider({
  initial,
  children,
}: {
  initial: Profile | null
  children: React.ReactNode
}) {
  const [profile, setProfile] = useState<Profile | null>(initial)
  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
