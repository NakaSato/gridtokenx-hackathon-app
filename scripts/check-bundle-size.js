#!/usr/bin/env node

/**
 * Bundle Size Budget Checker
 * Fails CI if bundle exceeds defined thresholds
 */

const fs = require('fs');
const path = require('path');

// Bundle size budgets (in KB)
const BUDGETS = {
  // Server-side bundle (nodejs)
  'server-total': { max: 3000, warn: 2500 }, // 3MB max, warn at 2.5MB
  
  // Edge runtime bundle
  'edge-total': { max: 500, warn: 400 }, // 500KB max, warn at 400KB
  
  // Critical route bundles (first load)
  'page-home': { max: 300, warn: 250 }, // 300KB max
  'page-futures': { max: 400, warn: 350 }, // 400KB max (has charts)
  'page-portfolio': { max: 350, warn: 300 }, // 350KB max (has charts)
  'page-meter': { max: 500, warn: 450 }, // 500KB max (has map + WASM)
  
  // Vendor bundles
  'vendor-solana': { max: 600, warn: 500 }, // 600KB max
  'vendor-mapbox': { max: 200, warn: 180 }, // 200KB max (lazy loaded)
  'vendor-charts': { max: 150, warn: 120 }, // 150KB max
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
};

function formatSize(kb) {
  if (kb >= 1000) {
    return `${(kb / 1000).toFixed(2)}MB`;
  }
  return `${kb}KB`;
}

function checkBudget(name, sizeKB) {
  const budget = BUDGETS[name];
  if (!budget) return null;

  if (sizeKB > budget.max) {
    return {
      status: 'fail',
      color: colors.red,
      message: `❌ ${name}: ${formatSize(sizeKB)} exceeds max ${formatSize(budget.max)}`,
    };
  }

  if (sizeKB > budget.warn) {
    return {
      status: 'warn',
      color: colors.yellow,
      message: `⚠️  ${name}: ${formatSize(sizeKB)} exceeds warning ${formatSize(budget.warn)}`,
    };
  }

  return {
    status: 'pass',
    color: colors.green,
    message: `✅ ${name}: ${formatSize(sizeKB)} (budget: ${formatSize(budget.max)})`,
  };
}

function analyzeBundle() {
  console.log(`${colors.blue}📊 Checking bundle size budgets...${colors.reset}\n`);

  const buildDir = path.join(__dirname, '..', '.next');
  
  if (!fs.existsSync(buildDir)) {
    console.error(`${colors.red}Error: .next directory not found. Run 'bun run build' first.${colors.reset}`);
    process.exit(1);
  }

  // Try to read build manifest
  const buildManifestPath = path.join(buildDir, 'build-manifest.json');
  const routesManifestPath = path.join(buildDir, 'routes-manifest.json');
  
  let hasErrors = false;
  let hasWarnings = false;

  // Check if manifests exist
  if (fs.existsSync(buildManifestPath)) {
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    
    // Analyze page bundles
    if (buildManifest.pages) {
      for (const [route, files] of Object.entries(buildManifest.pages)) {
        const totalSize = files.reduce((sum, file) => {
          const filePath = path.join(buildDir, file);
          if (fs.existsSync(filePath)) {
            return sum + fs.statSync(filePath).size;
          }
          return sum;
        }, 0);

        const sizeKB = Math.round(totalSize / 1024);
        const pageName = `page-${route.replace('/', '') || 'home'}`;
        const result = checkBudget(pageName, sizeKB);
        
        if (result) {
          console.log(`${result.color}${result.message}${colors.reset}`);
          if (result.status === 'fail') hasErrors = true;
          if (result.status === 'warn') hasWarnings = true;
        }
      }
    }
  }

  // Check static chunks (vendor bundles)
  const staticChunksDir = path.join(buildDir, 'static/chunks');
  if (fs.existsSync(staticChunksDir)) {
    const files = fs.readdirSync(staticChunksDir);
    
    // Estimate vendor bundle sizes
    const solanaFiles = files.filter(f => f.includes('solana'));
    const mapboxFiles = files.filter(f => f.includes('mapbox'));
    const chartFiles = files.filter(f => f.includes('chart'));

    [
      { name: 'vendor-solana', files: solanaFiles },
      { name: 'vendor-mapbox', files: mapboxFiles },
      { name: 'vendor-charts', files: chartFiles },
    ].forEach(({ name, files }) => {
      const totalSize = files.reduce((sum, file) => {
        const filePath = path.join(staticChunksDir, file);
        return sum + fs.statSync(filePath).size;
      }, 0);

      const sizeKB = Math.round(totalSize / 1024);
      if (sizeKB > 0) {
        const result = checkBudget(name, sizeKB);
        if (result) {
          console.log(`${result.color}${result.message}${colors.reset}`);
          if (result.status === 'fail') hasErrors = true;
          if (result.status === 'warn') hasWarnings = true;
        }
      }
    });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (hasErrors) {
    console.log(`${colors.red}❌ Bundle size budget check FAILED${colors.reset}`);
    console.log(`${colors.yellow}💡 Tip: Use lazy loading, code splitting, or optimize dependencies${colors.reset}`);
    process.exit(1);
  } else if (hasWarnings) {
    console.log(`${colors.yellow}⚠️  Bundle size budget check completed with warnings${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.green}✅ Bundle size budget check PASSED${colors.reset}`);
    process.exit(0);
  }
}

// Run analysis
analyzeBundle();
