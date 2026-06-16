import { PenLine } from 'lucide-react'

interface EmptyStateProps {
  onCompose: () => void
}

export function EmptyState({ onCompose }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="text-center pointer-events-auto">
        <div className="border-2 border-dashed border-jk-border rounded-2xl px-12 py-10 max-w-xs">
          <div className="w-10 h-10 rounded-xl bg-jk-surface-offset flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-5 h-5 text-jk-text-muted" />
          </div>
          <p className="text-base font-semibold text-jk-text mb-1">Start something</p>
          <p className="text-sm text-jk-text-muted mb-4 text-balance">
            Drop the first thought — a note, task list, or question.
          </p>
          <button
            onClick={onCompose}
            className="inline-flex items-center gap-2 text-sm text-jk-accent font-medium hover:underline"
          >
            <span className="hidden sm:inline">
              Press <kbd className="bg-jk-surface border border-jk-border px-1.5 py-0.5 rounded text-xs font-mono">N</kbd> or tap
            </span>
            <span className="sm:hidden">Tap</span>
            {' '}New Post below
          </button>
        </div>
      </div>
    </div>
  )
}
