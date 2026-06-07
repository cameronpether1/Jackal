import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoardView } from '@/components/board/board-view'

export default async function BoardPage({ params }: PageProps<'/board/[boardId]'>) {
  const { boardId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: board },
    { data: membership },
    { data: members },
    { data: posts },
    { data: profile },
    { data: stickers },
  ] = await Promise.all([
    supabase.from('boards').select('*').eq('id', boardId).single(),
    supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single(),
    supabase
      .from('board_members')
      .select('*, profile:profiles(*)')
      .eq('board_id', boardId),
    supabase
      .from('posts')
      .select('*, author:profiles(*), task_items(*), reactions(*)')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('stickers')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: true }),
  ])

  if (!membership) {
    // Check if this user has a pending invite for this board and redirect them to accept it
    const { data: pendingInvite } = await supabase
      .from('board_invites')
      .select('token')
      .eq('board_id', boardId)
      .eq('accepted', false)
      .limit(1)
      .single()

    if (pendingInvite) redirect(`/invite/${pendingInvite.token}`)
    notFound()
  }

  if (!board) notFound()

  const isOwner = (membership as { role: string }).role === 'owner'

  return (
    <BoardView
      board={board}
      members={members ?? []}
      currentUser={profile}
      currentUserId={user.id}
      isOwner={isOwner}
      initialPosts={posts ?? []}
      initialStickers={stickers ?? []}
    />
  )
}
