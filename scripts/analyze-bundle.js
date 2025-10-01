#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🔍 Analyzing bundle sizes...\n')

// Build the project if needed
if (!fs.existsSync('.next')) {
  console.log('📦 Building project first...')
  execSync('npm run build', { stdio: 'inherit' })
}

// Read build manifest
const buildManifestPath = '.next/build-manifest.json'
const appBuildManifestPath = '.next/app-build-manifest.json'

if (!fs.existsSync(buildManifestPath)) {
  console.error('❌ Build manifest not found. Please run "npm run build" first.')
  process.exit(1)
}

// Helper to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper to get file size
function getFileSize(filePath) {
  try {
    const fullPath = path.join('.next', filePath)
    if (fs.existsSync(fullPath)) {
      return fs.statSync(fullPath).size
    }
  } catch (error) {
    // File might not exist
  }
  return 0
}

// Analyze JavaScript bundles
console.log('📊 JavaScript Bundle Analysis:')
console.log('================================')

const jsFiles = []
const cssFiles = []

// Collect all JS files
function collectFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir)
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        collectFiles(fullPath, files)
      } else if (item.endsWith('.js')) {
        jsFiles.push({
          path: fullPath,
          size: stat.size,
          name: fullPath.replace('.next/', '')
        })
      } else if (item.endsWith('.css')) {
        cssFiles.push({
          path: fullPath,
          size: stat.size,
          name: fullPath.replace('.next/', '')
        })
      }
    }
  } catch (error) {
    // Directory might not exist
  }
}

collectFiles('.next/static')

// Sort by size
jsFiles.sort((a, b) => b.size - a.size)
cssFiles.sort((a, b) => b.size - a.size)

// Show top 10 largest JS files
console.log('\n🔝 Top 10 Largest JavaScript Files:')
jsFiles.slice(0, 10).forEach((file, index) => {
  console.log(`  ${index + 1}. ${file.name}: ${formatBytes(file.size)}`)
})

// Calculate totals
const totalJsSize = jsFiles.reduce((sum, file) => sum + file.size, 0)
const totalCssSize = cssFiles.reduce((sum, file) => sum + file.size, 0)

console.log('\n📈 Bundle Size Summary:')
console.log('=======================')
console.log(`Total JavaScript: ${formatBytes(totalJsSize)} (${jsFiles.length} files)`)
console.log(`Total CSS: ${formatBytes(totalCssSize)} (${cssFiles.length} files)`)
console.log(`Total Static Assets: ${formatBytes(totalJsSize + totalCssSize)}`)

// Check against targets
const MAX_JS_SIZE = 1024 * 1024 // 1MB
const MAX_CSS_SIZE = 200 * 1024 // 200KB
const MAX_CHUNK_SIZE = 244 * 1024 // 244KB (recommended)

console.log('\n✅ Performance Targets:')
console.log('=======================')

// JS size check
if (totalJsSize > MAX_JS_SIZE) {
  console.log(`❌ JavaScript exceeds target: ${formatBytes(totalJsSize)} > ${formatBytes(MAX_JS_SIZE)}`)
} else {
  console.log(`✅ JavaScript within target: ${formatBytes(totalJsSize)} < ${formatBytes(MAX_JS_SIZE)}`)
}

// CSS size check
if (totalCssSize > MAX_CSS_SIZE) {
  console.log(`❌ CSS exceeds target: ${formatBytes(totalCssSize)} > ${formatBytes(MAX_CSS_SIZE)}`)
} else {
  console.log(`✅ CSS within target: ${formatBytes(totalCssSize)} < ${formatBytes(MAX_CSS_SIZE)}`)
}

// Large chunks check
const largeChunks = jsFiles.filter(file => file.size > MAX_CHUNK_SIZE)
if (largeChunks.length > 0) {
  console.log(`⚠️  ${largeChunks.length} chunks exceed ${formatBytes(MAX_CHUNK_SIZE)}:`)
  largeChunks.slice(0, 5).forEach(chunk => {
    console.log(`   - ${chunk.name}: ${formatBytes(chunk.size)}`)
  })
} else {
  console.log(`✅ All chunks under ${formatBytes(MAX_CHUNK_SIZE)}`)
}

// Code splitting analysis
console.log('\n🔄 Code Splitting Analysis:')
console.log('============================')

const dynamicChunks = jsFiles.filter(file =>
  file.name.includes('/chunks/') &&
  !file.name.includes('framework') &&
  !file.name.includes('main')
)

console.log(`Dynamic chunks: ${dynamicChunks.length}`)
console.log(`Average chunk size: ${formatBytes(totalJsSize / jsFiles.length)}`)

// Check for duplicate modules (simplified)
const modulePatterns = new Map()
jsFiles.forEach(file => {
  const match = file.name.match(/(\w+)-[\w\d]+\.js$/)
  if (match) {
    const moduleName = match[1]
    if (!modulePatterns.has(moduleName)) {
      modulePatterns.set(moduleName, [])
    }
    modulePatterns.get(moduleName).push(file)
  }
})

const duplicates = Array.from(modulePatterns.entries())
  .filter(([_, files]) => files.length > 1)

if (duplicates.length > 0) {
  console.log('\n⚠️  Potential duplicate modules:')
  duplicates.forEach(([name, files]) => {
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)
    console.log(`   ${name}: ${files.length} instances (${formatBytes(totalSize)} total)`)
  })
}

// Route-based analysis
console.log('\n🛤️  Route-based Analysis:')
console.log('========================')

const routeChunks = new Map()
jsFiles.forEach(file => {
  if (file.name.includes('app/')) {
    const routeMatch = file.name.match(/app\/([^/]+)/)
    if (routeMatch) {
      const route = routeMatch[1]
      if (!routeChunks.has(route)) {
        routeChunks.set(route, { count: 0, size: 0 })
      }
      routeChunks.get(route).count++
      routeChunks.get(route).size += file.size
    }
  }
})

Array.from(routeChunks.entries())
  .sort((a, b) => b[1].size - a[1].size)
  .slice(0, 5)
  .forEach(([route, data]) => {
    console.log(`   /${route}: ${formatBytes(data.size)} (${data.count} chunks)`)
  })

console.log('\n✨ Analysis complete!')

// Generate report file
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalJsSize,
    totalCssSize,
    totalSize: totalJsSize + totalCssSize,
    jsFileCount: jsFiles.length,
    cssFileCount: cssFiles.length,
  },
  performance: {
    jsWithinTarget: totalJsSize <= MAX_JS_SIZE,
    cssWithinTarget: totalCssSize <= MAX_CSS_SIZE,
    largeChunksCount: largeChunks.length,
  },
  topFiles: jsFiles.slice(0, 10).map(f => ({
    name: f.name,
    size: f.size,
  })),
}

fs.writeFileSync(
  'bundle-analysis.json',
  JSON.stringify(report, null, 2)
)

console.log('📄 Detailed report saved to bundle-analysis.json')

// Exit with error if targets not met
if (totalJsSize > MAX_JS_SIZE || totalCssSize > MAX_CSS_SIZE) {
  process.exit(1)
}