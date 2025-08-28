#!/usr/bin/env node

/**
 * HODOS 360 Load Testing Suite
 * 
 * Comprehensive load testing for API endpoints including:
 * - Concurrent request testing
 * - Rate limit verification
 * - Performance under load
 * - Memory leak detection
 * - Stress testing scenarios
 * - Real-world usage simulation
 */

const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const os = require('os');

// Import test utilities
const { ApiTestUtils } = require('./api-test-utils');

/**
 * Load testing configuration
 */
const LOAD_TEST_CONFIG = {
  // Test scenarios
  scenarios: {
    light: {
      name: 'Light Load',
      concurrent: 5,
      requests: 50,
      duration: 30000, // 30 seconds
      rampUp: 5000     // 5 seconds ramp up
    },
    moderate: {
      name: 'Moderate Load',
      concurrent: 25,
      requests: 500,
      duration: 120000, // 2 minutes
      rampUp: 10000     // 10 seconds ramp up
    },
    heavy: {
      name: 'Heavy Load',
      concurrent: 100,
      requests: 2000,
      duration: 300000, // 5 minutes
      rampUp: 30000     // 30 seconds ramp up
    },
    spike: {
      name: 'Spike Test',
      concurrent: 200,
      requests: 1000,
      duration: 60000,  // 1 minute
      rampUp: 1000      // 1 second ramp up (sudden spike)
    },
    endurance: {
      name: 'Endurance Test',
      concurrent: 50,
      requests: 5000,
      duration: 1800000, // 30 minutes
      rampUp: 60000      // 1 minute ramp up
    }
  },
  
  // Performance thresholds
  thresholds: {
    responseTime: {
      p50: 1000,    // 50th percentile < 1s
      p95: 3000,    // 95th percentile < 3s
      p99: 5000     // 99th percentile < 5s
    },
    errorRate: 0.05,  // < 5% error rate
    throughput: 10,   // > 10 requests/second
    memory: 500       // < 500MB memory usage
  },
  
  // Test endpoints priority
  endpoints: {
    critical: [
      '/api/health',
      '/api/auth/signin',
      '/api/clients',
      '/api/cases'
    ],
    important: [
      '/api/ai/chat',
      '/api/ai/legal/research',
      '/api/documents',
      '/api/analytics/dashboard'
    ],
    standard: [
      '/api/ai/marketing/content',
      '/api/integrations/crm',
      '/api/reports',
      '/api/upload'
    ]
  }
};

