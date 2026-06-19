'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Eye, Pencil, Trash2, X } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { GlassCalendar } from '@/components/ui/glasscn/glass-calendar'
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { GlassTooltipContent } from '@/components/ui/glasscn/glass-tooltip'
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

// ─── Types ────────────────────────────────────────────────────────────────────

type CalMode = 'view' | 'edit'

type EventWithAuthor = BoardCalendarEvent & {
  author?: { display_name: string; avatar_url: string | null } | null
}

// ─── Lane assignment ─────────────────────────────────────────────────────────
// Each event gets a fixed vertical lane for its entire duration via greedy
// interval scheduling. Overlapping events land in different lanes; the lane
// persists so an event never jumps up after a higher-priority event ends.

function computeLanes(events: EventWithAuthor[]): Map<string, number> {
  const sorted = [...events].sort(
    (a, b) => a.start_date.localeCompare(b.start_date) || a.id.localeCompare(b.id)
  )
  const laneMap = new Map<string, number>()
  const laneEnds: string[] = []

  for (const ev of sorted) {
    let lane = laneEnds.findIndex(end => end < ev.start_date)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(ev.end_date)
    } else {
      laneEnds[lane] = ev.end_date
    }
    laneMap.set(ev.id, lane)
  }
  return laneMap
}

// ─── Context ─────────────────────────────────────────────────────────────────

