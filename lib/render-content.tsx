import { LinkPreview } from '@/components/ui/link-preview'
import { PostLinkChip } from '@/components/board/post-link-chip'
import type { PostWithRelations } from '@/lib/supabase/types'

const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
// Matches [[uuid]] or a URL — whichever comes first
const COMBINED = new RegExp(`\\[\\[(${UUID})\\]\\]|https?:\\/\\/[^\\s<>\\[\\]{}|\\\\^\`"]+`, 'g')

interface RenderOptions {
  posts?: PostWithRelations[]
  onJumpToPost?: (id: string) => void
}

export function renderContent(text: string, opts?: RenderOptions): React.ReactNode {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const regex = new RegExp(COMBINED.source, 'g')

  while ((match = regex.exec(text)) !== null) {
    const start = match.index
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start))

    if (match[1]) {
      // [[postId]] reference
      nodes.push(
        <PostLinkChip
          key={`ref-${start}`}
          postId={match[1]}
          posts={opts?.posts ?? []}
          onJump={opts?.onJumpToPost}
        />
      )
    } else {
      // URL
      const url = match[0]
      nodes.push(<LinkPreview key={`url-${start}`} url={url}>{url}</LinkPreview>)
    }

    lastIndex = start + match[0].length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes.length === 0 ? text : <>{nodes}</>
}
