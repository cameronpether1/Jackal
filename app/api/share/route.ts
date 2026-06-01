import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/share?boardId=xxx  — returns existing share or null
export async function GET(req: NextRequest) {
  const boardId = req.nextUrl.searchParams.get('boardId')
  if (!boardId) return NextResponse.json({ error: 'Missing boardId' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('board_shares')
    .select('token')
    .eq('board_id', boardId)
    .single()

  return NextResponse.json({ token: data?.token ?? null })
}

// POST /api/share { boardId }  — create or return existing share (Pro owners only)
export async function POST(req: NextRequest) {
  try {
    const { boardId } = await req.json()
    if (!boardId) return NextResponse.json({ error: 'Missing boardId' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Verify Pro plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'pro') {
      return NextResponse.json({ error: 'Pro plan required' }, { status: 403 })
    }

    // Verify board ownership
    const { data: membership } = await supabase
      .from('board_members')
      .select('role')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'owner') {
      return NextResponse.json({ error: 'Only board owners can create share links' }, { status: 403 })
    }

    // Upsert — returns existing if already created
    const { data: existing } = await supabase
      .from('board_shares')
      .select('token')
      .eq('board_id', boardId)
      .single()

    if (existing) return NextResponse.json({ token: existing.token })

    const { data: share, error } = await supabase
      .from('board_shares')
      .insert({ board_id: boardId, created_by: user.id })
      .select('token')
      .single()

    if (error) throw error
    return NextResponse.json({ token: share.token })
  } catch (err) {
    console.error('Share error:', err)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

// DELETE /api/share  { boardId }  — revoke share
export async function DELETE(req: NextRequest) {
  try {
    const { boardId } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await supabase
      .from('board_shares')
      .delete()
      .eq('board_id', boardId)
      .eq('created_by', user.id)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to revoke link' }, { status: 500 })
  }
}
