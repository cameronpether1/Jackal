import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { boardId, email } = await request.json()
    if (!boardId || !email) {
      return NextResponse.json({ error: 'Missing boardId or email' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify the user is an owner of this board
    const { data: membership } = await supabase
      .from('board_members')
      .select('role')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can invite members' }, { status: 403 })
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from('board_invites')
      .insert({
        board_id: boardId,
        invited_email: email,
        invited_by: user.id,
      })
      .select()
      .single()

    if (error) throw error

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`

    // In production, send this via email (Supabase Edge Function or Resend)
    // For now, log it to help with development
    console.log(`Invite URL for ${email}: ${inviteUrl}`)

    return NextResponse.json({ success: true, inviteUrl })
  } catch (err: unknown) {
    console.error('Invite error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