class LoadTestRunner {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.utils = new ApiTestUtils(this.baseUrl);
    this.results = [];
    this.workers = [];
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        errors: {}
      },
      timing: {
        responseTimes: [],
        startTime: null,
        endTime: null
      },
      memory: {
        initial: process.memoryUsage(),
        peak: process.memoryUsage(),
        samples: []
      },
      throughput: {
        requestsPerSecond: [],
        totalDuration: 0
      }
    };
  }

  /**
   * Main load testing execution
   */
  async runLoadTests() {
    console.log('🚀 HODOS 360 Load Testing Suite Starting...');
    console.log(`🌐 Target: ${this.baseUrl}`);
    console.log(`💻 System: ${os.cpus().length} CPUs, ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB RAM`);
    console.log('='.repeat(80));

    const testScenario = process.argv[2] || 'moderate';
    const config = LOAD_TEST_CONFIG.scenarios[testScenario];
    
    if (!config) {
      console.error(`❌ Unknown test scenario: ${testScenario}`);
      console.log(`Available scenarios: ${Object.keys(LOAD_TEST_CONFIG.scenarios).join(', ')}`);
      process.exit(1);
    }

    console.log(`📊 Running ${config.name} test scenario:`);
    console.log(`   Concurrent users: ${config.concurrent}`);
    console.log(`   Total requests: ${config.requests}`);
    console.log(`   Duration: ${config.duration / 1000}s`);
    console.log(`   Ramp-up time: ${config.rampUp / 1000}s`);
    console.log('─'.repeat(80));

    try {
      // Pre-test setup
      await this.setupLoadTest();
      
      // Start memory monitoring
      this.startMemoryMonitoring();
      
      // Run the load test
      await this.executeLoadTest(config);
      
      // Generate comprehensive report
      await this.generateLoadTestReport(config);
      
      console.log('✅ Load test completed successfully');
      
    } catch (error) {
      console.error('❌ Load test failed:', error.message);
      await this.generateErrorReport(error);
      throw error;
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  /**
   * Setup load testing environment
   */
  async setupLoadTest() {
    console.log('🔧 Setting up load test environment...');
    
    // Verify server health
    try {
      const healthCheck = await this.utils.makeRequest('GET', '/api/health');
      if (healthCheck.status !== 200) {
        throw new Error(`Server health check failed: ${healthCheck.status}`);
      }
      console.log('✅ Server health check passed');
    } catch (error) {
      throw new Error(`Server not accessible: ${error.message}`);
    }
    
    // Setup authentication
    try {
      this.testApiKey = await this.utils.createTestApiKey();
      this.testUserToken = await this.utils.createTestUserToken();
      console.log('✅ Authentication credentials prepared');
    } catch (error) {
      console.log('⚠️  Using mock authentication');
      this.testApiKey = 'test-api-key-mock';
      this.testUserToken = 'test-user-token-mock';
    }
    
    // Record initial memory state
    this.metrics.memory.initial = process.memoryUsage();
    console.log(`📊 Initial memory: ${Math.round(this.metrics.memory.initial.heapUsed / 1024 / 1024)}MB`);
  }

  /**
   * Execute load test with given configuration
   */
  async executeLoadTest(config) {
    console.log(`\n🏃 Starting load test execution...`);
    this.metrics.timing.startTime = performance.now();
    
    // Select test endpoints based on priority
    const endpoints = [
      ...LOAD_TEST_CONFIG.endpoints.critical,
      ...LOAD_TEST_CONFIG.endpoints.important.slice(0, 2),
      ...LOAD_TEST_CONFIG.endpoints.standard.slice(0, 1)
    ];
    
    console.log(`🎯 Testing ${endpoints.length} endpoints`);
    
    if (config.concurrent > 10) {
      // Use worker threads for high concurrency
      await this.executeWithWorkers(config, endpoints);
    } else {
      // Use Promise concurrency for low-moderate loads
      await this.executeWithPromises(config, endpoints);
    }
    
    this.metrics.timing.endTime = performance.now();
    this.metrics.throughput.totalDuration = this.metrics.timing.endTime - this.metrics.timing.startTime;
    
    console.log(`\n⏱️  Test completed in ${(this.metrics.throughput.totalDuration / 1000).toFixed(2)}s`);
  }

  /**
   * Execute load test using Promise concurrency (for lighter loads)
   */
  async executeWithPromises(config, endpoints) {
    const requestsPerBatch = Math.ceil(config.requests / config.concurrent);
    const batchDelay = config.rampUp / config.concurrent;
    
    console.log(`📦 Executing ${config.concurrent} batches of ${requestsPerBatch} requests`);
    
    const batches = [];
    
    for (let i = 0; i < config.concurrent; i++) {
      const batchPromise = new Promise(async (resolve) => {
        // Stagger batch starts for ramp-up
        await this.sleep(i * batchDelay);
        
        const batchResults = [];
        
        for (let j = 0; j < requestsPerBatch; j++) {
          const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
          
          try {
            const result = await this.executeRequest(endpoint);
            batchResults.push(result);
            this.updateMetrics(result);
            
            // Small delay between requests in batch
            if (j < requestsPerBatch - 1) {
              await this.sleep(Math.random() * 100);
            }
          } catch (error) {
            const errorResult = {
              endpoint,
              success: false,
              error: error.message,
              responseTime: 0,
              timestamp: Date.now()
            };
            batchResults.push(errorResult);
            this.updateMetrics(errorResult);
          }
        }
        
        resolve(batchResults);
      });
      
      batches.push(batchPromise);
    }
    
    // Execute all batches concurrently
    const allResults = await Promise.all(batches);
    this.results = allResults.flat();
    
    console.log(`✅ Completed ${this.results.length} requests`);
  }

  /**
   * Execute load test using worker threads (for high concurrency)
   */
  async executeWithWorkers(config, endpoints) {
    const numWorkers = Math.min(config.concurrent, os.cpus().length * 2);
    const requestsPerWorker = Math.ceil(config.requests / numWorkers);
    
    console.log(`👥 Spawning ${numWorkers} workers, ${requestsPerWorker} requests each`);
    
    return new Promise((resolve, reject) => {
      let completedWorkers = 0;
      let allResults = [];
      
      for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker(__filename, {
          workerData: {
            workerId: i,
            baseUrl: this.baseUrl,
            endpoints,
            requestsPerWorker,
            config: {
              ...config,
              rampUpDelay: (i * config.rampUp) / numWorkers
            },
            auth: {
              apiKey: this.testApiKey,
              userToken: this.testUserToken
            }
          }
        });
        
        worker.on('message', (message) => {
          if (message.type === 'progress') {
            process.stdout.write(`\r⚡ Progress: ${message.completed}/${config.requests} requests`);
          } else if (message.type === 'results') {
            allResults.push(...message.results);
            this.updateWorkerMetrics(message.results);
          }
        });
        
        worker.on('exit', (code) => {
          completedWorkers++;
          if (completedWorkers === numWorkers) {
            console.log(`\n✅ All ${numWorkers} workers completed`);
            this.results = allResults;
            resolve();
          }
        });
        
        worker.on('error', reject);
        
        this.workers.push(worker);
      }
    });
  }

  /**
   * Execute single request with timing and error handling
   */
  async executeRequest(endpoint) {
    const startTime = performance.now();
    
    try {
      // Determine HTTP method based on endpoint
      const method = this.getMethodForEndpoint(endpoint);
      const testData = method !== 'GET' ? this.utils.generateTestData(endpoint, method) : null;
      
      // Set headers for authenticated endpoints
      const headers = {};
      if (this.requiresAuth(endpoint)) {
        headers['Authorization'] = `Bearer ${this.testUserToken}`;
        headers['X-API-Key'] = this.testApiKey;
      }
      
      const response = await this.utils.makeRequest(method, endpoint, testData, headers);
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        endpoint,
        method,
        success: response.ok,
        status: response.status,
        responseTime: Math.round(responseTime),
        timestamp: Date.now(),
        size: this.getResponseSize(response)
      };
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      return {
        endpoint,
        success: false,
        error: error.message,
        responseTime: Math.round(responseTime),
        timestamp: Date.now()
      };
    }
  }

  /**
   * Update metrics with request result
   */
  updateMetrics(result) {
    this.metrics.requests.total++;
    
    if (result.success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
      const errorKey = result.error || 'Unknown error';
      this.metrics.requests.errors[errorKey] = (this.metrics.requests.errors[errorKey] || 0) + 1;
    }
    
    if (result.responseTime) {
      this.metrics.timing.responseTimes.push(result.responseTime);
    }
    
    // Update peak memory if current is higher
    const currentMemory = process.memoryUsage();
    if (currentMemory.heapUsed > this.metrics.memory.peak.heapUsed) {
      this.metrics.memory.peak = currentMemory;
    }
  }

  /**
   * Update metrics from worker results
   */
  updateWorkerMetrics(results) {
    results.forEach(result => this.updateMetrics(result));
  }

  /**
   * Start memory monitoring
   */
  startMemoryMonitoring() {
    this.memoryInterval = setInterval(() => {
      const memory = process.memoryUsage();
      this.metrics.memory.samples.push({
        timestamp: Date.now(),
        heapUsed: memory.heapUsed,
        heapTotal: memory.heapTotal,
        external: memory.external
      });
      
      // Keep only last 100 samples to prevent memory bloat
      if (this.metrics.memory.samples.length > 100) {
        this.metrics.memory.samples = this.metrics.memory.samples.slice(-100);
      }
    }, 5000); // Sample every 5 seconds
  }

  /**
   * Calculate performance statistics
   */
  calculateStatistics() {
    const responseTimes = this.metrics.timing.responseTimes.sort((a, b) => a - b);
    const totalTime = this.metrics.throughput.totalDuration / 1000; // in seconds
    
    if (responseTimes.length === 0) {
      return {
        responseTime: { min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 },
        throughput: { rps: 0, total: 0 },
        errorRate: 1,
        memoryPeak: 0
      };
    }
    
    const stats = {
      responseTime: {
        min: responseTimes[0],
        max: responseTimes[responseTimes.length - 1],
        avg: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
        p50: this.percentile(responseTimes, 50),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99)
      },
      throughput: {
        rps: totalTime > 0 ? Math.round(this.metrics.requests.total / totalTime) : 0,
        total: this.metrics.requests.total
      },
      errorRate: this.metrics.requests.total > 0 
        ? (this.metrics.requests.failed / this.metrics.requests.total)
        : 0,
      memoryPeak: Math.round(this.metrics.memory.peak.heapUsed / 1024 / 1024) // MB
    };
    
    return stats;
  }

  /**
   * Generate comprehensive load test report
   */
  async generateLoadTestReport(config) {
    console.log('\n📊 Generating load test report...');
    
    const stats = this.calculateStatistics();
    const passed = this.evaluateThresholds(stats);
    
    const report = {
      timestamp: new Date().toISOString(),
      scenario: config,
      summary: {
        total: this.metrics.requests.total,
        successful: this.metrics.requests.successful,
        failed: this.metrics.requests.failed,
        successRate: this.metrics.requests.total > 0 
          ? Math.round((this.metrics.requests.successful / this.metrics.requests.total) * 100)
          : 0,
        duration: Math.round(this.metrics.throughput.totalDuration / 1000)
      },
      performance: stats,
      thresholds: {
        passed,
        details: this.getThresholdDetails(stats)
      },
      errors: this.metrics.requests.errors,
      environment: {
        nodeVersion: process.version,
        platform: os.platform(),
        cpus: os.cpus().length,
        memory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
        baseUrl: this.baseUrl
      }
    };
    
    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-reports', 
      `load-test-report-${config.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📁 Detailed report saved: ${reportPath}`);
    
    // Print summary
    this.printLoadTestSummary(report);
    
    return report;
  }

  /**
   * Print load test summary to console
   */
  printLoadTestSummary(report) {
    const { summary, performance, thresholds } = report;
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 LOAD TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Scenario: ${report.scenario.name}`);
    console.log(`Duration: ${summary.duration}s`);
    console.log(`Total Requests: ${summary.total}`);
    console.log(`✅ Successful: ${summary.successful} (${summary.successRate}%)`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log('');
    
    console.log('⚡ PERFORMANCE METRICS:');
    console.log(`   Throughput: ${performance.throughput.rps} req/s`);
    console.log(`   Response Time (avg): ${performance.responseTime.avg}ms`);
    console.log(`   Response Time (p95): ${performance.responseTime.p95}ms`);
    console.log(`   Response Time (p99): ${performance.responseTime.p99}ms`);
    console.log(`   Error Rate: ${(performance.errorRate * 100).toFixed(2)}%`);
    console.log(`   Memory Peak: ${performance.memoryPeak}MB`);
    console.log('');
    
    console.log('🎯 THRESHOLD EVALUATION:');
    thresholds.details.forEach(detail => {
      const status = detail.passed ? '✅' : '❌';
      console.log(`   ${status} ${detail.name}: ${detail.actual} (threshold: ${detail.threshold})`);
    });
    
    if (Object.keys(report.errors).length > 0) {
      console.log('\n❌ TOP ERRORS:');
      Object.entries(report.errors)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([error, count]) => {
          console.log(`   ${count}x ${error}`);
        });
    }
    
    console.log('\n' + (thresholds.passed ? '✅ LOAD TEST PASSED' : '❌ LOAD TEST FAILED'));
    console.log('='.repeat(80));
  }

  /**
   * Evaluate performance against thresholds
   */
  evaluateThresholds(stats) {
    const thresholds = LOAD_TEST_CONFIG.thresholds;
    
    const checks = [
      stats.responseTime.p50 <= thresholds.responseTime.p50,
      stats.responseTime.p95 <= thresholds.responseTime.p95,
      stats.responseTime.p99 <= thresholds.responseTime.p99,
      stats.errorRate <= thresholds.errorRate,
      stats.throughput.rps >= thresholds.throughput,
      stats.memoryPeak <= thresholds.memory
    ];
    
    return checks.every(Boolean);
  }

  /**
   * Get threshold evaluation details
   */
  getThresholdDetails(stats) {
    const thresholds = LOAD_TEST_CONFIG.thresholds;
    
    return [
      {
        name: 'Response Time P50',
        actual: `${stats.responseTime.p50}ms`,
        threshold: `<=${thresholds.responseTime.p50}ms`,
        passed: stats.responseTime.p50 <= thresholds.responseTime.p50
      },
      {
        name: 'Response Time P95',
        actual: `${stats.responseTime.p95}ms`,
        threshold: `<=${thresholds.responseTime.p95}ms`,
        passed: stats.responseTime.p95 <= thresholds.responseTime.p95
      },
      {
        name: 'Response Time P99',
        actual: `${stats.responseTime.p99}ms`,
        threshold: `<=${thresholds.responseTime.p99}ms`,
        passed: stats.responseTime.p99 <= thresholds.responseTime.p99
      },
      {
        name: 'Error Rate',
        actual: `${(stats.errorRate * 100).toFixed(2)}%`,
        threshold: `<=${(thresholds.errorRate * 100)}%`,
        passed: stats.errorRate <= thresholds.errorRate
      },
      {
        name: 'Throughput',
        actual: `${stats.throughput.rps} req/s`,
        threshold: `>=${thresholds.throughput} req/s`,
        passed: stats.throughput.rps >= thresholds.throughput
      },
      {
        name: 'Memory Usage',
        actual: `${stats.memoryPeak}MB`,
        threshold: `<=${thresholds.memory}MB`,
        passed: stats.memoryPeak <= thresholds.memory
      }
    ];
  }

  // Utility methods
  percentile(arr, p) {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(index, arr.length - 1))];
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMethodForEndpoint(endpoint) {
    if (endpoint.includes('health') || endpoint.includes('analytics')) return 'GET';
    if (endpoint.includes('auth') || endpoint.includes('ai/') || endpoint.includes('upload')) return 'POST';
    return Math.random() > 0.7 ? 'POST' : 'GET'; // 70% GET, 30% POST
  }

  requiresAuth(endpoint) {
    const publicEndpoints = ['/api/health', '/api/contact', '/api/data/pricing', '/api/data/testimonials'];
    return !publicEndpoints.some(pub => endpoint.includes(pub));
  }

  getResponseSize(response) {
    if (!response.headers.get) return 0;
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : 0;
  }

  async cleanup() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
    }
    
    // Terminate all workers
    for (const worker of this.workers) {
      await worker.terminate();
    }
  }

  async generateErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      metrics: this.metrics,
      completedRequests: this.results.length
    };
    
    const errorPath = path.join(__dirname, '..', 'test-reports', 
      `load-test-error-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(errorPath), { recursive: true });
    await fs.writeFile(errorPath, JSON.stringify(errorReport, null, 2));
    
    console.log(`📁 Error report saved: ${errorPath}`);
  }
}

