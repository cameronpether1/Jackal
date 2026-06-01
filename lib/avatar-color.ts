const COLORS = [
  '#0ea5e9', // sky
  '#ec4899', // pink
  '#3b82f6', // blue
  '#22c55e', // green
  '#a855f7', // purple
  '#eab308', // yellow
]

export function getAvatarColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
