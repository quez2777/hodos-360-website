const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Size thresholds (in KB)
const thresholds = {
  firstLoad: {
    excellent: 100,
    good: 200,
    warning: 300,
  },
  sharedByAll: {
    excellent: 75,
    good: 150,
    warning: 200,
  },
}

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB'
}

function getColorForSize(size, threshold) {
  const kb = size / 1024
  if (kb < threshold.excellent) return colors.green
  if (kb < threshold.good) return colors.yellow
  return colors.red
}

function analyzeBuildOutput() {
  console.log(`${colors.cyan}${colors.bright}🔍 Analyzing Next.js Build Output...${colors.reset}\n`)

  try {
    // Run next build if .next doesn't exist
    if (!fs.existsSync('.next')) {
      console.log(`${colors.yellow}Building project...${colors.reset}`)
      execSync('npm run build', { stdio: 'inherit' })
    }

    // Read build manifest
    const buildManifestPath = path.join('.next', 'build-manifest.json')
    const appBuildManifestPath = path.join('.next', 'app-build-manifest.json')
    
    if (!fs.existsSync(buildManifestPath)) {
      console.error(`${colors.red}Build manifest not found. Please run 'npm run build' first.${colors.reset}`)
      process.exit(1)
    }

    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'))
    
    // Analyze page sizes
    const pages = Object.keys(buildManifest.pages)
    
    console.log(`${colors.bright}📊 Page Bundle Sizes:${colors.reset}\n`)
    
    pages.forEach(page => {
      const files = buildManifest.pages[page]
      let totalSize = 0
      
      files.forEach(file => {
        const filePath = path.join('.next', 'static', file)
        if (fs.existsSync(filePath)) {
          totalSize += fs.statSync(filePath).size
        }
      })
      
      const color = getColorForSize(totalSize, thresholds.firstLoad)
      console.log(`  ${color}${page}: ${formatBytes(totalSize)}${colors.reset}`)
    })

    // Check for large modules
    console.log(`\n${colors.bright}⚠️  Performance Recommendations:${colors.reset}\n`)
    
    const recommendations = [
      '1. Use dynamic imports for below-fold components',
      '2. Implement React.memo for frequently re-rendering components',
      '3. Optimize images with next/image component',
      '4. Enable code splitting with dynamic imports',
      '5. Use CSS modules or styled-components for better tree-shaking',
      '6. Minimize third-party dependencies',
      '7. Enable compression in production',
      '8. Use next/font for optimal font loading',
    ]
    
    recommendations.forEach(rec => {
      console.log(`  ${colors.dim}• ${rec}${colors.reset}`)
    })

    // Core Web Vitals targets
    console.log(`\n${colors.bright}🎯 Core Web Vitals Targets:${colors.reset}\n`)
    console.log(`  ${colors.green}✓ LCP (Largest Contentful Paint): < 2.5s${colors.reset}`)
    console.log(`  ${colors.green}✓ FID (First Input Delay): < 100ms${colors.reset}`)
    console.log(`  ${colors.green}✓ CLS (Cumulative Layout Shift): < 0.1${colors.reset}`)
    console.log(`  ${colors.green}✓ FCP (First Contentful Paint): < 1.8s${colors.reset}`)
    console.log(`  ${colors.green}✓ TTFB (Time to First Byte): < 0.8s${colors.reset}`)

  } catch (error) {
    console.error(`${colors.red}Error analyzing build:${colors.reset}`, error.message)
    process.exit(1)
  }
}

// Run the analysis
analyzeBuildOutput()