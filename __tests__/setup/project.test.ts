import * as fs from 'fs'
import * as path from 'path'

describe('Project Setup', () => {
  it('should have Next.js configuration', () => {
    const configPath = path.join(process.cwd(), 'next.config.js')
    expect(fs.existsSync(configPath)).toBe(true)
  })

  it('should have TypeScript configuration with strict mode', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json')
    expect(fs.existsSync(tsconfigPath)).toBe(true)

    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
    expect(tsconfig.compilerOptions.strict).toBe(true)
  })

  it('should have Tailwind CSS configuration', () => {
    const tailwindPath = path.join(process.cwd(), 'tailwind.config.ts')
    expect(fs.existsSync(tailwindPath)).toBe(true)
  })

  it('should have correct project structure', () => {
    const requiredDirs = [
      'src/app',
      'src/components',
      'src/lib',
      'src/types'
    ]

    requiredDirs.forEach(dir => {
      const dirPath = path.join(process.cwd(), dir)
      expect(fs.existsSync(dirPath)).toBe(true)
    })
  })
})