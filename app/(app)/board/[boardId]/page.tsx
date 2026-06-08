import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BoardView } from '@/components/board/board-view'
import type { BoardActivity } from '@/lib/supabase/types'

export default async function BoardPage({ params }: PageProps<'/board/[boardId]'>) {
  const { boardId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Round 1: board data + previous visit timestamp in parallel
  const [
    { data: board },
    { data: membership },
    { data: members },
    { data: posts },
    { data: profile },
    { data: stickers },
    { data: prevVisit },
  ] = await Promise.all([
    supabase.from('boards').select('*').eq('id', boardId).single(),
    supabase.from('board_members').select('*').eq('board_id', boardId).eq('user_id', user.id).single(),
    supabase.from('board_members').select('*, profile:profiles(*)').eq('board_id', boardId),
    supabase.from('posts').select('*, author:profiles(*), task_items(*), reactions(*)').eq('board_id', boardId).order('created_at', { ascending: true }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('stickers').select('*').eq('board_id', boardId).order('created_at', { ascending: true }),
    supabase.from('board_visits').select('last_visited_at').eq('user_id', user.id).eq('board_id', boardId).maybeSingle(),
  ])

  if (!membership) {
    const { data: pendingInvite } = await supabase
      .from('board_invites').select('token').eq('board_id', boardId).eq('accepted', false).limit(1).single()
    if (pendingInvite) redirect(`/invite/${pendingInvite.token}`)
    notFound()
  }

  if (!board) notFound()

  const prevVisitedAt = prevVisit?.last_visited_at ?? null
  const sinceTime = prevVisitedAt ?? '2000-01-01T00:00:00Z'

  // Round 2: fetch new activities + upsert visit timestamp in parallel
  const [{ data: rawActivities }] = await Promise.all([
    supabase.rpc('get_new_board_activities', {
      p_board_id: boardId,
      p_user_id: user.id,
      p_since: sinceTime,
    }),
    supabase.from('board_visits').upsert(
      { user_id: user.id, board_id: boardId, last_visited_at: new Date().toISOString() },
      { onConflict: 'user_id,board_id' }
    ),
  ])

  const newActivities: BoardActivity[] = (rawActivities ?? []) as BoardActivity[]
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
      prevVisitedAt={prevVisitedAt}
      newActivities={newActivities}
    />
  )
}