type CalCtx = {
  events: EventWithAuthor[]
  laneMap: Map<string, number>
  mode: CalMode
  onToggleMode: () => void
  currentUserId: string
  isOwner: boolean
  onClose: () => void
  hoveredEventId: string | null
  onHoverRibbon: (id: string | null) => void
  showAddForm: boolean
  addTitle: string
  setAddTitle: (v: string) => void
  selectedRange: DateRange | undefined
  onAddSubmit: (e: React.FormEvent) => void
  onCancelAdd: () => void
  editingEvent: EventWithAuthor | null
  editTitle: string
  setEditTitle: (v: string) => void
  onOpenEdit: (ev: EventWithAuthor) => void
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
      <div className="flex items-center justify-end px-4 pt-3.5 pb-2.5 border-b border-black/[0.07] dark:border-white/[0.08]">
        {/* View / Edit mode toggle */}
        <button
          type="button"
          onClick={ctx.onToggleMode}
          title={ctx.mode === 'view' ? 'Switch to edit mode' : 'Switch to view mode'}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded-full transition-colors',
            ctx.mode === 'edit'
              ? 'text-[#38bdf8] bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25'
              : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.06] dark:hover:bg-white/[0.08]',
          )}
        >
          {ctx.mode === 'edit' ? <Eye className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
        </button>
      </div>

      {/* Edit panel — only in edit mode */}
      {ctx.mode === 'edit' && ctx.editingEvent && (
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

      {/* Add form — only in edit mode, after completing a range selection */}
      {ctx.mode === 'edit' && ctx.showAddForm && (
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
  const isViewMode = ctx.mode === 'view'

  const dayEvents = ctx.events.filter(ev => isInRange(date, ev.start_date, ev.end_date))

  // Build ordered lane slots — empty lanes render as transparent spacers
  const maxLane = dayEvents.reduce((m, ev) => Math.max(m, ctx.laneMap.get(ev.id) ?? 0), -1)
  const laneSlots: (EventWithAuthor | null)[] = Array(maxLane + 1).fill(null)
  dayEvents.forEach(ev => { laneSlots[ctx.laneMap.get(ev.id) ?? 0] = ev })

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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0',
        // Date cell hover only in edit mode
        isViewMode
          ? 'cursor-default'
          : 'hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer',
        modifiers.today && !modifiers.selected && 'bg-muted',
        modifiers.outside && 'text-muted-foreground opacity-40',
        modifiers.disabled && 'text-muted-foreground opacity-30 pointer-events-none',
        // Range selection highlight only in edit mode
        !isViewMode && 'data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
        !isViewMode && 'data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-start=true]:rounded-r-none',
        !isViewMode && 'data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground data-[range-end=true]:rounded-l-none',
        !isViewMode && 'data-[range-middle=true]:bg-muted data-[range-middle=true]:rounded-none',
        className,
      )}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      <span className="text-xs leading-none pt-1.5 shrink-0">{children}</span>

      {laneSlots.length > 0 && (
        <div className="flex flex-col gap-[2px] w-full mt-0.5">
          {laneSlots.map((ev, lane) => {
            if (!ev) {
              return <div key={`spacer-${lane}`} className="h-[16px] w-full shrink-0" />
            }
            const isStart = dateStr === ev.start_date
            const isEnd = dateStr === ev.end_date
            const isSingle = isStart && isEnd
            const showLabel = isStart || isSingle

            const ribbonInner = (
              <>
                {/* Ribbon fill */}
                <div
                  style={{ backgroundColor: `${ev.color}28` }}
                  className={cn(
                    'absolute inset-0 transition-[filter] duration-100',
                    isSingle ? 'rounded-full'
                    : isStart ? 'rounded-l-full'
                    : isEnd ? 'rounded-r-full'
                    : '',
                    isViewMode && ctx.hoveredEventId === ev.id && 'brightness-75',
                  )}
                />
                {/* Avatar */}
                {showLabel && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full overflow-hidden border-2 border-white/70 z-10 shrink-0"
                    style={{ backgroundColor: ev.color }}
                  >
                    {ev.author?.avatar_url ? (
                      <img src={ev.author.avatar_url} alt="" className="w-full h-full object-cover" draggable={false} />
                    ) : (
                      <span className="flex h-full items-center justify-center text-[7px] font-bold text-white leading-none select-none">
                        {(ev.author?.display_name ?? '?')[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                {/* Title */}
                {showLabel && (
                  <span
                    className="absolute left-[22px] right-0.5 inset-y-0 flex items-center text-[9px] font-semibold truncate leading-none"
                    style={{ color: ev.color }}
                  >
                    {ev.title}
                  </span>
                )}
              </>
            )

            if (isViewMode) {
              return (
                <Tooltip key={ev.id}>
                  <TooltipTrigger
                    render={<div />}
                    onMouseEnter={() => ctx.onHoverRibbon(ev.id)}
                    onMouseLeave={() => ctx.onHoverRibbon(null)}
                    onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
                    className={cn(
                      'relative h-[16px] w-full cursor-pointer shrink-0',
                      isSingle && 'self-center !w-[calc(100%-6px)]',
                    )}
                  >
                    {ribbonInner}
                  </TooltipTrigger>
                  <GlassTooltipContent
                    side="top"
                    align="start"
                    sideOffset={6}
                    className="min-w-[160px] max-w-[220px]"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ backgroundColor: ev.color }}
                      >
                        {ev.author?.avatar_url ? (
                          <img src={ev.author.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[8px] font-bold text-white leading-none">
                            {(ev.author?.display_name ?? '?')[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{ev.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{ev.author?.display_name ?? 'Unknown'}</p>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                      {ev.start_date === ev.end_date
                        ? fmtStored(ev.start_date)
                        : `${fmtStored(ev.start_date)} – ${fmtStored(ev.end_date)}`}
                    </p>
                  </GlassTooltipContent>
                </Tooltip>
              )
            }

            // Edit mode ribbon — click opens edit panel
            return (
              <div
                key={ev.id}
                onClick={e => { e.stopPropagation(); ctx.onOpenEdit(ev) }}
                onMouseDown={e => e.stopPropagation()}
                onMouseEnter={() => ctx.onHoverRibbon(ev.id)}
                onMouseLeave={() => ctx.onHoverRibbon(null)}
                title={ev.title}
                className={cn(
                  'relative h-[16px] w-full cursor-pointer shrink-0',
                  isSingle && 'self-center !w-[calc(100%-6px)]',
                )}
              >
                {ribbonInner}
              </div>
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
  const [events, setEvents] = useState<EventWithAuthor[]>([])
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null)
  const [mode, setMode] = useState<CalMode>('view')
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>()
  const [editingEvent, setEditingEvent] = useState<EventWithAuthor | null>(null)
  const [addTitle, setAddTitle] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const editingRef = useRef<EventWithAuthor | null>(null)
  editingRef.current = editingEvent
  const modeRef = useRef<CalMode>('view')
  modeRef.current = mode

  const laneMap = useMemo(() => computeLanes(events), [events])

  const showAddForm = !!(selectedRange?.from && selectedRange?.to) && !editingEvent

  // Initial fetch — join author profile for avatar/name in ribbons
  useEffect(() => {
    supabase
      .from('board_calendar_events')
      .select('*, author:profiles(display_name, avatar_url)')
      .eq('board_id', boardId)
      .then(({ data }) => { if (data) setEvents(data as EventWithAuthor[]) })
  }, [boardId, supabase])

  // Realtime sync
  useEffect(() => {
    const ch = supabase
      .channel(`calendar:${boardId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'board_calendar_events' }, p => {
        if (p.eventType === 'INSERT') {
          const ev = p.new as BoardCalendarEvent
          if (ev.board_id !== boardId) return
          supabase
            .from('board_calendar_events')
            .select('*, author:profiles(display_name, avatar_url)')
            .eq('id', ev.id)
            .single()
            .then(({ data }) => {
              if (data) setEvents(prev => prev.some(e => e.id === data.id) ? prev : [...prev, data as EventWithAuthor])
            })
        } else if (p.eventType === 'UPDATE') {
          const ev = p.new as BoardCalendarEvent
          if (ev.board_id === boardId) setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, ...ev } : e))
        } else if (p.eventType === 'DELETE') {
          setEvents(prev => prev.filter(e => e.id !== (p.old as { id: string }).id))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [boardId, supabase])

  // Block selection in view mode via modeRef to keep handleSelect stable
  const handleSelect = useCallback((range: DateRange | undefined) => {
    if (editingRef.current) return
    if (modeRef.current === 'view') return
    setSelectedRange(range)
  }, [])

  const handleToggleMode = useCallback(() => {
    setMode(prev => {
      if (prev === 'edit') {
        // Returning to view — clear any in-progress edit/add state
        setSelectedRange(undefined)
        setEditingEvent(null)
        setAddTitle('')
      }
      return prev === 'view' ? 'edit' : 'view'
    })
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
    const { data } = await supabase
      .from('board_calendar_events')
      .insert({
        board_id: boardId,
        author_id: currentUserId,
        title,
        start_date: toDateStr(from),
        end_date: toDateStr(to),
        color: getAvatarColor(currentUserId),
      })
      .select('*, author:profiles(display_name, avatar_url)')
      .single()
    if (data) setEvents(prev => prev.some(e => e.id === (data as EventWithAuthor).id) ? prev : [...prev, data as EventWithAuthor])
    setSaving(false)
  }, [selectedRange, addTitle, boardId, currentUserId, supabase])

  const handleCancelAdd = useCallback(() => {
    setSelectedRange(undefined)
    setAddTitle('')
  }, [])

  const handleOpenEdit = useCallback((ev: EventWithAuthor) => {
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
    setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, title } : e))
    await supabase.from('board_calendar_events').update({ title }).eq('id', ev.id)
    setSaving(false)
  }, [editTitle, supabase])

  const handleHoverRibbon = useCallback((id: string | null) => setHoveredEventId(id), [])

  const handleDeleteEvent = useCallback(async () => {
    const ev = editingRef.current
    if (!ev) return
    setSaving(true)
    setEditingEvent(null)
    setEvents(prev => prev.filter(e => e.id !== ev.id))
    await supabase.from('board_calendar_events').delete().eq('id', ev.id)
    setSaving(false)
  }, [supabase])

  const ctxValue = useMemo<CalCtx>(() => ({
    events,
    laneMap,
    mode,
    onToggleMode: handleToggleMode,
    currentUserId,
    isOwner,
    onClose,
    hoveredEventId,
    onHoverRibbon: handleHoverRibbon,
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
    events, laneMap, mode, handleToggleMode, currentUserId, isOwner, onClose,
    hoveredEventId, handleHoverRibbon,
    showAddForm, addTitle, selectedRange,
    handleAddSubmit, handleCancelAdd,
    editingEvent, editTitle,
    handleOpenEdit, handleCloseEdit, handleEditSubmit, handleDeleteEvent,
    saving,
  ])

  return (
    <div className="w-[616px]">
      <TooltipProvider delay={400}>
      <CalCtx.Provider value={ctxValue}>
        <GlassCalendar
          glassVariant="frosted"
          mode="range"
          numberOfMonths={2}
          showOutsideDays={false}
          // No selection highlight in view mode
          selected={mode === 'view' ? undefined : selectedRange}
          onSelect={handleSelect}
          className="w-full rounded-none [--cell-size:--spacing(9)] !bg-transparent !shadow-none !border-0 !backdrop-blur-none !backdrop-saturate-[1]"
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
      </TooltipProvider>
    </div>
  )
}
