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

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const safeInviterName = esc(inviterName)
    const safeBoardName = esc(boardName)

    // Send invite email via Resend
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_your_api_key_here') {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { data: emailData, error: emailError } = await resend.emails.send({
        from: `Jackal <${process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'}>`,
        to: email,
        subject: `${inviterName} invited you to "${boardName}" on Jackal`,
        html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You've been invited to ${safeBoardName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">

          <!-- Card: dark header + white body unified -->
          <tr>
            <td style="border-radius:16px;border:1px solid #e4e4df;overflow:hidden;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">

                <!-- Dark header with tagline (recipient may not know Jackal) -->
                <tr>
                  <td style="background-color:#1a1917;padding:22px 40px 20px;">
                    <span style="font-size:19px;font-weight:800;letter-spacing:-0.5px;color:#ffffff;line-height:1;display:block;">Jackal</span>
                    <span style="font-size:12px;font-weight:400;color:#b0afa9;line-height:1;display:block;margin-top:5px;">Real-time collaborative boards</span>
                  </td>
                </tr>

                <!-- White card body -->
                <tr>
                  <td style="background-color:#ffffff;padding:40px 40px 44px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">

                      <!-- Accent bar -->
                      <tr>
                        <td style="padding:0 0 22px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background-color:#0ea5e9;height:3px;width:28px;line-height:3px;mso-line-height-rule:exactly;border-radius:2px;font-size:0;">&nbsp;</td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Heading -->
                      <tr>
                        <td style="padding:0 0 16px;">
                          <h1 style="margin:0;font-size:25px;font-weight:700;color:#1a1917;letter-spacing:-0.4px;line-height:1.15;">You're invited</h1>
                        </td>
                      </tr>

                      <!-- Board name chip -->
                      <tr>
                        <td style="padding:0 0 20px;">
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background-color:#f0ede8;border-radius:8px;border:1px solid #e4e4df;padding:6px 12px;">
                                <span style="font-size:13px;font-weight:500;color:#1a1917;letter-spacing:-0.2px;">${safeBoardName}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                      <!-- Body copy -->
                      <tr>
                        <td style="padding:0 0 36px;">
                          <p style="margin:0;font-size:15px;line-height:1.65;color:#6b6a67;">
                            <strong style="color:#1a1917;font-weight:600;">${safeInviterName}</strong> invited you to collaborate here. Click below to accept and join the board.
                          </p>
                        </td>
                      </tr>

                      <!-- CTA button -->
                      <tr>
                        <td>
                          <table cellpadding="0" cellspacing="0" border="0">
                            <tr>
                              <td style="background-color:#0ea5e9;border-radius:10px;">
                                <a href="${inviteUrl}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.1px;white-space:nowrap;">Accept invitation &rarr;</a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:22px 4px 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:#6b6a67;">Or copy this link into your browser:</p>
              <p style="margin:0 0 16px;font-size:12px;color:#1a1917;word-break:break-all;">${inviteUrl}</p>
              <p style="margin:0;font-size:11px;color:#6b6a67;line-height:1.65;">
                You received this because someone invited you to a Jackal board.<br>
                If you weren't expecting this, you can safely ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
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