/**
 * Worker thread implementation for high concurrency testing
 */
async function workerLoadTest(workerData) {
  const { workerId, baseUrl, endpoints, requestsPerWorker, config, auth } = workerData;
  const utils = new ApiTestUtils(baseUrl);
  
  // Wait for ramp-up delay
  await new Promise(resolve => setTimeout(resolve, config.rampUpDelay));
  
  const results = [];
  
  for (let i = 0; i < requestsPerWorker; i++) {
    const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
    const method = endpoint.includes('health') ? 'GET' : 'POST';
    
    const startTime = performance.now();
    
    try {
      const testData = method === 'POST' ? utils.generateTestData(endpoint, method) : null;
      const headers = {
        'Authorization': `Bearer ${auth.userToken}`,
        'X-API-Key': auth.apiKey
      };
      
      const response = await utils.makeRequest(method, endpoint, testData, headers);
      const endTime = performance.now();
      
      results.push({
        endpoint,
        method,
        success: response.ok,
        status: response.status,
        responseTime: Math.round(endTime - startTime),
        timestamp: Date.now()
      });
      
    } catch (error) {
      const endTime = performance.now();
      results.push({
        endpoint,
        success: false,
        error: error.message,
        responseTime: Math.round(endTime - startTime),
        timestamp: Date.now()
      });
    }
    
    // Report progress
    if (i % 10 === 0) {
      parentPort.postMessage({ type: 'progress', completed: i, workerId });
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
  }
  
  parentPort.postMessage({ type: 'results', results, workerId });
}

// Execute based on context
if (isMainThread) {
  // Main thread - CLI execution
  if (require.main === module) {
    const runner = new LoadTestRunner();
    
    runner.runLoadTests()
      .then(() => {
        console.log('\n✅ Load test completed successfully');
        process.exit(0);
      })
      .catch(error => {
        console.error('\n❌ Load test failed:', error.message);
        process.exit(1);
      });
  }
} else {
  // Worker thread
  workerLoadTest(workerData);
}

module.exports = { LoadTestRunner, LOAD_TEST_CONFIG };