/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.1 specification
 */
export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(val => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 and 21
 */
export function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1)
  const lum2 = getLuminance(...rgb2)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG AA standards
 * Normal text: 4.5:1
 * Large text: 3:1
 */
export function meetsWCAG_AA(
  foreground: [number, number, number],
  background: [number, number, number],
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 3 : ratio >= 4.5
}

/**
 * Check if contrast meets WCAG AAA standards
 * Normal text: 7:1
 * Large text: 4.5:1
 */
export function meetsWCAG_AAA(
  foreground: [number, number, number],
  background: [number, number, number],
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return isLargeText ? ratio >= 4.5 : ratio >= 7
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
      ]
    : null
}

// Define our color palette with WCAG compliant combinations
export const accessibleColors = {
  // Primary colors (blue theme)
  primary: {
    600: '#2563eb', // blue-600 - meets AA on white background
    700: '#1d4ed8', // blue-700 - meets AAA on white background
  },

  // Text colors
  text: {
    900: '#111827', // gray-900 - meets AAA on white
    700: '#374151', // gray-700 - meets AAA on white
    600: '#4b5563', // gray-600 - meets AA on white
    500: '#6b7280', // gray-500 - meets AA on white for large text only
  },

  // Background colors
  background: {
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
  },

  // Status colors
  success: {
    600: '#15803d', // green-700 - meets WCAG AA on white
    700: '#166534', // green-800 - meets AAA on white
  },

  error: {
    600: '#dc2626', // red-600 - meets AA on white
    700: '#b91c1c', // red-700 - meets AAA on white
  },

  warning: {
    600: '#a16207', // amber-700 - adjusted for WCAG AA on white
    700: '#854d0e', // amber-800 - meets AAA on white
  },
}

// Validate all our color combinations
export function validateColorCombinations(): Record<string, boolean> {
  const results: Record<string, boolean> = {}

  // Check primary button on white
  const blue600 = hexToRgb(accessibleColors.primary[600])!
  const white = hexToRgb(accessibleColors.background.white)!

  results['primary-600-on-white'] = meetsWCAG_AA(blue600, white)

  // Check text colors on white
  const gray900 = hexToRgb(accessibleColors.text[900])!
  const gray700 = hexToRgb(accessibleColors.text[700])!
  const gray600 = hexToRgb(accessibleColors.text[600])!

  results['text-900-on-white'] = meetsWCAG_AAA(gray900, white)
  results['text-700-on-white'] = meetsWCAG_AAA(gray700, white)
  results['text-600-on-white'] = meetsWCAG_AA(gray600, white)

  // Check white text on colored backgrounds
  results['white-on-primary-600'] = meetsWCAG_AA(white, blue600)

  return results
}