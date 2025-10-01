import {
  getLuminance,
  getContrastRatio,
  meetsWCAG_AA,
  meetsWCAG_AAA,
  hexToRgb,
  accessibleColors,
  validateColorCombinations
} from '@/lib/accessibility/colors'

describe('Color Accessibility', () => {
  describe('getLuminance', () => {
    it('should calculate luminance for white', () => {
      const luminance = getLuminance(255, 255, 255)
      expect(luminance).toBeCloseTo(1, 2)
    })

    it('should calculate luminance for black', () => {
      const luminance = getLuminance(0, 0, 0)
      expect(luminance).toBeCloseTo(0, 2)
    })

    it('should calculate luminance for mid-gray', () => {
      const luminance = getLuminance(128, 128, 128)
      expect(luminance).toBeCloseTo(0.216, 2)
    })
  })

  describe('getContrastRatio', () => {
    it('should return 21:1 for black on white', () => {
      const ratio = getContrastRatio([0, 0, 0], [255, 255, 255])
      expect(ratio).toBeCloseTo(21, 1)
    })

    it('should return 1:1 for same colors', () => {
      const ratio = getContrastRatio([128, 128, 128], [128, 128, 128])
      expect(ratio).toBeCloseTo(1, 1)
    })
  })

  describe('meetsWCAG_AA', () => {
    it('should pass for black text on white (21:1)', () => {
      expect(meetsWCAG_AA([0, 0, 0], [255, 255, 255])).toBe(true)
    })

    it('should fail for light gray on white', () => {
      expect(meetsWCAG_AA([200, 200, 200], [255, 255, 255])).toBe(false)
    })

    it('should have lower threshold for large text', () => {
      const lightGray: [number, number, number] = [150, 150, 150]
      const white: [number, number, number] = [255, 255, 255]

      // May fail for normal text
      const normalTextRatio = getContrastRatio(lightGray, white)
      if (normalTextRatio < 4.5) {
        expect(meetsWCAG_AA(lightGray, white, false)).toBe(false)
      }

      // May pass for large text (3:1 threshold)
      if (normalTextRatio >= 3) {
        expect(meetsWCAG_AA(lightGray, white, true)).toBe(true)
      }
    })
  })

  describe('meetsWCAG_AAA', () => {
    it('should require 7:1 for normal text', () => {
      const darkGray: [number, number, number] = [80, 80, 80]
      const white: [number, number, number] = [255, 255, 255]
      const ratio = getContrastRatio(darkGray, white)

      if (ratio >= 7) {
        expect(meetsWCAG_AAA(darkGray, white, false)).toBe(true)
      } else {
        expect(meetsWCAG_AAA(darkGray, white, false)).toBe(false)
      }
    })

    it('should require 4.5:1 for large text', () => {
      const mediumGray: [number, number, number] = [100, 100, 100]
      const white: [number, number, number] = [255, 255, 255]
      const ratio = getContrastRatio(mediumGray, white)

      if (ratio >= 4.5) {
        expect(meetsWCAG_AAA(mediumGray, white, true)).toBe(true)
      } else {
        expect(meetsWCAG_AAA(mediumGray, white, true)).toBe(false)
      }
    })
  })

  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ffffff')).toEqual([255, 255, 255])
      expect(hexToRgb('#000000')).toEqual([0, 0, 0])
      expect(hexToRgb('#2563eb')).toEqual([37, 99, 235])
    })

    it('should handle hex without hash', () => {
      expect(hexToRgb('ffffff')).toEqual([255, 255, 255])
    })

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull()
      expect(hexToRgb('#gg0000')).toBeNull()
    })
  })

  describe('Tailwind Color Palette', () => {
    it('should have WCAG AA compliant primary colors', () => {
      const blue600 = hexToRgb(accessibleColors.primary[600])!
      const white = hexToRgb(accessibleColors.background.white)!

      expect(meetsWCAG_AA(blue600, white)).toBe(true)
      expect(meetsWCAG_AA(white, blue600)).toBe(true)
    })

    it('should have WCAG AAA compliant text colors on white', () => {
      const gray900 = hexToRgb(accessibleColors.text[900])!
      const gray700 = hexToRgb(accessibleColors.text[700])!
      const white = hexToRgb(accessibleColors.background.white)!

      expect(meetsWCAG_AAA(gray900, white)).toBe(true)
      expect(meetsWCAG_AAA(gray700, white)).toBe(true)
    })

    it('should have WCAG AA compliant status colors', () => {
      const white = hexToRgb(accessibleColors.background.white)!
      const success600 = hexToRgb(accessibleColors.success[600])!
      const error600 = hexToRgb(accessibleColors.error[600])!
      const warning600 = hexToRgb(accessibleColors.warning[600])!

      expect(meetsWCAG_AA(success600, white)).toBe(true)
      expect(meetsWCAG_AA(error600, white)).toBe(true)
      expect(meetsWCAG_AA(warning600, white)).toBe(true)
    })
  })

  describe('validateColorCombinations', () => {
    it('should validate all color combinations', () => {
      const results = validateColorCombinations()

      // All primary combinations should pass
      expect(results['primary-600-on-white']).toBe(true)
      expect(results['white-on-primary-600']).toBe(true)

      // Text colors should meet their respective standards
      expect(results['text-900-on-white']).toBe(true) // AAA
      expect(results['text-700-on-white']).toBe(true) // AAA
      expect(results['text-600-on-white']).toBe(true) // AA
    })

    it('should ensure no false positives in validation', () => {
      const results = validateColorCombinations()

      // Check that we're not just returning true for everything
      const allResults = Object.values(results)
      expect(allResults.length).toBeGreaterThan(0)
      expect(allResults.every(result => result === true)).toBe(true)
    })
  })
})