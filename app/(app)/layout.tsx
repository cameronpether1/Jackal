import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CommandMenu } from '@/components/command/command-menu'
import { ProfileProvider } from '@/components/providers/profile-provider'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('board_members')
      .select('board_id, role, boards(id, name)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true }),
  ])

  const boards = (memberships ?? [])
    .flatMap((m: { board_id: string; role: string; boards: { id: string; name: string }[] | { id: string; name: string } | null }) => {
      const b = m.boards
      if (!b) return []
      const items = Array.isArray(b) ? b : [b]
      return items.map(board => ({
        ...board,
        isOwner: m.role === 'owner',
      }))
    })

  const ownedBoardCount = (memberships ?? []).filter(
    (m: { role: string }) => m.role === 'owner'
  ).length

  return (
    <ProfileProvider initial={profile}>
      <div className="h-full">
        <CommandMenu boards={boards} ownedBoardCount={ownedBoardCount} />
        <main className="h-full overflow-hidden">{children}</main>
      </div>
    </ProfileProvider>
  )
}
