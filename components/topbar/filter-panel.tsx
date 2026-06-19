'use client'

import { motion, AnimatePresence } from 'motion/react'
import { LABEL_COLORS, type LabelColor } from '@/lib/label-colors'
import { cn } from '@/lib/utils'

interface FilterPanelProps {
  open: boolean
  activeFilters: LabelColor[]
  onToggleFilter: (color: LabelColor) => void
  onClearFilters: () => void
}

export function FilterPanel({ open, activeFilters, onToggleFilter, onClearFilters }: FilterPanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
        >
          <div className="bg-[#1c1b19] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.07)] p-3 flex flex-col gap-3 min-w-[160px]">
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-1">Filter by colour</span>

            <div className="flex items-center gap-2 px-1">
              {LABEL_COLORS.map(({ id, hex, name }) => {
                const active = activeFilters.includes(id as LabelColor)
                return (
                  <button
                    key={id}
                    title={name}
                    onClick={() => onToggleFilter(id as LabelColor)}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all duration-150 flex items-center justify-center',
                      active
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1c1b19] scale-110'
                        : 'opacity-60 hover:opacity-100 hover:scale-105',
                    )}
                    style={{ backgroundColor: hex }}
                  />
                )
              })}
            </div>

            {activeFilters.length > 0 && (
              <button
                onClick={onClearFilters}
                className="text-[11px] font-medium text-white/40 hover:text-white/70 transition-colors text-left px-1"
              >
                Clear all
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
