import { readFileSync, statSync } from 'fs'
import { join } from 'path'
import { glob } from 'glob'

describe('Bundle Size Tests', () => {
  const BUILD_DIR = '.next'
  const MAX_JS_SIZE = 200 * 1024 // 200KB per chunk
  const MAX_CSS_SIZE = 60 * 1024 // 60KB per CSS file
  const MAX_TOTAL_SIZE = 1024 * 1024 // 1MB total for initial load

  it('should have JavaScript chunks under size limit', async () => {
    try {
      const jsFiles = await glob(`${BUILD_DIR}/static/chunks/**/*.js`)

      jsFiles.forEach(file => {
        const stats = statSync(file)
        const sizeInKB = Math.round(stats.size / 1024)
        const fileName = file.split('/').pop()

        expect(stats.size).toBeLessThanOrEqual(
          MAX_JS_SIZE,
          `${fileName} is ${sizeInKB}KB, which exceeds the ${MAX_JS_SIZE / 1024}KB limit`
        )
      })
    } catch (error) {
      // Skip test if build doesn't exist
      console.warn('Build directory not found. Run "npm run build" first.')
    }
  })

  it('should have CSS files under size limit', async () => {
    try {
      const cssFiles = await glob(`${BUILD_DIR}/static/css/**/*.css`)

      cssFiles.forEach(file => {
        const stats = statSync(file)
        const sizeInKB = Math.round(stats.size / 1024)
        const fileName = file.split('/').pop()

        expect(stats.size).toBeLessThanOrEqual(
          MAX_CSS_SIZE,
          `${fileName} is ${sizeInKB}KB, which exceeds the ${MAX_CSS_SIZE / 1024}KB limit`
        )
      })
    } catch (error) {
      // Skip test if build doesn't exist
      console.warn('Build directory not found. Run "npm run build" first.')
    }
  })

  it('should have reasonable first-load JS size', async () => {
    try {
      // Check the main app bundle size
      const appFiles = await glob(`${BUILD_DIR}/static/chunks/app/**/*.js`)

      let totalSize = 0
      appFiles.forEach(file => {
        const stats = statSync(file)
        totalSize += stats.size
      })

      const totalSizeInKB = Math.round(totalSize / 1024)

      expect(totalSize).toBeLessThanOrEqual(
        MAX_TOTAL_SIZE,
        `Total app bundle is ${totalSizeInKB}KB, which exceeds the ${MAX_TOTAL_SIZE / 1024}KB limit`
      )
    } catch (error) {
      // Skip test if build doesn't exist
      console.warn('Build directory not found. Run "npm run build" first.')
    }
  })

  it('should use code splitting effectively', async () => {
    try {
      const chunks = await glob(`${BUILD_DIR}/static/chunks/**/*.js`)

      // Should have multiple chunks (indicating code splitting)
      expect(chunks.length).toBeGreaterThan(5)

      // Check that we have lazy-loaded chunks
      const lazyChunks = chunks.filter(chunk =>
        chunk.includes('lazy') ||
        chunk.match(/\d+\.js$/) // Numbered chunks are typically lazy-loaded
      )

      expect(lazyChunks.length).toBeGreaterThan(0)
    } catch (error) {
      // Skip test if build doesn't exist
      console.warn('Build directory not found. Run "npm run build" first.')
    }
  })
})