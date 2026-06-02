import { NextResponse } from 'next/server'

export async function GET() {
  const res = await fetch('https://tapback.co/api/avatar.webp', { cache: 'no-store' })
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch avatar' }, { status: 502 })

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: { 'Content-Type': 'image/webp' },
  })
}
