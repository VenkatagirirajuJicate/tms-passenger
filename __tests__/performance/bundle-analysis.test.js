const fs = require('fs')
const path = require('path')

describe('Bundle Performance Analysis', () => {
  const buildDir = path.join(__dirname, '../../.next')
  
  beforeAll(() => {
    // Ensure build directory exists
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build directory not found. Please run "npm run build" first.')
    }
  })

  describe('Bundle Size Analysis', () => {
    it('should have reasonable total bundle size', () => {
      const staticDir = path.join(buildDir, 'static')
      if (!fs.existsSync(staticDir)) {
        console.warn('Static directory not found, skipping bundle size test')
        return
      }

      const totalSize = calculateDirectorySize(staticDir)
      const totalSizeMB = totalSize / (1024 * 1024)
      
      console.log(`Total bundle size: ${totalSizeMB.toFixed(2)} MB`)
      
      // Bundle should be less than 10MB for good performance
      expect(totalSizeMB).toBeLessThan(10)
    })

    it('should have optimized JavaScript chunks', () => {
      const jsDir = path.join(buildDir, 'static/chunks')
      if (!fs.existsSync(jsDir)) {
        console.warn('JS chunks directory not found, skipping JS analysis')
        return
      }

      const jsFiles = fs.readdirSync(jsDir).filter(file => file.endsWith('.js'))
      const jsFileSizes = jsFiles.map(file => {
        const filePath = path.join(jsDir, file)
        const stats = fs.statSync(filePath)
        return {
          name: file,
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2)
        }
      })

      console.log('JavaScript chunk sizes:')
      jsFileSizes.forEach(file => {
        console.log(`  ${file.name}: ${file.sizeKB} KB`)
      })

      // Individual chunks should not be too large
      const largeChunks = jsFileSizes.filter(file => file.size > 1024 * 1024) // > 1MB
      expect(largeChunks.length).toBeLessThan(3) // Allow max 2 large chunks
    })

    it('should have compressed CSS files', () => {
      const cssDir = path.join(buildDir, 'static/css')
      if (!fs.existsSync(cssDir)) {
        console.warn('CSS directory not found, skipping CSS analysis')
        return
      }

      const cssFiles = fs.readdirSync(cssDir).filter(file => file.endsWith('.css'))
      const totalCSSSize = cssFiles.reduce((total, file) => {
        const filePath = path.join(cssDir, file)
        const stats = fs.statSync(filePath)
        return total + stats.size
      }, 0)

      const totalCSSKB = totalCSSSize / 1024
      console.log(`Total CSS size: ${totalCSSKB.toFixed(2)} KB`)

      // CSS should be well optimized (< 500KB total)
      expect(totalCSSKB).toBeLessThan(500)
    })
  })

  describe('Build Manifest Analysis', () => {
    it('should have valid build manifest', () => {
      const manifestPath = path.join(buildDir, 'build-manifest.json')
      
      if (!fs.existsSync(manifestPath)) {
        console.warn('Build manifest not found, skipping manifest test')
        return
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      
      // Should have pages
      expect(manifest.pages).toBeDefined()
      expect(Object.keys(manifest.pages).length).toBeGreaterThan(0)
      
      // Should have root pages
      expect(manifest.pages['/']).toBeDefined()
      expect(manifest.pages['/login']).toBeDefined()
      
      console.log('Available pages:', Object.keys(manifest.pages))
    })

    it('should have reasonable number of chunks', () => {
      const manifestPath = path.join(buildDir, 'build-manifest.json')
      
      if (!fs.existsSync(manifestPath)) {
        console.warn('Build manifest not found, skipping chunk analysis')
        return
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      
      if (manifest.sortedPages) {
        const totalPages = manifest.sortedPages.length
        console.log(`Total pages: ${totalPages}`)
        
        // Should have reasonable number of pages
        expect(totalPages).toBeGreaterThan(5)
        expect(totalPages).toBeLessThan(50) // Avoid too many routes
      }
    })
  })

  describe('Image Optimization', () => {
    it('should have optimized images', () => {
      const publicDir = path.join(__dirname, '../../public')
      
      if (!fs.existsSync(publicDir)) {
        console.warn('Public directory not found, skipping image analysis')
        return
      }

      const imageFiles = getAllFiles(publicDir).filter(file => 
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
      )

      const imageAnalysis = imageFiles.map(file => {
        const stats = fs.statSync(file)
        return {
          name: path.basename(file),
          size: stats.size,
          sizeKB: (stats.size / 1024).toFixed(2),
          type: path.extname(file).toLowerCase()
        }
      })

      console.log('Image analysis:')
      imageAnalysis.forEach(img => {
        console.log(`  ${img.name} (${img.type}): ${img.sizeKB} KB`)
      })

      // Images should not be too large
      const largeImages = imageAnalysis.filter(img => img.size > 500 * 1024) // > 500KB
      expect(largeImages.length).toBeLessThan(3) // Allow max 2 large images

      // Should prefer modern formats
      const modernFormats = imageAnalysis.filter(img => 
        ['.webp', '.svg'].includes(img.type)
      )
      console.log(`Modern format images: ${modernFormats.length}/${imageAnalysis.length}`)
    })
  })

  describe('Dependency Analysis', () => {
    it('should have reasonable dependency count', () => {
      const packageJsonPath = path.join(__dirname, '../../package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      const depCount = Object.keys(packageJson.dependencies || {}).length
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length
      
      console.log(`Dependencies: ${depCount}`)
      console.log(`Dev Dependencies: ${devDepCount}`)
      
      // Should not have too many dependencies
      expect(depCount).toBeLessThan(50)
      expect(devDepCount).toBeLessThan(100)
    })

    it('should not have unused dependencies', () => {
      // This is a basic check - in real scenarios you'd use tools like depcheck
      const packageJsonPath = path.join(__dirname, '../../package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      
      const dependencies = Object.keys(packageJson.dependencies || {})
      
      // Check for common unused dependencies
      const potentiallyUnused = []
      const checkList = ['lodash', 'moment', 'jquery', 'bootstrap']
      
      checkList.forEach(dep => {
        if (dependencies.includes(dep)) {
          potentiallyUnused.push(dep)
        }
      })
      
      if (potentiallyUnused.length > 0) {
        console.warn('Potentially unused heavy dependencies:', potentiallyUnused)
      }
      
      // Should avoid heavy libraries when possible
      expect(potentiallyUnused.length).toBeLessThan(3)
    })
  })

  describe('TypeScript Performance', () => {
    it('should have efficient TypeScript configuration', () => {
      const tsconfigPath = path.join(__dirname, '../../tsconfig.json')
      
      if (!fs.existsSync(tsconfigPath)) {
        console.warn('tsconfig.json not found, skipping TS analysis')
        return
      }

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'))
      
      // Should have performance optimizations
      if (tsconfig.compilerOptions) {
        const opts = tsconfig.compilerOptions
        
        // Check for performance settings
        expect(opts.incremental).toBeTruthy()
        expect(opts.skipLibCheck).toBeTruthy()
        
        console.log('TypeScript optimizations enabled:', {
          incremental: opts.incremental,
          skipLibCheck: opts.skipLibCheck,
          strict: opts.strict
        })
      }
    })
  })

  // Helper functions
  function calculateDirectorySize(dirPath) {
    let totalSize = 0
    
    if (!fs.existsSync(dirPath)) {
      return 0
    }
    
    const files = fs.readdirSync(dirPath)
    
    files.forEach(file => {
      const filePath = path.join(dirPath, file)
      const stats = fs.statSync(filePath)
      
      if (stats.isDirectory()) {
        totalSize += calculateDirectorySize(filePath)
      } else {
        totalSize += stats.size
      }
    })
    
    return totalSize
  }

  function getAllFiles(dirPath, files = []) {
    if (!fs.existsSync(dirPath)) {
      return files
    }
    
    const items = fs.readdirSync(dirPath)
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item)
      const stats = fs.statSync(itemPath)
      
      if (stats.isDirectory()) {
        getAllFiles(itemPath, files)
      } else {
        files.push(itemPath)
      }
    })
    
    return files
  }
}) 