import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Look up the target membership
  const { data: target } = await admin
    .from('board_members')
    .select('board_id, role, user_id')
    .eq('id', memberId)
    .single()

  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Owners cannot be removed
  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Cannot remove a board owner' }, { status: 403 })
  }

  // Verify the requesting user is the board owner
  const { data: requester } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', target.board_id)
    .eq('user_id', user.id)
    .single()

  if (!requester || requester.role !== 'owner') {
    return NextResponse.json({ error: 'Only board owners can remove members' }, { status: 403 })
  }

  const { error } = await admin.from('board_members').delete().eq('id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
