import { extname } from 'path'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'])

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from('stickers')
    .list('', { sortBy: { column: 'name', order: 'asc' } })

  if (error || !data) return NextResponse.json([])

  const urls = data
    .filter(f => IMAGE_EXTS.has(extname(f.name).toLowerCase()))
    .map(f => supabase.storage.from('stickers').getPublicUrl(f.name).data.publicUrl)

  return NextResponse.json(urls)
}
