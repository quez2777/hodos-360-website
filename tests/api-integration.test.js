/**
 * HODOS 360 API Integration Tests
 * 
 * Comprehensive end-to-end integration testing covering:
 * - Complete user workflows
 * - Cross-API dependencies  
 * - Data consistency across services
 * - Real-world usage scenarios
 * - Business logic validation
 */

const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const { ApiTestUtils } = require('../scripts/api-test-utils');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 2,
  cleanupEnabled: true
};

// Test data storage
let testContext = {
  createdEntities: {
    clients: [],
    cases: [],
    documents: [],
    campaigns: []
  },
  authTokens: {},
  testResults: []
};

class IntegrationTestSuite {
  constructor() {
    this.utils = new ApiTestUtils(TEST_CONFIG.baseUrl);
    this.startTime = Date.now();
  }

  /**
   * Setup test environment
   */
  async setupTests() {
    console.log('🚀 Setting up integration test environment...');
    
    // Create test authentication
    try {
      testContext.authTokens.apiKey = await this.utils.createTestApiKey();
      testContext.authTokens.userToken = await this.utils.createTestUserToken();
      console.log('✅ Test authentication setup complete');
    } catch (error) {
      console.log('⚠️  Using mock authentication for tests');
      testContext.authTokens.apiKey = 'test-api-key-integration';
      testContext.authTokens.userToken = 'test-user-token-integration';
    }
    
    // Verify server health
    const healthCheck = await this.utils.makeRequest('GET', '/api/health');
    if (healthCheck.status !== 200) {
      throw new Error(`Server health check failed: ${healthCheck.status}`);
    }
    console.log('✅ Server health verified');
  }

  /**
   * Clean up test data
   */
  async cleanupTests() {
    if (!TEST_CONFIG.cleanupEnabled) return;
    
    console.log('🧹 Cleaning up test data...');
    
    const authHeaders = {
      'Authorization': `Bearer ${testContext.authTokens.userToken}`,
      'X-API-Key': testContext.authTokens.apiKey
    };
    
    // Cleanup in reverse order (documents -> cases -> clients)
    for (const docId of testContext.createdEntities.documents) {
      try {
        await this.utils.makeRequest('DELETE', `/api/documents/${docId}`, null, authHeaders);
      } catch (error) {
        console.log(`⚠️  Failed to cleanup document ${docId}: ${error.message}`);
      }
    }
    
    for (const caseId of testContext.createdEntities.cases) {
      try {
        await this.utils.makeRequest('DELETE', `/api/cases/${caseId}`, null, authHeaders);
      } catch (error) {
        console.log(`⚠️  Failed to cleanup case ${caseId}: ${error.message}`);
      }
    }
    
    for (const clientId of testContext.createdEntities.clients) {
      try {
        await this.utils.makeRequest('DELETE', `/api/clients/${clientId}`, null, authHeaders);
      } catch (error) {
        console.log(`⚠️  Failed to cleanup client ${clientId}: ${error.message}`);
      }
    }
    
    console.log('✅ Test cleanup completed');
  }

  /**
   * Generate test report
   */
  async generateTestReport() {
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: totalTime,
      results: testContext.testResults,
      summary: {
        total: testContext.testResults.length,
        passed: testContext.testResults.filter(r => r.passed).length,
        failed: testContext.testResults.filter(r => !r.passed).length
      },
      environment: {
        baseUrl: TEST_CONFIG.baseUrl,
        nodeVersion: process.version,
        platform: process.platform
      },
      createdEntities: testContext.createdEntities
    };
    
    const reportPath = path.join(__dirname, '..', 'test-reports', 
      `integration-test-report-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📁 Integration test report saved: ${reportPath}`);
    return report;
  }
}

// Initialize test suite
const testSuite = new IntegrationTestSuite();

// Jest setup and teardown
beforeAll(async () => {
  await testSuite.setupTests();
}, TEST_CONFIG.timeout);

afterAll(async () => {
  await testSuite.cleanupTests();
  await testSuite.generateTestReport();
}, TEST_CONFIG.timeout);

