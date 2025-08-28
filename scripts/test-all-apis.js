#!/usr/bin/env node

/**
 * HODOS 360 Comprehensive API Test Runner
 * 
 * Tests all API endpoints systematically with:
 * - Authentication testing
 * - Error handling verification
 * - Performance benchmarking
 * - Security validation
 * - Integration testing
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');

// Import utilities
const { 
  ApiTestUtils, 
  TestReporter, 
  SecurityTester,
  PerformanceTester,
  IntegrationTester 
} = require('./api-test-utils');

class ApiTestRunner {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.testResults = [];
    this.reporter = new TestReporter();
    this.utils = new ApiTestUtils(this.baseUrl);
    this.securityTester = new SecurityTester(this.baseUrl);
    this.performanceTester = new PerformanceTester(this.baseUrl);
    this.integrationTester = new IntegrationTester(this.baseUrl);
    
    // Test configuration
    this.config = {
      timeout: 30000, // 30 seconds per test
      retries: 2,
      concurrent: 5, // Number of concurrent tests
      performance: {
        maxResponseTime: 5000, // 5 seconds
        warningThreshold: 2000 // 2 seconds
      }
    };

    // API endpoints to test
    this.apiEndpoints = [
      // Core APIs
      { path: '/api/health', methods: ['GET'], auth: false, category: 'core' },
      { path: '/api/cache', methods: ['GET', 'POST', 'DELETE'], auth: true, category: 'core' },
      { path: '/api/edge-cache', methods: ['GET', 'POST'], auth: true, category: 'core' },
      
      // Authentication
      { path: '/api/auth/signin', methods: ['POST'], auth: false, category: 'auth' },
      
      // Contact & Communication
      { path: '/api/contact', methods: ['POST'], auth: false, category: 'communication' },
      { path: '/api/newsletter', methods: ['POST'], auth: false, category: 'communication' },
      { path: '/api/demo', methods: ['POST'], auth: false, category: 'communication' },
      { path: '/api/email/status', methods: ['GET'], auth: true, category: 'communication' },
      
      // Data APIs
      { path: '/api/data/pricing', methods: ['GET'], auth: false, category: 'data' },
      { path: '/api/data/testimonials', methods: ['GET'], auth: false, category: 'data' },
      
      // Client Management
      { path: '/api/clients', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true, category: 'management' },
      { path: '/api/cases', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true, category: 'management' },
      { path: '/api/documents', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true, category: 'management' },
      { path: '/api/documents/:id', methods: ['GET', 'PUT', 'DELETE'], auth: true, category: 'management' },
      
      // AI Services - Legal
      { path: '/api/ai/legal/research', methods: ['POST'], auth: true, category: 'ai-legal' },
      { path: '/api/ai/legal/brief', methods: ['POST'], auth: true, category: 'ai-legal' },
      { path: '/api/ai/legal/contract', methods: ['POST'], auth: true, category: 'ai-legal' },
      
      // AI Services - Marketing
      { path: '/api/ai/marketing/content', methods: ['POST'], auth: true, category: 'ai-marketing' },
      { path: '/api/ai/marketing/keywords', methods: ['POST'], auth: true, category: 'ai-marketing' },
      { path: '/api/ai/marketing/strategy', methods: ['POST'], auth: true, category: 'ai-marketing' },
      
      // AI Services - Core
      { path: '/api/ai/chat', methods: ['POST'], auth: true, category: 'ai-core' },
      { path: '/api/ai/document', methods: ['POST'], auth: true, category: 'ai-core' },
      { path: '/api/ai/seo', methods: ['POST'], auth: true, category: 'ai-core' },
      
      // AI Services - Video
      { path: '/api/ai/video/script', methods: ['POST'], auth: true, category: 'ai-video' },
      { path: '/api/ai/video/avatar', methods: ['POST'], auth: true, category: 'ai-video' },
      { path: '/api/ai/video/analyze', methods: ['POST'], auth: true, category: 'ai-video' },
      
      // Analytics
      { path: '/api/analytics/dashboard', methods: ['GET'], auth: true, category: 'analytics' },
      { path: '/api/analytics/financial', methods: ['GET'], auth: true, category: 'analytics' },
      { path: '/api/analytics/performance', methods: ['GET'], auth: true, category: 'analytics' },
      
      // Integrations
      { path: '/api/integrations/calendar', methods: ['GET', 'POST'], auth: true, category: 'integrations' },
      { path: '/api/integrations/crm', methods: ['GET', 'POST'], auth: true, category: 'integrations' },
      { path: '/api/integrations/email', methods: ['GET', 'POST'], auth: true, category: 'integrations' },
      { path: '/api/integrations/payment', methods: ['GET', 'POST'], auth: true, category: 'integrations' },
      { path: '/api/integrations/storage', methods: ['GET', 'POST'], auth: true, category: 'integrations' },
      
      // Marketing & Campaigns
      { path: '/api/marketing/campaigns', methods: ['GET', 'POST', 'PUT', 'DELETE'], auth: true, category: 'marketing' },
      
      // Reports & Realtime
      { path: '/api/reports', methods: ['GET', 'POST'], auth: true, category: 'reports' },
      { path: '/api/realtime', methods: ['GET'], auth: true, category: 'realtime' },
      
      // File Upload
      { path: '/api/upload', methods: ['POST'], auth: true, category: 'files' }
    ];
  }

  /**
   * Main test execution method
   */
  async runAllTests() {
    console.log(`🚀 HODOS 360 API Test Suite Starting...`);
    console.log(`📊 Testing ${this.apiEndpoints.length} endpoints across ${this.getUniqueCategories().length} categories`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    console.log(`⏱️  Timeout: ${this.config.timeout}ms per test`);
    console.log(`🔄 Retries: ${this.config.retries}`);
    console.log(`⚡ Concurrent Tests: ${this.config.concurrent}`);
    console.log('─'.repeat(80));
    
    const startTime = performance.now();
    
    try {
      // Step 1: Pre-test checks
      await this.performPreTestChecks();
      
      // Step 2: Authentication setup
      await this.setupAuthentication();
      
      // Step 3: Run endpoint tests by category
      await this.runEndpointTests();
      
      // Step 4: Run security tests
      await this.runSecurityTests();
      
      // Step 5: Run performance tests
      await this.runPerformanceTests();
      
      // Step 6: Run integration tests
      await this.runIntegrationTests();
      
      // Step 7: Generate comprehensive report
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      await this.generateReport(totalTime);
      
      console.log(`✅ All tests completed in ${(totalTime / 1000).toFixed(2)}s`);
      
      return this.getTestSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      await this.generateErrorReport(error);
      throw error;
    }
  }

  /**
   * Pre-test environment checks
   */
  async performPreTestChecks() {
    console.log('🔍 Performing pre-test checks...');
    
    // Check if server is running
    try {
      const response = await this.utils.makeRequest('GET', '/api/health');
      if (response.status !== 200) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      console.log('✅ Server health check passed');
    } catch (error) {
      console.log('⚠️  Server not running, attempting to start...');
      await this.startServer();
    }
    
    // Verify environment variables
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'OPENAI_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY'
    ];
    
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        console.log(`⚠️  Missing environment variable: ${envVar}`);
      } else {
        console.log(`✅ ${envVar} configured`);
      }
    }
  }

  /**
   * Setup authentication for testing
   */
  async setupAuthentication() {
    console.log('🔐 Setting up authentication...');
    
    try {
      // Create test API key
      this.testApiKey = await this.utils.createTestApiKey();
      console.log('✅ Test API key created');
      
      // Create test user token
      this.testUserToken = await this.utils.createTestUserToken();
      console.log('✅ Test user token created');
      
    } catch (error) {
      console.log('⚠️  Authentication setup failed, using mock credentials');
      this.testApiKey = 'test-api-key-mock';
      this.testUserToken = 'test-user-token-mock';
    }
  }

  /**
   * Run tests for all endpoints
   */
  async runEndpointTests() {
    console.log('🧪 Running endpoint tests...');
    
    const categories = this.getUniqueCategories();
    
    for (const category of categories) {
      console.log(`\n📂 Testing ${category} APIs...`);
      const categoryEndpoints = this.apiEndpoints.filter(ep => ep.category === category);
      
      const results = await this.runTestsInBatches(categoryEndpoints);
      this.testResults.push(...results);
      
      const passed = results.filter(r => r.passed).length;
      const total = results.length;
      console.log(`   ${passed}/${total} tests passed`);
    }
  }

  /**
   * Run tests in concurrent batches
   */
  async runTestsInBatches(endpoints) {
    const results = [];
    const batches = this.createBatches(endpoints, this.config.concurrent);
    
    for (const batch of batches) {
      const batchPromises = batch.map(endpoint => this.testEndpoint(endpoint));
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        } else {
          const endpoint = batch[index];
          results.push({
            endpoint: endpoint.path,
            method: 'ALL',
            passed: false,
            error: result.reason.message,
            category: endpoint.category
          });
        }
      });
    }
    
    return results;
  }

  /**
   * Test individual endpoint
   */
  async testEndpoint(endpoint) {
    const results = [];
    
    for (const method of endpoint.methods) {
      let attempt = 0;
      let testPassed = false;
      let lastError;
      
      while (attempt <= this.config.retries && !testPassed) {
        try {
          const result = await this.runSingleTest(endpoint, method);
          results.push(result);
          testPassed = result.passed;
          break;
        } catch (error) {
          lastError = error;
          attempt++;
          if (attempt <= this.config.retries) {
            console.log(`   Retry ${attempt}/${this.config.retries} for ${method} ${endpoint.path}`);
          }
        }
      }
      
      if (!testPassed) {
        results.push({
          endpoint: endpoint.path,
          method,
          passed: false,
          error: lastError?.message || 'Test failed after all retries',
          category: endpoint.category,
          duration: 0
        });
      }
    }
    
    return results;
  }

  /**
   * Run single test for endpoint/method combination
   */
  async runSingleTest(endpoint, method) {
    const startTime = performance.now();
    
    try {
      // Prepare test data
      const testData = this.utils.generateTestData(endpoint.path, method);
      
      // Set appropriate headers
      const headers = {};
      if (endpoint.auth) {
        headers['Authorization'] = `Bearer ${this.testUserToken}`;
        headers['X-API-Key'] = this.testApiKey;
      }
      
      // Make request with timeout
      const response = await Promise.race([
        this.utils.makeRequest(method, endpoint.path, testData, headers),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
        )
      ]);
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Validate response
      const validation = this.validateResponse(response, method, endpoint);
      
      const result = {
        endpoint: endpoint.path,
        method,
        passed: validation.valid,
        status: response.status,
        duration: Math.round(duration),
        category: endpoint.category,
        responseSize: this.getResponseSize(response)
      };
      
      if (!validation.valid) {
        result.error = validation.error;
      }
      
      if (duration > this.config.performance.warningThreshold) {
        result.warning = `Slow response: ${Math.round(duration)}ms`;
      }
      
      return result;
      
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return {
        endpoint: endpoint.path,
        method,
        passed: false,
        error: error.message,
        duration: Math.round(duration),
        category: endpoint.category
      };
    }
  }

  /**
   * Run security tests
   */
  async runSecurityTests() {
    console.log('\n🔒 Running security tests...');
    
    const securityResults = await this.securityTester.runAllTests(this.apiEndpoints);
    this.testResults.push(...securityResults);
    
    const passed = securityResults.filter(r => r.passed).length;
    console.log(`   ${passed}/${securityResults.length} security tests passed`);
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('\n⚡ Running performance tests...');
    
    const performanceResults = await this.performanceTester.runAllTests(this.apiEndpoints);
    this.testResults.push(...performanceResults);
    
    const passed = performanceResults.filter(r => r.passed).length;
    console.log(`   ${passed}/${performanceResults.length} performance tests passed`);
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('\n🔗 Running integration tests...');
    
    const integrationResults = await this.integrationTester.runAllTests();
    this.testResults.push(...integrationResults);
    
    const passed = integrationResults.filter(r => r.passed).length;
    console.log(`   ${passed}/${integrationResults.length} integration tests passed`);
  }

  /**
   * Validate API response
   */
  validateResponse(response, method, endpoint) {
    // Check status code
    const expectedStatuses = this.getExpectedStatuses(method);
    if (!expectedStatuses.includes(response.status)) {
      return {
        valid: false,
        error: `Unexpected status ${response.status}, expected one of ${expectedStatuses.join(', ')}`
      };
    }
    
    // Check content type for JSON APIs
    if (response.status !== 204 && response.headers.get) {
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return {
          valid: false,
          error: `Invalid content type: ${contentType}`
        };
      }
    }
    
    // Check security headers
    const securityHeaders = ['x-content-type-options', 'x-frame-options', 'x-xss-protection'];
    const missingHeaders = securityHeaders.filter(header => 
      !response.headers.get || !response.headers.get(header)
    );
    
    if (missingHeaders.length > 0) {
      return {
        valid: false,
        error: `Missing security headers: ${missingHeaders.join(', ')}`
      };
    }
    
    return { valid: true };
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(totalTime) {
    console.log('\n📊 Generating comprehensive report...');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.getTestSummary(),
      totalTime: Math.round(totalTime),
      results: this.testResults,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        baseUrl: this.baseUrl
      },
      performance: this.getPerformanceMetrics(),
      security: this.getSecurityMetrics(),
      categories: this.getCategoryMetrics()
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-reports', 
      `api-test-report-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Generate HTML report
    await this.reporter.generateHtmlReport(report, reportPath.replace('.json', '.html'));
    
    console.log(`📁 Detailed report saved: ${reportPath}`);
    console.log(`🌐 HTML report: ${reportPath.replace('.json', '.html')}`);
    
    // Print summary
    this.printSummary(report.summary);
  }

  /**
   * Print test summary to console
   */
  printSummary(summary) {
    console.log('\n' + '='.repeat(80));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${summary.total}`);
    console.log(`✅ Passed: ${summary.passed} (${summary.passRate}%)`);
    console.log(`❌ Failed: ${summary.failed} (${summary.failRate}%)`);
    console.log(`⚠️  Warnings: ${summary.warnings}`);
    console.log(`⚡ Avg Response Time: ${summary.avgResponseTime}ms`);
    console.log(`🐌 Slowest: ${summary.slowestTest?.endpoint} (${summary.slowestTest?.duration}ms)`);
    console.log(`⚡ Fastest: ${summary.fastestTest?.endpoint} (${summary.fastestTest?.duration}ms)`);
    
    if (summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      summary.failures.forEach(failure => {
        console.log(`   ${failure.method} ${failure.endpoint}: ${failure.error}`);
      });
    }
    
    console.log('='.repeat(80));
  }

  // Utility methods
  getUniqueCategories() {
    return [...new Set(this.apiEndpoints.map(ep => ep.category))];
  }

  createBatches(items, batchSize) {
    const batches = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  getExpectedStatuses(method) {
    switch (method) {
      case 'GET': return [200, 404];
      case 'POST': return [200, 201, 400, 401, 403];
      case 'PUT': return [200, 204, 400, 401, 403, 404];
      case 'DELETE': return [200, 204, 401, 403, 404];
      default: return [200, 400, 401, 403, 404];
    }
  }

  getResponseSize(response) {
    if (!response.headers.get) return 0;
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  getTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.passed).length;
    const failed = total - passed;
    const warnings = this.testResults.filter(r => r.warning).length;
    
    const durations = this.testResults
      .filter(r => r.duration)
      .map(r => r.duration);
    
    const avgResponseTime = durations.length > 0 
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    
    const slowestTest = this.testResults
      .filter(r => r.duration)
      .sort((a, b) => b.duration - a.duration)[0];
    
    const fastestTest = this.testResults
      .filter(r => r.duration && r.passed)
      .sort((a, b) => a.duration - b.duration)[0];
    
    const failures = this.testResults
      .filter(r => !r.passed)
      .map(r => ({ method: r.method, endpoint: r.endpoint, error: r.error }));

    return {
      total,
      passed,
      failed,
      warnings,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      failRate: total > 0 ? Math.round((failed / total) * 100) : 0,
      avgResponseTime,
      slowestTest,
      fastestTest,
      failures
    };
  }

  getPerformanceMetrics() {
    const performanceTests = this.testResults.filter(r => r.category && r.duration);
    
    return {
      averageResponseTime: Math.round(
        performanceTests.reduce((sum, test) => sum + test.duration, 0) / performanceTests.length || 0
      ),
      slowQueries: performanceTests
        .filter(t => t.duration > this.config.performance.warningThreshold)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
    };
  }

  getSecurityMetrics() {
    const securityTests = this.testResults.filter(r => r.testType === 'security');
    
    return {
      total: securityTests.length,
      passed: securityTests.filter(t => t.passed).length,
      vulnerabilities: securityTests.filter(t => !t.passed)
    };
  }

  getCategoryMetrics() {
    const categories = {};
    
    this.testResults.forEach(result => {
      if (!result.category) return;
      
      if (!categories[result.category]) {
        categories[result.category] = {
          total: 0,
          passed: 0,
          failed: 0,
          avgResponseTime: 0
        };
      }
      
      categories[result.category].total++;
      if (result.passed) categories[result.category].passed++;
      else categories[result.category].failed++;
    });
    
    return categories;
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting Next.js server...');
      
      const server = spawn('npm', ['run', 'dev'], {
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });
      
      let output = '';
      
      server.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('Ready')) {
          setTimeout(resolve, 2000); // Give server time to fully start
        }
      });
      
      server.stderr.on('data', (data) => {
        console.log('Server stderr:', data.toString());
      });
      
      setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 30000);
    });
  }

  async generateErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      completedTests: this.testResults.length,
      lastTest: this.testResults[this.testResults.length - 1]
    };
    
    const errorPath = path.join(__dirname, '..', 'test-reports', 
      `api-test-error-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(errorPath), { recursive: true });
    await fs.writeFile(errorPath, JSON.stringify(errorReport, null, 2));
    
    console.log(`📁 Error report saved: ${errorPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const runner = new ApiTestRunner();
  
  runner.runAllTests()
    .then(summary => {
      console.log('\n✅ Test suite completed successfully');
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = { ApiTestRunner };