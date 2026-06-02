import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

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

    // Fetch board name and inviter profile for the email
    const [{ data: board }, { data: inviterProfile }] = await Promise.all([
      supabase.from('boards').select('name').eq('id', boardId).single(),
      supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    ])

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
    const inviterName = inviterProfile?.display_name ?? 'Someone'
    const boardName = board?.name ?? 'a board'

    // Send invite email via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here') {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `Jackal <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`,
        to: email,
        subject: `${inviterName} invited you to "${boardName}" on Jackal`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="font-size: 20px; font-weight: 700; margin: 0 0 8px;">You've been invited</h2>
            <p style="color: #6b6a67; margin: 0 0 24px;">
              <strong>${inviterName}</strong> has invited you to collaborate on
              <strong>${boardName}</strong> in Jackal.
            </p>
            <a
              href="${inviteUrl}"
              style="display: inline-block; background: #38bdf8; color: #fff; font-weight: 600;
                     text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px;"
            >
              Accept invitation
            </a>
            <p style="color: #b0afa9; font-size: 12px; margin: 24px 0 0;">
              Or copy this link: ${inviteUrl}
            </p>
          </div>
        `,
      })
      if (emailError) {
        console.error('[invite] Resend error:', emailError)
        return NextResponse.json({ error: `Email failed: ${emailError.message}` }, { status: 500 })
      }
      console.log('[invite] Email sent, Resend id:', emailData?.id)
    } else {
      // No API key configured — log URL for local development
      console.log(`[invite] No RESEND_API_KEY set. Invite URL for ${email}: ${inviteUrl}`)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Invite error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
