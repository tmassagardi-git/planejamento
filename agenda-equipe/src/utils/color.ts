// Curated, vivid palette — kept distinct enough to tell clients apart at a glance.
export const PALETTE = [
  '#F43F5E', // rose
  '#FB923C', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#78716C', // stone
  '#64748B', // slate
]

export function nextPaletteColor(usedColors: string[]): string {
  const unused = PALETTE.find((c) => !usedColors.includes(c))
  if (unused) return unused
  return PALETTE[usedColors.length % PALETTE.length]
}

// Perceived luminance -> pick black or white text for contrast.
export function textColorFor(bgHex: string): string {
  const hex = bgHex.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#1E293B' : '#FFFFFF'
}

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
