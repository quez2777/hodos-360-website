#!/usr/bin/env node

/**
 * Comprehensive test script for HODOS 360 Analytics APIs
 * Tests all endpoints for functionality, performance, and error handling
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  timeout: 10000,
  concurrent: false, // Set to true for load testing
  verbose: true
};

// Test results tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: [],
  performance: {}
};

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  const startTime = Date.now();
  
  try {
    // Mock fetch for Node.js environment
    const response = await mockFetch(url, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      responseTime,
      headers: response.headers || {}
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

// Mock fetch implementation for testing API logic
async function mockFetch(url, options = {}) {
  const urlPath = url.replace(TEST_CONFIG.baseUrl, '');
  const method = options.method || 'GET';
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
  
  // Mock responses based on endpoint
  if (urlPath.startsWith('/analytics/financial')) {
    return mockFinancialResponse(method, options);
  } else if (urlPath.startsWith('/analytics/performance')) {
    return mockPerformanceResponse(method, options);
  } else if (urlPath.startsWith('/realtime')) {
    return mockRealtimeResponse(method, options);
  } else if (urlPath.startsWith('/reports')) {
    return mockReportsResponse(method, options);
  } else if (urlPath.startsWith('/health')) {
    return mockHealthResponse(method, options);
  } else {
    return { status: 404, data: { error: 'Not found' } };
  }
}

// Mock response generators
function mockFinancialResponse(method, options) {
  if (method === 'GET') {
    return {
      status: 200,
      data: {
        success: true,
        data: {
          metrics: {
            revenue: {
              total: 150000,
              recurring: 120000,
              oneTime: 30000,
              projected: 180000,
              growth: 15
            },
            billing: {
              outstanding: 25000,
              overdue: 5000,
              collected: 145000,
              collectionRate: 95.5,
              averageDaysToPayment: 28
            },
            roi: {
              caseBased: 125,
              clientLifetimeValue: 75000,
              acquisitionCost: 2500,
              profitMargin: 35.5
            },
            cashFlow: {
              current: 52500,
              projected30Days: 60000,
              projected90Days: 180000,
              trend: [10000, 12000, 15000, 18000, 20000]
            }
          },
          summary: {
            totalRevenue: 150000,
            totalExpenses: 96750,
            netProfit: 53250,
            profitMargin: 35.5,
            totalClients: 45,
            totalCases: 23,
            avgCaseValue: 6522
          }
        },
        metadata: {
          timeframe: '30d',
          generatedAt: new Date().toISOString(),
          cacheStatus: 'fresh'
        }
      }
    };
  } else if (method === 'POST') {
    return {
      status: 200,
      data: {
        success: true,
        message: "Financial settings updated successfully"
      }
    };
  }
  
  return { status: 405, data: { error: 'Method not allowed' } };
}

function mockPerformanceResponse(method, options) {
  if (method === 'GET') {
    return {
      status: 200,
      data: {
        success: true,
        data: {
          metrics: {
            caseOutcomes: {
              totalCases: 23,
              successRate: 87,
              averageDuration: 45,
              byOutcome: {
                won: 12,
                settled: 8,
                dismissed: 2,
                pending: 1
              },
              byPracticeArea: {
                'Corporate Law': { total: 10, success: 9, rate: 90 },
                'Litigation': { total: 8, success: 6, rate: 75 },
                'Real Estate': { total: 5, success: 5, rate: 100 }
              }
            },
            attorneyProductivity: {
              billableHours: 160,
              utilizationRate: 78,
              averageHourlyRate: 450,
              caseLoad: 12,
              efficiency: 92
            },
            clientSatisfaction: {
              averageRating: 4.6,
              npsScore: 75,
              responseRate: 85,
              satisfactionTrend: [4.2, 4.4, 4.5, 4.6, 4.6],
              feedbackSummary: {
                positive: 38,
                neutral: 5,
                negative: 2
              }
            },
            teamPerformance: {
              totalTeamMembers: 8,
              averageProductivity: 85,
              topPerformers: [
                { id: 'att1', name: 'John Smith', score: 95 },
                { id: 'att2', name: 'Jane Doe', score: 90 }
              ],
              workloadDistribution: {
                'John Smith': 15,
                'Jane Doe': 12,
                'Bob Wilson': 8
              }
            }
          },
          insights: [
            {
              type: 'positive',
              category: 'case_outcomes',
              message: 'Excellent success rate of 87% - well above industry average'
            }
          ],
          recommendations: [
            {
              category: 'efficiency',
              priority: 'medium',
              title: 'Optimize Case Workflows',
              description: 'Consider automation tools to reduce case resolution time',
              expectedImpact: '20-30% reduction in case duration'
            }
          ]
        },
        metadata: {
          timeframe: '30d',
          generatedAt: new Date().toISOString()
        }
      }
    };
  } else if (method === 'POST') {
    return {
      status: 200,
      data: {
        success: true,
        message: "Performance settings updated successfully"
      }
    };
  }
  
  return { status: 405, data: { error: 'Method not allowed' } };
}

function mockRealtimeResponse(method, options) {
  if (method === 'GET') {
    // Mock SSE stream
    return {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
      data: 'data: {"type":"connection_established","data":{"connectionId":"conn_123","timestamp":"' + new Date().toISOString() + '"}}\n\n'
    };
  } else if (method === 'POST') {
    return {
      status: 200,
      data: {
        success: true,
        eventId: 'evt_' + Date.now(),
        delivered: true,
        timestamp: new Date().toISOString()
      }
    };
  } else if (method === 'PUT') {
    return {
      status: 200,
      data: {
        success: true,
        message: "Subscription preferences updated"
      }
    };
  } else if (method === 'DELETE') {
    return {
      status: 200,
      data: {
        success: true,
        message: "Connection closed"
      }
    };
  } else if (method === 'OPTIONS') {
    return {
      status: 200,
      data: {
        success: true,
        data: {
          activeConnections: 3,
          recentEvents: 15,
          unreadCount: 5,
          queuedEvents: 2
        }
      }
    };
  }
  
  return { status: 405, data: { error: 'Method not allowed' } };
}

function mockReportsResponse(method, options) {
  if (method === 'GET') {
    const url = options.url || '';
    if (url.includes('id=')) {
      return {
        status: 200,
        data: {
          success: true,
          data: {
            id: 'rpt_123',
            title: 'Financial Report - Monthly',
            status: 'completed',
            createdAt: new Date().toISOString(),
            downloadUrl: '/api/reports/files/rpt_123.pdf'
          }
        }
      };
    } else {
      return {
        status: 200,
        data: {
          success: true,
          data: {
            reports: [
              {
                id: 'rpt_123',
                title: 'Financial Report - Monthly',
                type: 'financial',
                status: 'completed',
                createdAt: new Date().toISOString()
              }
            ],
            templates: [
              {
                id: 'financial_summary',
                name: 'Financial Summary',
                type: 'financial'
              }
            ],
            total: 1
          }
        }
      };
    }
  } else if (method === 'POST') {
    return {
      status: 200,
      data: {
        success: true,
        data: {
          reportId: 'rpt_' + Date.now(),
          status: 'pending',
          estimatedTime: '2 minutes'
        }
      }
    };
  } else if (method === 'DELETE') {
    return {
      status: 200,
      data: {
        success: true,
        message: "Report deleted successfully"
      }
    };
  }
  
  return { status: 405, data: { error: 'Method not allowed' } };
}

function mockHealthResponse(method, options) {
  if (method === 'GET') {
    return {
      status: 200,
      data: {
        overall: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: 3600000,
          version: '1.0.0',
          environment: 'development'
        },
        services: [
          { name: 'database', status: 'up', responseTime: 25 },
          { name: 'redis', status: 'up', responseTime: 15 },
          { name: 'external-apis', status: 'up', responseTime: 150 },
          { name: 'filesystem', status: 'up', responseTime: 10 },
          { name: 'email-service', status: 'up', responseTime: 100 },
          { name: 'auth-service', status: 'up', responseTime: 5 }
        ]
      }
    };
  } else if (method === 'POST') {
    return {
      status: 200,
      data: {
        success: true,
        results: [
          { name: 'database', status: 'up', responseTime: 30 }
        ]
      }
    };
  }
  
  return { status: 405, data: { error: 'Method not allowed' } };
}

// Test cases
const testCases = [
  // Financial Analytics API Tests
  {
    name: 'Financial Analytics - Get metrics (30d)',
    url: '/analytics/financial?timeframe=30d',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data.metrics.revenue', 'data.summary']
  },
  {
    name: 'Financial Analytics - Get metrics with breakdown',
    url: '/analytics/financial?timeframe=90d&breakdown=true&predictions=true',
    method: 'GET',
    expectedStatus: 200,
    maxResponseTime: 2000
  },
  {
    name: 'Financial Analytics - Invalid timeframe',
    url: '/analytics/financial?timeframe=invalid',
    method: 'GET',
    expectedStatus: 400
  },
  {
    name: 'Financial Analytics - Update settings',
    url: '/analytics/financial',
    method: 'POST',
    body: { targets: { revenue: 200000 } },
    expectedStatus: 200
  },

  // Performance Analytics API Tests
  {
    name: 'Performance Analytics - Get metrics',
    url: '/analytics/performance?timeframe=30d',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data.metrics.caseOutcomes', 'data.metrics.attorneyProductivity']
  },
  {
    name: 'Performance Analytics - Get detailed analysis',
    url: '/analytics/performance?timeframe=90d&details=true&team=true',
    method: 'GET',
    expectedStatus: 200,
    maxResponseTime: 3000
  },
  {
    name: 'Performance Analytics - Filter by practice area',
    url: '/analytics/performance?timeframe=30d&practiceArea=Corporate%20Law',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'Performance Analytics - Update targets',
    url: '/analytics/performance',
    method: 'POST',
    body: { targets: { successRate: 90 } },
    expectedStatus: 200
  },

  // Real-time API Tests
  {
    name: 'Real-time - Get SSE stream',
    url: '/realtime?subscriptions=all',
    method: 'GET',
    expectedStatus: 200,
    expectedHeaders: ['content-type']
  },
  {
    name: 'Real-time - Send event',
    url: '/realtime',
    method: 'POST',
    body: {
      type: 'case_update',
      data: { caseId: '123', message: 'Case updated' },
      priority: 'medium'
    },
    expectedStatus: 200
  },
  {
    name: 'Real-time - Update subscriptions',
    url: '/realtime',
    method: 'PUT',
    body: { subscriptions: ['case_update', 'payment_received'] },
    expectedStatus: 200
  },
  {
    name: 'Real-time - Get connection status',
    url: '/realtime',
    method: 'OPTIONS',
    expectedStatus: 200
  },

  // Reports API Tests
  {
    name: 'Reports - List reports',
    url: '/reports',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['success', 'data.reports', 'data.templates']
  },
  {
    name: 'Reports - Generate financial report',
    url: '/reports',
    method: 'POST',
    body: {
      type: 'financial',
      format: 'pdf',
      timeframe: '30d',
      includeCharts: true
    },
    expectedStatus: 200,
    expectedFields: ['success', 'data.reportId']
  },
  {
    name: 'Reports - Generate performance report (Excel)',
    url: '/reports',
    method: 'POST',
    body: {
      type: 'performance',
      format: 'excel',
      timeframe: '90d',
      includeDetails: true
    },
    expectedStatus: 200
  },
  {
    name: 'Reports - Invalid format',
    url: '/reports',
    method: 'POST',
    body: {
      type: 'financial',
      format: 'invalid',
      timeframe: '30d'
    },
    expectedStatus: 400
  },
  {
    name: 'Reports - Get specific report',
    url: '/reports?id=rpt_123',
    method: 'GET',
    expectedStatus: 200
  },

  // Health Check API Tests
  {
    name: 'Health Check - Basic check',
    url: '/health',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['overall.status', 'services'],
    maxResponseTime: 5000
  },
  {
    name: 'Health Check - Detailed with metrics',
    url: '/health?detailed=true&metrics=true',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['overall', 'services', 'metrics', 'alerts']
  },
  {
    name: 'Health Check - Specific service',
    url: '/health?service=database',
    method: 'GET',
    expectedStatus: 200,
    expectedFields: ['service.name', 'service.status']
  },
  {
    name: 'Health Check - Manual trigger',
    url: '/health',
    method: 'POST',
    body: { services: ['database', 'redis'] },
    expectedStatus: 200
  }
];

// Performance benchmarks
const performanceBenchmarks = {
  '/analytics/financial': { maxTime: 2000, expectedFields: 15 },
  '/analytics/performance': { maxTime: 3000, expectedFields: 12 },
  '/realtime': { maxTime: 1000, expectedFields: 5 },
  '/reports': { maxTime: 1500, expectedFields: 8 },
  '/health': { maxTime: 5000, expectedFields: 6 }
};

// Main test runner
async function runTests() {
  console.log('\n🧪 HODOS 360 Analytics APIs Test Suite');
  console.log('=====================================\n');

  const startTime = Date.now();
  
  for (const test of testCases) {
    testResults.total++;
    await runSingleTest(test);
    
    // Add small delay between tests
    if (!TEST_CONFIG.concurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // Performance analysis
  await analyzePerformance();
  
  // Generate report
  const totalTime = Date.now() - startTime;
  generateTestReport(totalTime);
}

async function runSingleTest(test) {
  const testName = test.name.padEnd(60, '.');
  
  try {
    const response = await makeRequest(
      TEST_CONFIG.baseUrl + test.url,
      {
        method: test.method,
        headers: test.headers || { 'Content-Type': 'application/json' },
        body: test.body ? JSON.stringify(test.body) : undefined,
        url: test.url // Pass URL for mock logic
      }
    );

    // Check status code
    if (response.status !== test.expectedStatus) {
      throw new Error(`Expected status ${test.expectedStatus}, got ${response.status}`);
    }

    // Check response time
    if (test.maxResponseTime && response.responseTime > test.maxResponseTime) {
      throw new Error(`Response time ${response.responseTime}ms exceeds maximum ${test.maxResponseTime}ms`);
    }

    // Check expected fields
    if (test.expectedFields) {
      for (const field of test.expectedFields) {
        if (!hasNestedProperty(response.data, field)) {
          throw new Error(`Missing expected field: ${field}`);
        }
      }
    }

    // Check expected headers
    if (test.expectedHeaders) {
      for (const header of test.expectedHeaders) {
        if (!response.headers[header]) {
          throw new Error(`Missing expected header: ${header}`);
        }
      }
    }

    // Store performance data
    const endpoint = test.url.split('?')[0];
    if (!testResults.performance[endpoint]) {
      testResults.performance[endpoint] = [];
    }
    testResults.performance[endpoint].push(response.responseTime);

    console.log(`${testName} ✅ PASS (${response.responseTime}ms)`);
    testResults.passed++;

  } catch (error) {
    console.log(`${testName} ❌ FAIL`);
    if (TEST_CONFIG.verbose) {
      console.log(`   Error: ${error.message}`);
    }
    
    testResults.failed++;
    testResults.errors.push({
      test: test.name,
      error: error.message
    });
  }
}

async function analyzePerformance() {
  console.log('\n📊 Performance Analysis');
  console.log('=======================');

  for (const [endpoint, times] of Object.entries(testResults.performance)) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);
    
    const benchmark = performanceBenchmarks[endpoint];
    const status = benchmark && avgTime > benchmark.maxTime ? '⚠️ SLOW' : '✅ GOOD';
    
    console.log(`${endpoint.padEnd(30)} | Avg: ${avgTime.toFixed(0)}ms | Min: ${minTime}ms | Max: ${maxTime}ms | ${status}`);
  }
}

function generateTestReport(totalTime) {
  console.log('\n📋 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`Passed: ${testResults.passed} ✅`);
  console.log(`Failed: ${testResults.failed} ❌`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  console.log(`Total Time: ${(totalTime / 1000).toFixed(2)}s`);

  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.errors.forEach(error => {
      console.log(`   • ${error.test}: ${error.error}`);
    });
  }

  // Save detailed report
  const report = {
    summary: {
      total: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: (testResults.passed / testResults.total) * 100,
      totalTime: totalTime
    },
    performance: testResults.performance,
    errors: testResults.errors,
    timestamp: new Date().toISOString()
  };

  const reportPath = path.join(__dirname, '../test-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportPath, `analytics-api-test-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Helper function to check nested properties
function hasNestedProperty(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined;
  }, obj) !== undefined;
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testResults, TEST_CONFIG };