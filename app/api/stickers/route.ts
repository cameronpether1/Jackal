import { readdir } from 'fs/promises'
import { join, extname } from 'path'
import { NextResponse } from 'next/server'

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif'])

export async function GET() {
  try {
    const dir = join(process.cwd(), 'public', 'stickers')
    const files = await readdir(dir)
    const srcs = files
      .filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
      .sort()
      .map(f => `/stickers/${f}`)
    return NextResponse.json(srcs)
  } catch {
    return NextResponse.json([])
  }
}
