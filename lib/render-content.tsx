import { LinkPreview } from '@/components/ui/link-preview'

const URL_REGEX = /https?:\/\/[^\s<>\[\]{}|\\^`"]+/g

export function renderContent(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  const regex = new RegExp(URL_REGEX.source, 'g')

  while ((match = regex.exec(text)) !== null) {
    const url = match[0]
    const start = match.index
    if (start > lastIndex) nodes.push(text.slice(lastIndex, start))
    nodes.push(<LinkPreview key={start} url={url}>{url}</LinkPreview>)
    lastIndex = start + url.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes.length === 0 ? text : <>{nodes}</>
}
