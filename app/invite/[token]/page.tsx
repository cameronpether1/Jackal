import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { BoardInvite } from '@/lib/supabase/types'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/invite/${token}`)
  }

  const { data: inviteData } = await supabase
    .from('board_invites')
    .select('*')
    .eq('token', token)
    .single()

  const invite = inviteData as BoardInvite | null

  if (!invite || invite.accepted) {
    notFound()
  }

  // Use service client for writes to bypass RLS
  const service = createServiceClient()

  // Ensure a profile exists (covers users created before the auto-profile trigger)
  const emailPrefix = user.email?.split('@')[0] ?? user.id
  await service.from('profiles').upsert({
    id: user.id,
    username: emailPrefix,
    display_name: emailPrefix,
  }, { onConflict: 'id', ignoreDuplicates: true })

  await service.from('board_members').upsert({
    board_id: invite.board_id,
    user_id: user.id,
    role: 'member',
  }, { onConflict: 'board_id,user_id' })

  await service
    .from('board_invites')
    .update({ accepted: true })
    .eq('token', token)

  redirect(`/board/${invite.board_id}`)
}
