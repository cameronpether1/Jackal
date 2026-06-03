import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { ReadonlyWhiteboard } from '@/components/board/readonly-whiteboard'

export default async function SharePage({ params }: PageProps<'/share/[token]'>) {
  const { token } = await params

  const supabase = createAdminClient()

  // Resolve token → board
  const { data: share } = await supabase
    .from('board_shares')
    .select('board_id')
    .eq('token', token)
    .single()

  if (!share) notFound()

  const [{ data: board }, { data: posts }] = await Promise.all([
    supabase.from('boards').select('*').eq('id', share.board_id).single(),
    supabase
      .from('posts')
      .select('*, author:profiles(*), task_items(*), reactions(*)')
      .eq('board_id', share.board_id)
      .order('created_at', { ascending: true }),
  ])

  if (!board) notFound()

  return (
    <div className="flex flex-col h-full bg-jk-bg">
      {/* Header */}
      <header className="flex items-center justify-between px-4 h-14 bg-jk-surface border-b border-jk-border shrink-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <img src="/logo.png" alt="Jackal" className="w-7 h-7 rounded-lg object-cover" />
          </Link>
          <h1 className="text-sm font-semibold text-jk-text truncate max-w-xs">
            {board.name}
          </h1>
          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-jk-surface-offset text-jk-text-faint">
            View only
          </span>
        </div>
        <Link
          href="/login"
          className="text-sm font-medium bg-jk-accent hover:bg-sky-400 text-white rounded-full px-4 py-1.5 transition-colors"
        >
          Sign up to collaborate →
        </Link>
      </header>

      <ReadonlyWhiteboard posts={posts ?? []} />
    </div>
  )
}
