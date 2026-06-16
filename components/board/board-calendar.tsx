'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, Check, Trash2, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { GlassCalendar } from '@/components/ui/glasscn/glass-calendar'
import { createClient } from '@/lib/supabase/client'
import { getAvatarColor } from '@/lib/avatar-color'
import { cn } from '@/lib/utils'
import type { BoardCalendarEvent } from '@/lib/supabase/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isInRange(d: Date, start: string, end: string) {
  const s = toDateStr(d)
  return s >= start && s <= end
}

// Append T12:00:00 so UTC midnight doesn't roll back a day in western timezones
function fmtStored(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtRange(from: Date, to: Date) {
  const o: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  const f = from.toLocaleDateString('en-US', o)
  const t = to.toLocaleDateString('en-US', o)
  return f === t ? f : `${f} – ${t}`
}

// ─── Context ─────────────────────────────────────────────────────────────────

type CalCtx = {
  events: BoardCalendarEvent[]
  currentUserId: string
  isOwner: boolean
  onClose: () => void
  showAddForm: boolean
  addTitle: string
  setAddTitle: (v: string) => void
  selectedRange: DateRange | undefined
  onAddSubmit: (e: React.FormEvent) => void
  onCancelAdd: () => void
  editingEvent: BoardCalendarEvent | null
  editTitle: string
  setEditTitle: (v: string) => void
  onOpenEdit: (ev: BoardCalendarEvent) => void
  onCloseEdit: () => void
  onEditSubmit: (e: React.FormEvent) => void
  onDeleteEvent: () => void
  saving: boolean
}

const CalCtx = createContext<CalCtx | null>(null)

// ─── Module-level components (stable references → DayPicker never remounts) ──

function BoardCalRoot({
  rootRef,
  className,
  children,
  ...props
}: {
  rootRef?: React.Ref<HTMLDivElement>
  className?: string
  children?: React.ReactNode
  [k: string]: unknown
}) {
  const ctx = useContext(CalCtx)!

  return (
    <div ref={rootRef as React.Ref<HTMLDivElement>} className={cn(className)} {...(props as object)}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-black/[0.07] dark:border-white/[0.08]">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground tracking-wide">Board Calendar</span>
        </div>
        <button
          type="button"
          onClick={ctx.onClose}
          className="w-6 h-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Edit panel */}
      {ctx.editingEvent && (
        <form
          onSubmit={ctx.onEditSubmit}
          className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.08]"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
              {ctx.editingEvent.start_date === ctx.editingEvent.end_date
                ? fmtStored(ctx.editingEvent.start_date)
                : `${fmtStored(ctx.editingEvent.start_date)} – ${fmtStored(ctx.editingEvent.end_date)}`}
            </span>
            <button type="button" onClick={ctx.onCloseEdit} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              value={ctx.editTitle}
              onChange={e => ctx.setEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') ctx.onCloseEdit() }}
              className="flex-1 min-w-0 text-sm bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.1] dark:border-white/[0.1] rounded-full px-3 py-1.5 outline-none focus:border-black/20 dark:focus:border-white/25 transition-colors"
            />
            <button
              type="submit"
              disabled={ctx.saving || !ctx.editTitle.trim()}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white transition-colors disabled:opacity-40 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            {(ctx.editingEvent.author_id === ctx.currentUserId || ctx.isOwner) && (
              <button
                type="button"
                onClick={ctx.onDeleteEvent}
                disabled={ctx.saving}
                className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-40 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </form>
      )}

      {/* Add form — appears after completing a range selection */}
      {ctx.showAddForm && (
        <form
          onSubmit={ctx.onAddSubmit}
          className="px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.08]"
        >
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide block mb-2">
            {ctx.selectedRange?.from && ctx.selectedRange?.to
              ? fmtRange(ctx.selectedRange.from, ctx.selectedRange.to)
              : ''}
          </span>
          <div className="flex gap-2 items-center">
            <input
              autoFocus
              value={ctx.addTitle}
              onChange={e => ctx.setAddTitle(e.target.value)}
              placeholder="Event name…"
              onKeyDown={e => { if (e.key === 'Escape') ctx.onCancelAdd() }}
              className="flex-1 min-w-0 text-sm bg-black/[0.05] dark:bg-white/[0.07] border border-black/[0.1] dark:border-white/[0.1] rounded-full px-3 py-1.5 outline-none focus:border-black/20 dark:focus:border-white/25 transition-colors placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={ctx.saving || !ctx.addTitle.trim()}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#0ea5e9] hover:bg-[#38bdf8] text-white transition-colors disabled:opacity-40 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={ctx.onCancelAdd}
              className="w-7 h-7 flex items-center justify-center rounded-full text-muted-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {children}
    </div>
  )
}

function BoardCalDayButton({
  day,
  modifiers,
  children,
  className,
  ...props
}: {
  day: { date: Date }
  modifiers: Record<string, boolean>
  children?: React.ReactNode
  className?: string
  [k: string]: unknown
}) {
  const ctx = useContext(CalCtx)!
  const date = day.date
  const dateStr = toDateStr(date)

  const dayEvents = ctx.events
    .filter(ev => isInRange(date, ev.start_date, ev.end_date))
    .sort((a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id))

  return (
    <button
      data-selected-single={
        modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        'relative z-10 flex flex-col items-center w-full min-h-[var(--cell-size)] pb-1',
        'rounded-[var(--cell-radius)] border-0 font-normal select-none',
        'hover:bg-accent hover:text-accent-foreground transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        modifiers.today && !modifiers.selected && 'bg-muted',
        modifiers.outside && 'text-muted-foreground opacity-40',
        modifiers.disabled && 'text-muted-foreground opacity-30 pointer-events-none',
        'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
        'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-r-none',
        'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-l-none',
        'data-[range-middle=true]:bg-muted data-[range-middle=true]:rounded-none',
        className,
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <span className="text-xs leading-none pt-1.5 shrink-0">{children}</span>

      {dayEvents.length > 0 && (
        <div className="flex flex-col gap-[2px] w-full mt-0.5 overflow-hidden">
          {dayEvents.map(ev => {
            const isStart = dateStr === ev.start_date
            const isEnd = dateStr === ev.end_date
            const isSingle = isStart && isEnd
            return (
              <div
                key={ev.id}
                onClick={e => { e.stopPropagation(); ctx.onOpenEdit(ev) }}
                onMouseDown={e => e.stopPropagation()}
                title={ev.title}
                style={{ backgroundColor: ev.color }}
                className={cn(
                  'h-[5px] w-full cursor-pointer shrink-0',
                  isSingle
                    ? 'rounded-full self-center !w-[calc(100%-10px)]'
                    : isStart
                    ? 'rounded-l-full'
                    : isEnd
                    ? 'rounded-r-full'
                    : 'rounded-none',
                )}
              />
            )
          })}
        </div>
      )}
    </button>
  )
}

const CALENDAR_COMPONENTS = {
  Root: BoardCalRoot,
  DayButton: BoardCalDayButton,
} as const

// ─── Main component ───────────────────────────────────────────────────────────

interface BoardCalendarProps {
  boardId: string
  currentUserId: string
  isOwner: boolean
  onClose: () => void
}

export function BoardCalendar({ boardId, currentUserId, isOwner, onClose }: BoardCalendarProps) {
  const [events, setEvents] = useState<BoardCalendarEvent[]>([])
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()
  const [editingEvent, setEditingEvent] = useState<BoardCalendarEvent | null>(null)
  const [addTitle, setAddTitle] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const editingRef = useRef<BoardCalendarEvent | null>(null)
  editingRef.current = editingEvent

  const showAddForm = !!(selectedRange?.from && selectedRange?.to) && !editingEvent

  // Initial fetch
  useEffect(() => {
    supabase
      .from('board_calendar_events')
      .select('*')
      .eq('board_id', boardId)
      .then(({ data }) => { if (data) setEvents(data) })
  }, [boardId, supabase])

  // Realtime sync
  useEffect(() => {
    const ch = supabase
      .channel(`calendar:${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_calendar_events' }, p => {
        if (p.eventType === 'INSERT') {
          const ev = p.new as BoardCalendarEvent
          if (ev.board_id === boardId) setEvents(prev => [...prev, ev])
        } else if (p.eventType === 'UPDATE') {
          const ev = p.new as BoardCalendarEvent
          if (ev.board_id === boardId) setEvents(prev => prev.map(e => e.id === ev.id ? ev : e))
        } else if (p.eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== (p.old as { id: string }).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [boardId, supabase])

  // Use ref so handleSelect is stable (no deps that change)
  const handleSelect = useCallback((range: DateRange | undefined) => {
    if (editingRef.current) return
    setSelectedRange(range)
  }, [])

  const handleAddSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRange?.from || !selectedRange?.to || !addTitle.trim()) return
    const from = selectedRange.from
    const to = selectedRange.to
    const title = addTitle.trim()
    setSelectedRange(undefined)
    setAddTitle('')
    setSaving(true)
    await supabase.from('board_calendar_events').insert({
      board_id: boardId,
      author_id: currentUserId,
      title,
      start_date: toDateStr(from),
      end_date: toDateStr(to),
      color: getAvatarColor(currentUserId),
    })
    setSaving(false)
  }, [selectedRange, addTitle, boardId, currentUserId, supabase])

  const handleCancelAdd = useCallback(() => {
    setSelectedRange(undefined)
    setAddTitle('')
  }, [])

  const handleOpenEdit = useCallback((ev: BoardCalendarEvent) => {
    setEditingEvent(ev)
    setEditTitle(ev.title)
    setSelectedRange(undefined)
  }, [])

  const handleCloseEdit = useCallback(() => { setEditingEvent(null) }, [])

  const handleEditSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const ev = editingRef.current
    if (!ev || !editTitle.trim()) return
    const title = editTitle.trim()
    setSaving(true)
    setEditingEvent(null)
    await supabase.from('board_calendar_events').update({ title }).eq('id', ev.id)
    setSaving(false)
  }, [editTitle, supabase])

  const handleDeleteEvent = useCallback(async () => {
    const ev = editingRef.current
    if (!ev) return
    setSaving(true)
    await supabase.from('board_calendar_events').delete().eq('id', ev.id)
    setSaving(false)
    setEditingEvent(null)
  }, [supabase])

  const ctxValue = useMemo<CalCtx>(() => ({
    events,
    currentUserId,
    isOwner,
    onClose,
    showAddForm,
    addTitle,
    setAddTitle,
    selectedRange,
    onAddSubmit: handleAddSubmit,
    onCancelAdd: handleCancelAdd,
    editingEvent,
    editTitle,
    setEditTitle,
    onOpenEdit: handleOpenEdit,
    onCloseEdit: handleCloseEdit,
    onEditSubmit: handleEditSubmit,
    onDeleteEvent: handleDeleteEvent,
    saving,
  }), [
    events, currentUserId, isOwner, onClose,
    showAddForm, addTitle, selectedRange,
    handleAddSubmit, handleCancelAdd,
    editingEvent, editTitle,
    handleOpenEdit, handleCloseEdit, handleEditSubmit, handleDeleteEvent,
    saving,
  ])

  return (
    <div className="w-[616px]">
      <CalCtx.Provider value={ctxValue}>
        <GlassCalendar
          glassVariant="frosted"
          mode="range"
          numberOfMonths={2}
          showOutsideDays={false}
          selected={selectedRange}
          onSelect={handleSelect}
          className="w-full rounded-2xl [--cell-size:--spacing(9)]"
          classNames={{
            day: cn(
              'group/day relative w-full p-0 text-center select-none',
              '[&:last-child[data-selected=true]_button]:rounded-r-[var(--cell-radius)]',
              '[&:first-child[data-selected=true]_button]:rounded-l-[var(--cell-radius)]',
            ),
          }}
          components={CALENDAR_COMPONENTS as never}
        />
      </CalCtx.Provider>
    </div>
  )
}
