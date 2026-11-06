import { hexToRgb } from './tokens'

function channel(value: number) {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(fg: string, bg: string) {
  const a = relativeLuminance(fg)
  const b = relativeLuminance(bg)
  const [light, dark] = a > b ? [a, b] : [b, a]
  return (light + 0.05) / (dark + 0.05)
}

export function wcagGrades(ratio: number) {
  return {
    aaLarge: ratio >= 3,
    aa: ratio >= 4.5,
    aaa: ratio >= 7,
  }
}
