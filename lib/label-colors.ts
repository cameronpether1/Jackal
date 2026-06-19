export const LABEL_COLORS = [
  { id: 'red',   hex: '#ef4444', name: 'Red'   },
  { id: 'blue',  hex: '#3b82f6', name: 'Blue'  },
  { id: 'green', hex: '#22c55e', name: 'Green' },
  { id: 'pink',  hex: '#ec4899', name: 'Pink'  },
  { id: 'grey',  hex: '#9ca3af', name: 'Grey'  },
] as const

export type LabelColor = typeof LABEL_COLORS[number]['id']