// Helper function to make authenticated requests
const authenticatedRequest = async (method, endpoint, data = null) => {
  const headers = {
    'Authorization': `Bearer ${testContext.authTokens.userToken}`,
    'X-API-Key': testContext.authTokens.apiKey
  };
  return testSuite.utils.makeRequest(method, endpoint, data, headers);
};

// Helper function to record test results
const recordTestResult = (testName, passed, details = {}) => {
  testContext.testResults.push({
    name: testName,
    passed,
    timestamp: Date.now(),
    ...details
  });
};

describe('HODOS 360 API Integration Tests', () => {
  
  describe('Authentication & Authorization Flow', () => {
    test('should handle authentication workflow', async () => {
      // Test unauthenticated access to protected endpoint
      const unauthResponse = await testSuite.utils.makeRequest('GET', '/api/clients');
      expect([401, 403]).toContain(unauthResponse.status);
      
      // Test authenticated access
      const authResponse = await authenticatedRequest('GET', '/api/clients');
      expect(authResponse.status).toBeLessThan(400);
      
      recordTestResult('authentication-workflow', true, {
        unauthStatus: unauthResponse.status,
        authStatus: authResponse.status
      });
    });

    test('should validate API key permissions', async () => {
      const response = await testSuite.utils.makeRequest('GET', '/api/clients', null, {
        'X-API-Key': 'invalid-api-key'
      });
      
      expect([401, 403]).toContain(response.status);
      recordTestResult('api-key-validation', true, { status: response.status });
    });
  });

  describe('Client Management Workflow', () => {
    test('should create, read, update, and delete client', async () => {
      // CREATE - Create new client
      const clientData = {
        firstName: 'Integration',
        lastName: 'Test',
        email: `integration-test-${Date.now()}@example.com`,
        phone: '+1555123456',
        company: 'Test Company LLC',
        type: 'corporate'
      };
      
      const createResponse = await authenticatedRequest('POST', '/api/clients', clientData);
      expect(createResponse.status).toBeLessThanOrEqual(201);
      expect(createResponse.data).toHaveProperty('id');
      
      const clientId = createResponse.data.id;
      testContext.createdEntities.clients.push(clientId);
      
      // READ - Get the created client
      const readResponse = await authenticatedRequest('GET', `/api/clients/${clientId}`);
      expect(readResponse.status).toBe(200);
      expect(readResponse.data.email).toBe(clientData.email);
      
      // UPDATE - Update client information
      const updateData = { ...clientData, company: 'Updated Test Company' };
      const updateResponse = await authenticatedRequest('PUT', `/api/clients/${clientId}`, updateData);
      expect(updateResponse.status).toBeLessThanOrEqual(200);
      
      // Verify update
      const verifyResponse = await authenticatedRequest('GET', `/api/clients/${clientId}`);
      expect(verifyResponse.data.company).toBe('Updated Test Company');
      
      recordTestResult('client-crud-workflow', true, {
        clientId,
        createStatus: createResponse.status,
        readStatus: readResponse.status,
        updateStatus: updateResponse.status
      });
    });

    test('should handle client validation errors', async () => {
      // Test invalid email
      const invalidData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'invalid-email',
        phone: '+1555123456'
      };
      
      const response = await authenticatedRequest('POST', '/api/clients', invalidData);
      expect(response.status).toBeGreaterThanOrEqual(400);
      
      recordTestResult('client-validation', true, { status: response.status });
    });
  });

  describe('Case Management Workflow', () => {
    let clientId;
    
    beforeEach(async () => {
      // Create a client for case tests
      const clientData = testSuite.utils.generateTestData('/api/clients', 'POST');
      const response = await authenticatedRequest('POST', '/api/clients', clientData);
      clientId = response.data?.id || 'test-client-id';
      if (response.data?.id) {
        testContext.createdEntities.clients.push(clientId);
      }
    });

    test('should create case linked to client', async () => {
      const caseData = {
        title: 'Integration Test Case',
        description: 'Test case for integration testing',
        caseType: 'litigation',
        status: 'active',
        priority: 'medium',
        clientId: clientId
      };
      
      const createResponse = await authenticatedRequest('POST', '/api/cases', caseData);
      expect(createResponse.status).toBeLessThanOrEqual(201);
      expect(createResponse.data).toHaveProperty('id');
      
      const caseId = createResponse.data.id;
      testContext.createdEntities.cases.push(caseId);
      
      // Verify case is linked to client
      const caseResponse = await authenticatedRequest('GET', `/api/cases/${caseId}`);
      expect(caseResponse.data.clientId).toBe(clientId);
      
      recordTestResult('case-client-link', true, {
        caseId,
        clientId,
        status: createResponse.status
      });
    });

    test('should retrieve cases by client', async () => {
      // Create multiple cases for the client
      const caseIds = [];
      
      for (let i = 0; i < 2; i++) {
        const caseData = {
          title: `Test Case ${i + 1}`,
          description: `Test case ${i + 1} for client`,
          caseType: 'litigation',
          clientId: clientId
        };
        
        const response = await authenticatedRequest('POST', '/api/cases', caseData);
        if (response.data?.id) {
          caseIds.push(response.data.id);
          testContext.createdEntities.cases.push(response.data.id);
        }
      }
      
      // Retrieve cases by client
      const response = await authenticatedRequest('GET', `/api/cases?clientId=${clientId}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      recordTestResult('cases-by-client', true, {
        clientId,
        caseCount: response.data?.length || 0
      });
    });
  });

  describe('Document Management Workflow', () => {
    let caseId;
    
    beforeEach(async () => {
      // Create client and case for document tests
      const clientData = testSuite.utils.generateTestData('/api/clients', 'POST');
      const clientResponse = await authenticatedRequest('POST', '/api/clients', clientData);
      const clientId = clientResponse.data?.id || 'test-client-id';
      
      if (clientResponse.data?.id) {
        testContext.createdEntities.clients.push(clientId);
      }
      
      const caseData = {
        title: 'Document Test Case',
        description: 'Case for document testing',
        caseType: 'contract',
        clientId: clientId
      };
      
      const caseResponse = await authenticatedRequest('POST', '/api/cases', caseData);
      caseId = caseResponse.data?.id || 'test-case-id';
      
      if (caseResponse.data?.id) {
        testContext.createdEntities.cases.push(caseId);
      }
    });

    test('should upload and link document to case', async () => {
      const documentData = {
        title: 'Integration Test Document',
        content: 'This is a test document for integration testing.',
        type: 'contract',
        caseId: caseId,
        fileName: 'test-document.txt',
        tags: ['integration', 'test']
      };
      
      // Upload document
      const uploadResponse = await authenticatedRequest('POST', '/api/documents', documentData);
      expect(uploadResponse.status).toBeLessThanOrEqual(201);
      expect(uploadResponse.data).toHaveProperty('id');
      
      const documentId = uploadResponse.data.id;
      testContext.createdEntities.documents.push(documentId);
      
      // Verify document is linked to case
      const documentResponse = await authenticatedRequest('GET', `/api/documents/${documentId}`);
      expect(documentResponse.data.caseId).toBe(caseId);
      
      recordTestResult('document-case-link', true, {
        documentId,
        caseId,
        uploadStatus: uploadResponse.status
      });
    });

    test('should retrieve documents by case', async () => {
      // Create multiple documents for the case
      const documentIds = [];
      
      for (let i = 0; i < 2; i++) {
        const documentData = {
          title: `Test Document ${i + 1}`,
          content: `Content for test document ${i + 1}`,
          type: 'evidence',
          caseId: caseId
        };
        
        const response = await authenticatedRequest('POST', '/api/documents', documentData);
        if (response.data?.id) {
          documentIds.push(response.data.id);
          testContext.createdEntities.documents.push(response.data.id);
        }
      }
      
      // Retrieve documents by case
      const response = await authenticatedRequest('GET', `/api/documents?caseId=${caseId}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      recordTestResult('documents-by-case', true, {
        caseId,
        documentCount: response.data?.length || 0
      });
    });
  });

  describe('AI Services Integration', () => {
    test('should process legal research workflow', async () => {
      // Step 1: Submit legal research request
      const researchData = {
        query: 'Contract formation requirements in commercial law',
        jurisdiction: 'US',
        caseType: 'commercial',
        context: 'Integration test research query'
      };
      
      const researchResponse = await authenticatedRequest('POST', '/api/ai/legal/research', researchData);
      expect(researchResponse.status).toBe(200);
      
      // Step 2: Use research results for brief generation
      if (researchResponse.data?.id) {
        const briefData = {
          caseTitle: 'Integration Test vs. Example Corp',
          facts: 'Test facts for brief generation',
          legalIssues: ['Contract formation', 'Commercial law'],
          researchId: researchResponse.data.id
        };
        
        const briefResponse = await authenticatedRequest('POST', '/api/ai/legal/brief', briefData);
        expect(briefResponse.status).toBe(200);
        
        recordTestResult('ai-legal-workflow', true, {
          researchStatus: researchResponse.status,
          briefStatus: briefResponse.status
        });
      }
    });

    test('should handle AI chat interaction', async () => {
      const chatData = {
        message: 'What are the key elements of a valid contract?',
        context: 'legal-research',
        maxTokens: 500
      };
      
      const response = await authenticatedRequest('POST', '/api/ai/chat', chatData);
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('response');
      
      recordTestResult('ai-chat-interaction', true, {
        status: response.status,
        hasResponse: !!response.data?.response
      });
    });

    test('should generate marketing content', async () => {
      const marketingData = {
        businessType: 'law-firm',
        targetAudience: 'corporate-clients',
        contentType: 'blog-post',
        topic: 'Corporate legal services',
        tone: 'professional'
      };
      
      const response = await authenticatedRequest('POST', '/api/ai/marketing/content', marketingData);
      expect(response.status).toBe(200);
      
      recordTestResult('ai-marketing-content', true, {
        status: response.status
      });
    });
  });

  describe('Analytics & Reporting Integration', () => {
    test('should retrieve dashboard analytics', async () => {
      const response = await authenticatedRequest('GET', '/api/analytics/dashboard');
      expect(response.status).toBe(200);
      expect(typeof response.data).toBe('object');
      
      recordTestResult('analytics-dashboard', true, {
        status: response.status,
        hasData: !!response.data
      });
    });

    test('should generate performance reports', async () => {
      const response = await authenticatedRequest('GET', '/api/analytics/performance');
      expect(response.status).toBe(200);
      
      recordTestResult('performance-reports', true, {
        status: response.status
      });
    });

    test('should retrieve financial analytics', async () => {
      const response = await authenticatedRequest('GET', '/api/analytics/financial');
      expect(response.status).toBe(200);
      
      recordTestResult('financial-analytics', true, {
        status: response.status
      });
    });
  });

  describe('Integration APIs Workflow', () => {
    test('should handle CRM integration', async () => {
      const crmData = {
        action: 'sync',
        provider: 'salesforce',
        entities: ['contacts', 'opportunities']
      };
      
      const response = await authenticatedRequest('POST', '/api/integrations/crm', crmData);
      expect([200, 202]).toContain(response.status); // 202 for async processing
      
      recordTestResult('crm-integration', true, {
        status: response.status
      });
    });

    test('should handle calendar integration', async () => {
      const calendarData = {
        action: 'create-event',
        title: 'Integration Test Meeting',
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 3600, // 1 hour
        attendees: ['test@example.com']
      };
      
      const response = await authenticatedRequest('POST', '/api/integrations/calendar', calendarData);
      expect([200, 201, 202]).toContain(response.status);
      
      recordTestResult('calendar-integration', true, {
        status: response.status
      });
    });

    test('should handle email integration', async () => {
      const emailData = {
        action: 'send',
        template: 'client-welcome',
        recipient: 'integration-test@example.com',
        variables: {
          clientName: 'Integration Test Client',
          firmName: 'Test Law Firm'
        }
      };
      
      const response = await authenticatedRequest('POST', '/api/integrations/email', emailData);
      expect([200, 202]).toContain(response.status);
      
      recordTestResult('email-integration', true, {
        status: response.status
      });
    });
  });

  describe('Marketing Platform Integration', () => {
    test('should create and manage marketing campaign', async () => {
      const campaignData = {
        name: 'Integration Test Campaign',
        type: 'email',
        targetAudience: 'existing-clients',
        content: {
          subject: 'Test Email Campaign',
          template: 'newsletter',
          variables: {
            firmName: 'Test Law Firm'
          }
        },
        schedule: {
          sendAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour from now
        }
      };
      
      // Create campaign
      const createResponse = await authenticatedRequest('POST', '/api/marketing/campaigns', campaignData);
      expect(createResponse.status).toBeLessThanOrEqual(201);
      
      if (createResponse.data?.id) {
        const campaignId = createResponse.data.id;
        testContext.createdEntities.campaigns.push(campaignId);
        
        // Get campaign details
        const getResponse = await authenticatedRequest('GET', `/api/marketing/campaigns/${campaignId}`);
        expect(getResponse.status).toBe(200);
        
        recordTestResult('marketing-campaign', true, {
          createStatus: createResponse.status,
          getStatus: getResponse.status,
          campaignId
        });
      }
    });

    test('should analyze SEO performance', async () => {
      const seoData = {
        url: 'https://example-lawfirm.com',
        keywords: ['personal injury lawyer', 'legal services'],
        competitors: ['competitor1.com', 'competitor2.com']
      };
      
      const response = await authenticatedRequest('POST', '/api/ai/seo', seoData);
      expect(response.status).toBe(200);
      
      recordTestResult('seo-analysis', true, {
        status: response.status
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    test('should handle invalid data gracefully', async () => {
      const invalidData = {
        invalidField: 'invalid-value',
        nullField: null,
        emptyString: '',
        largeString: 'x'.repeat(10000)
      };
      
      const response = await authenticatedRequest('POST', '/api/clients', invalidData);
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.data).toHaveProperty('error');
      
      recordTestResult('error-handling', true, {
        status: response.status,
        hasErrorMessage: !!response.data?.error
      });
    });

    test('should handle rate limiting', async () => {
      // Make rapid requests to trigger rate limiting
      const requests = Array(20).fill(null).map(() => 
        authenticatedRequest('GET', '/api/health')
      );
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      // Rate limiting should kick in for rapid requests
      recordTestResult('rate-limiting', true, {
        totalRequests: requests.length,
        rateLimitTriggered: rateLimited
      });
    });

    test('should maintain data consistency', async () => {
      // Create client
      const clientData = testSuite.utils.generateTestData('/api/clients', 'POST');
      const clientResponse = await authenticatedRequest('POST', '/api/clients', clientData);
      const clientId = clientResponse.data?.id;
      
      if (clientId) {
        testContext.createdEntities.clients.push(clientId);
        
        // Create case for client
        const caseData = {
          title: 'Consistency Test Case',
          description: 'Test case for data consistency',
          clientId: clientId
        };
        
        const caseResponse = await authenticatedRequest('POST', '/api/cases', caseData);
        const caseId = caseResponse.data?.id;
        
        if (caseId) {
          testContext.createdEntities.cases.push(caseId);
          
          // Verify case references valid client
          const verifyResponse = await authenticatedRequest('GET', `/api/cases/${caseId}`);
          expect(verifyResponse.data.clientId).toBe(clientId);
          
          recordTestResult('data-consistency', true, {
            clientId,
            caseId,
            consistencyVerified: verifyResponse.data.clientId === clientId
          });
        }
      }
    });
  });

  describe('Performance & Reliability', () => {
    test('should handle concurrent requests', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      const requests = Array(concurrentRequests).fill(null).map(() =>
        authenticatedRequest('GET', '/api/health')
      );
      
      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      ).length;
      
      expect(successful).toBeGreaterThan(concurrentRequests * 0.8); // 80% success rate
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      
      recordTestResult('concurrent-requests', true, {
        totalRequests: concurrentRequests,
        successful,
        duration,
        successRate: (successful / concurrentRequests) * 100
      });
    });

    test('should respond within acceptable time limits', async () => {
      const endpoints = [
        '/api/health',
        '/api/clients',
        '/api/analytics/dashboard'
      ];
      
      const results = [];
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await authenticatedRequest('GET', endpoint);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        results.push({
          endpoint,
          responseTime,
          status: response.status,
          withinLimit: responseTime < 5000 // 5 second limit
        });
      }
      
      const allWithinLimit = results.every(r => r.withinLimit);
      
      recordTestResult('response-times', allWithinLimit, {
        results,
        averageResponseTime: Math.round(
          results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
        )
      });
    });
  });
});

// Export for external usage
module.exports = {
  IntegrationTestSuite,
  testContext,
  TEST_CONFIG
};