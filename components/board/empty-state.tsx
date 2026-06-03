interface EmptyStateProps {
  onCompose: () => void
}

export function EmptyState({ onCompose }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center pointer-events-auto">
        <div className="border-2 border-dashed border-jk-border rounded-2xl px-12 py-10 max-w-xs">
          <div className="text-3xl mb-3">📌</div>
          <p className="text-sm font-medium text-jk-text mb-1">No posts yet</p>
          <p className="text-sm text-jk-text-muted mb-4">
            Add your first post to the board
          </p>
          <button
            onClick={onCompose}
            className="inline-flex items-center gap-2 text-sm text-jk-accent font-medium hover:underline"
          >
            Press <kbd className="bg-jk-surface-offset px-1.5 py-0.5 rounded text-xs font-mono">N</kbd> or click New Post ↗
          </button>
        </div>
      </div>
    </div>
  )
}
