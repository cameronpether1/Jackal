export function CardSkeleton() {
  return (
    <div className="w-64 bg-[var(--jk-surface)] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-[var(--jk-border)] p-4 space-y-3 flex-shrink-0">
      <div className="h-3 skeleton rounded w-3/4" />
      <div className="h-3 skeleton rounded w-full" />
      <div className="h-3 skeleton rounded w-5/6" />
      <div className="h-3 skeleton rounded w-2/3" />
      <div className="mt-3 pt-3 border-t border-[var(--jk-border)] flex gap-2">
        <div className="h-5 skeleton rounded-full w-12" />
        <div className="h-5 skeleton rounded-full w-10" />
      </div>
    </div>
  )
}
