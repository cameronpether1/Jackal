import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WelcomeScreen } from '@/components/welcome/welcome-screen'

export const dynamic = 'force-dynamic'

export default async function WelcomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { count: ownedBoardCount }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('board_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'owner'),
  ])

  return <WelcomeScreen profile={profile} ownedBoardCount={ownedBoardCount ?? 0} />
}
