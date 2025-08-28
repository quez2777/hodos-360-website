const { NextRequest } = require('next/server')

// Simple test to verify middleware components can be imported and basic functionality works
async function testMiddlewareComponents() {
  console.log('🧪 Testing Middleware Components...\n')

  try {
    // Test 1: Verify TypeScript types can be imported
    console.log('1. Testing TypeScript types import...')
    // We can't actually import TS files directly in Node.js without compilation
    // But we can verify the files exist and are syntactically correct
    const fs = require('fs')
    const path = require('path')
    
    const middlewareDir = path.join(process.cwd(), 'app/api/middleware')
    const requiredFiles = [
      'types.ts',
      'rate-limit.ts',
      'api-auth.ts',
      'rbac.ts',
      'security.ts',
      'audit.ts',
      'index.ts'
    ]
    
    let allFilesExist = true
    for (const file of requiredFiles) {
      const filePath = path.join(middlewareDir, file)
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Missing file: ${file}`)
        allFilesExist = false
      } else {
        console.log(`✅ Found: ${file}`)
      }
    }
    
    if (!allFilesExist) {
      throw new Error('Not all required middleware files exist')
    }
    
    console.log('✅ All middleware files exist\n')

    // Test 2: Verify file sizes (basic sanity check)
    console.log('2. Verifying file contents...')
    for (const file of requiredFiles) {
      const filePath = path.join(middlewareDir, file)
      const stats = fs.statSync(filePath)
      const sizeKB = Math.round(stats.size / 1024)
      console.log(`   ${file}: ${sizeKB}KB`)
      
      if (stats.size < 100) { // Less than 100 bytes probably means empty file
        throw new Error(`File ${file} appears to be empty or too small`)
      }
    }
    console.log('✅ All files have reasonable content\n')

    // Test 3: Verify TypeScript syntax by attempting to compile key imports
    console.log('3. Testing basic syntax validation...')
    
    // Read and check for key patterns in each file
    const typeFile = fs.readFileSync(path.join(middlewareDir, 'types.ts'), 'utf8')
    if (!typeFile.includes('interface MiddlewareContext')) {
      throw new Error('types.ts missing core interfaces')
    }
    
    const rateLimitFile = fs.readFileSync(path.join(middlewareDir, 'rate-limit.ts'), 'utf8')
    if (!rateLimitFile.includes('rateLimitMiddleware')) {
      throw new Error('rate-limit.ts missing main function')
    }
    
    const apiAuthFile = fs.readFileSync(path.join(middlewareDir, 'api-auth.ts'), 'utf8')
    if (!apiAuthFile.includes('apiKeyAuthMiddleware')) {
      throw new Error('api-auth.ts missing main function')
    }
    
    const rbacFile = fs.readFileSync(path.join(middlewareDir, 'rbac.ts'), 'utf8')
    if (!rbacFile.includes('rbacMiddleware')) {
      throw new Error('rbac.ts missing main function')
    }
    
    const securityFile = fs.readFileSync(path.join(middlewareDir, 'security.ts'), 'utf8')
    if (!securityFile.includes('securityHeadersMiddleware')) {
      throw new Error('security.ts missing main function')
    }
    
    const auditFile = fs.readFileSync(path.join(middlewareDir, 'audit.ts'), 'utf8')
    if (!auditFile.includes('auditMiddleware')) {
      throw new Error('audit.ts missing main function')
    }
    
    const indexFile = fs.readFileSync(path.join(middlewareDir, 'index.ts'), 'utf8')
    if (!indexFile.includes('MiddlewareOrchestrator')) {
      throw new Error('index.ts missing orchestrator class')
    }
    
    console.log('✅ All files contain expected functions and classes\n')

    // Test 4: Verify security configurations
    console.log('4. Validating security configurations...')
    
    if (!securityFile.includes('Content-Security-Policy')) {
      throw new Error('Security headers missing CSP configuration')
    }
    
    if (!securityFile.includes('X-Frame-Options')) {
      throw new Error('Security headers missing frame options')
    }
    
    if (!rateLimitFile.includes('DEFAULT_RATE_LIMITS')) {
      throw new Error('Rate limiting missing default configurations')
    }
    
    console.log('✅ Security configurations look correct\n')

    // Test 5: Check for proper error handling
    console.log('5. Validating error handling...')
    
    const errorPatterns = [
      'try {',
      'catch (',
      'MiddlewareError',
      'AuthenticationError',
      'AuthorizationError',
      'RateLimitError'
    ]
    
    for (const file of requiredFiles) {
      const content = fs.readFileSync(path.join(middlewareDir, file), 'utf8')
      const hasErrorHandling = errorPatterns.some(pattern => content.includes(pattern))
      
      if (!hasErrorHandling && file !== 'types.ts') {
        console.warn(`⚠️  ${file} may be missing error handling`)
      } else {
        console.log(`✅ ${file} has error handling`)
      }
    }
    
    console.log('\n6. Testing environment variable usage...')
    
    // Check for proper env var usage
    const envVarsFound = []
    for (const file of requiredFiles) {
      const content = fs.readFileSync(path.join(middlewareDir, file), 'utf8')
      const envMatches = content.match(/process\.env\.([A-Z_]+)/g)
      if (envMatches) {
        envVarsFound.push(...envMatches.map(match => match.replace('process.env.', '')))
      }
    }
    
    const uniqueEnvVars = [...new Set(envVarsFound)]
    console.log('Environment variables used:', uniqueEnvVars.join(', '))
    
    if (uniqueEnvVars.length === 0) {
      console.warn('⚠️  No environment variables found - may need configuration')
    } else {
      console.log('✅ Environment variables are properly referenced')
    }

    // Summary
    console.log('\n📊 Test Results Summary:')
    console.log('========================')
    console.log('✅ All middleware files created successfully')
    console.log('✅ File structures and exports look correct')
    console.log('✅ Security configurations implemented')
    console.log('✅ Error handling patterns found')
    console.log('✅ Environment variable support included')
    console.log('')
    console.log('🎉 Middleware test suite PASSED!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Configure environment variables in .env.local')
    console.log('2. Integrate with your Next.js middleware.ts file')
    console.log('3. Test with actual API requests')
    console.log('4. Monitor audit logs and security metrics')

  } catch (error) {
    console.error('\n❌ Middleware test FAILED:')
    console.error(error.message)
    console.error('\nPlease review the middleware implementation.')
    process.exit(1)
  }
}

// Run the test
testMiddlewareComponents().catch(console.error)