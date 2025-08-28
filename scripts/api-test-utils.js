/**
 * HODOS 360 API Test Utilities
 * 
 * Comprehensive utilities for testing API endpoints including:
 * - HTTP request helpers with authentication
 * - Mock data generation
 * - Response validation
 * - Performance testing utilities
 * - Security testing tools
 * - Report generation
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { performance } = require('perf_hooks');

/**
 * Core API testing utilities
 */
class ApiTestUtils {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = 10000;
    this.maxRetries = 3;
    
    // Mock data templates
    this.mockData = {
      user: {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        firmId: 'test-firm-123'
      },
      client: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Doe Industries',
        type: 'corporate'
      },
      case: {
        title: 'Test Case',
        description: 'Test case for API testing',
        caseType: 'litigation',
        status: 'active',
        priority: 'medium'
      },
      document: {
        title: 'Test Document',
        content: 'This is test document content for API testing.',
        type: 'contract',
        tags: ['test', 'api']
      }
    };
  }

  /**
   * Make HTTP request with proper error handling and timeouts
   */
  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions = {
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'HODOS-API-Test-Suite/1.0',
        ...headers
      }
    };
    
    // Add body for POST, PUT, PATCH requests
    if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      requestOptions.body = JSON.stringify(data);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
      
      requestOptions.signal = controller.signal;
      
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      // Parse response based on content type
      const contentType = response.headers.get('content-type');
      let responseData;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (parseError) {
          responseData = { error: 'Invalid JSON response' };
        }
      } else {
        responseData = await response.text();
      }
      
      return {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: responseData,
        url: response.url,
        ok: response.ok
      };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${this.defaultTimeout}ms`);
      }
      throw new Error(`Request failed: ${error.message}`);
    }
  }

  /**
   * Generate test data for specific endpoint
   */
  generateTestData(endpoint, method) {
    const lowerEndpoint = endpoint.toLowerCase();
    const upperMethod = method.toUpperCase();
    
    // Return appropriate test data based on endpoint and method
    if (lowerEndpoint.includes('client')) {
      return upperMethod === 'GET' ? null : this.mockData.client;
    }
    
    if (lowerEndpoint.includes('case')) {
      return upperMethod === 'GET' ? null : this.mockData.case;
    }
    
    if (lowerEndpoint.includes('document')) {
      return upperMethod === 'GET' ? null : this.mockData.document;
    }
    
    if (lowerEndpoint.includes('contact')) {
      return {
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Company',
        message: 'This is a test message from the API test suite.',
        phone: '+1234567890'
      };
    }
    
    if (lowerEndpoint.includes('demo')) {
      return {
        name: 'Test User',
        email: 'test@example.com',
        company: 'Test Law Firm',
        firmSize: '10-50',
        interestedProducts: ['HODOS Core', 'Marketing Platform'],
        preferredTime: '2024-01-15T10:00:00.000Z'
      };
    }
    
    if (lowerEndpoint.includes('newsletter')) {
      return {
        email: 'newsletter-test@example.com',
        interests: ['legal-tech', 'ai-updates']
      };
    }
    
    if (lowerEndpoint.includes('ai/chat')) {
      return {
        message: 'What are the key components of a valid contract?',
        context: 'legal-research',
        maxTokens: 500
      };
    }
    
    if (lowerEndpoint.includes('ai/legal/research')) {
      return {
        query: 'Contract law principles',
        jurisdiction: 'US',
        caseType: 'commercial'
      };
    }
    
    if (lowerEndpoint.includes('ai/legal/brief')) {
      return {
        caseTitle: 'Test vs. Example',
        facts: 'Test case facts for brief generation',
        legalIssues: ['Contract breach', 'Damages'],
        jurisdiction: 'US'
      };
    }
    
    if (lowerEndpoint.includes('ai/legal/contract')) {
      return {
        contractType: 'service-agreement',
        parties: ['Test Company', 'Example Corp'],
        terms: 'Standard service terms'
      };
    }
    
    if (lowerEndpoint.includes('ai/marketing')) {
      return {
        businessType: 'law-firm',
        targetAudience: 'corporate-clients',
        goals: ['brand-awareness', 'lead-generation']
      };
    }
    
    if (lowerEndpoint.includes('ai/seo')) {
      return {
        url: 'https://example-lawfirm.com',
        keywords: ['personal injury lawyer', 'legal services'],
        competitors: ['competitor1.com', 'competitor2.com']
      };
    }
    
    if (lowerEndpoint.includes('ai/video')) {
      return {
        script: 'Welcome to our law firm. We provide excellent legal services.',
        voice: 'professional',
        avatar: 'attorney'
      };
    }
    
    if (lowerEndpoint.includes('upload')) {
      return {
        fileName: 'test-document.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        content: 'base64-encoded-content-here'
      };
    }
    
    if (lowerEndpoint.includes('marketing/campaign')) {
      return {
        name: 'Test Campaign',
        type: 'email',
        targetAudience: 'potential-clients',
        content: {
          subject: 'Test Email Campaign',
          body: 'This is a test email campaign.'
        }
      };
    }
    
    // Default test data for generic endpoints
    if (upperMethod === 'POST') {
      return {
        testField: 'test-value',
        timestamp: new Date().toISOString(),
        source: 'api-test-suite'
      };
    }
    
    return null;
  }

  /**
   * Create test API key (mock implementation)
   */
  async createTestApiKey() {
    // In a real implementation, this would create an actual API key
    // For testing, we'll return a mock API key
    return `test-api-key-${crypto.randomUUID()}`;
  }

  /**
   * Create test user token (mock implementation)
   */
  async createTestUserToken() {
    // In a real implementation, this would authenticate and get a real token
    // For testing, we'll return a mock JWT-like token
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      sub: 'test-user-123',
      email: 'test@example.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    })).toString('base64');
    const signature = crypto.createHash('sha256').update(`${header}.${payload}.test-secret`).digest('base64');
    
    return `${header}.${payload}.${signature}`;
  }

  /**
   * Validate response structure and content
   */
  validateResponse(response, expectedSchema = null) {
    const validation = {
      valid: true,
      errors: [],
      warnings: []
    };
    
    // Check basic response structure
    if (!response.status) {
      validation.valid = false;
      validation.errors.push('Response missing status code');
    }
    
    // Check for successful status codes
    if (response.status >= 400) {
      if (!response.data || !response.data.error) {
        validation.errors.push('Error response missing error message');
      }
    }
    
    // Check content type for JSON responses
    if (response.status !== 204 && response.headers) {
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        validation.warnings.push(`Unexpected content type: ${contentType}`);
      }
    }
    
    // Validate against schema if provided
    if (expectedSchema && response.data) {
      const schemaValidation = this.validateAgainstSchema(response.data, expectedSchema);
      validation.valid = validation.valid && schemaValidation.valid;
      validation.errors.push(...schemaValidation.errors);
      validation.warnings.push(...schemaValidation.warnings);
    }
    
    return validation;
  }

  /**
   * Validate data against expected schema
   */
  validateAgainstSchema(data, schema) {
    const validation = { valid: true, errors: [], warnings: [] };
    
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data)) {
          validation.valid = false;
          validation.errors.push(`Missing required field: ${field}`);
        }
      }
    }
    
    if (schema.properties) {
      for (const [field, fieldSchema] of Object.entries(schema.properties)) {
        if (field in data) {
          const fieldValue = data[field];
          
          if (fieldSchema.type && typeof fieldValue !== fieldSchema.type) {
            validation.valid = false;
            validation.errors.push(`Field ${field} should be ${fieldSchema.type}, got ${typeof fieldValue}`);
          }
          
          if (fieldSchema.minLength && fieldValue.length < fieldSchema.minLength) {
            validation.valid = false;
            validation.errors.push(`Field ${field} too short, minimum ${fieldSchema.minLength} characters`);
          }
          
          if (fieldSchema.maxLength && fieldValue.length > fieldSchema.maxLength) {
            validation.warnings.push(`Field ${field} is long, maximum recommended ${fieldSchema.maxLength} characters`);
          }
        }
      }
    }
    
    return validation;
  }

  /**
   * Measure response time and performance metrics
   */
  async measurePerformance(requestFn) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    
    try {
      const result = await requestFn();
      
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      
      return {
        result,
        metrics: {
          responseTime: Math.round(endTime - startTime),
          memoryUsed: endMemory.heapUsed - startMemory.heapUsed,
          success: true
        }
      };
    } catch (error) {
      const endTime = performance.now();
      
      return {
        result: null,
        metrics: {
          responseTime: Math.round(endTime - startTime),
          memoryUsed: 0,
          success: false,
          error: error.message
        }
      };
    }
  }

  /**
   * Generate random test data
   */
  generateRandomData(type) {
    const generators = {
      email: () => `test-${crypto.randomUUID().split('-')[0]}@example.com`,
      phone: () => `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      name: () => {
        const first = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana'];
        const last = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia'];
        return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
      },
      company: () => {
        const prefixes = ['Acme', 'Global', 'Premier', 'Elite', 'Advanced', 'Strategic'];
        const suffixes = ['Law Firm', 'Legal Services', 'Associates', 'Partners', 'Group', 'LLC'];
        return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
      },
      text: (length = 100) => {
        const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
        const result = [];
        while (result.join(' ').length < length) {
          result.push(words[Math.floor(Math.random() * words.length)]);
        }
        return result.join(' ').substring(0, length);
      }
    };
    
    return generators[type] ? generators[type]() : null;
  }
}

/**
 * Security testing utilities
 */
class SecurityTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.utils = new ApiTestUtils(baseUrl);
  }

  /**
   * Run all security tests
   */
  async runAllTests(endpoints) {
    const results = [];
    
    console.log('   🔐 Testing authentication bypass...');
    results.push(...await this.testAuthenticationBypass(endpoints));
    
    console.log('   🛡️  Testing input validation...');
    results.push(...await this.testInputValidation(endpoints));
    
    console.log('   🚨 Testing injection attacks...');
    results.push(...await this.testInjectionAttacks(endpoints));
    
    console.log('   🔒 Testing security headers...');
    results.push(...await this.testSecurityHeaders(endpoints));
    
    console.log('   ⚡ Testing rate limiting...');
    results.push(...await this.testRateLimiting(endpoints));
    
    return results;
  }

  /**
   * Test authentication bypass attempts
   */
  async testAuthenticationBypass(endpoints) {
    const results = [];
    const authEndpoints = endpoints.filter(ep => ep.auth);
    
    for (const endpoint of authEndpoints.slice(0, 5)) { // Test first 5 auth endpoints
      try {
        // Test without authentication
        const response = await this.utils.makeRequest('GET', endpoint.path);
        
        results.push({
          testType: 'security',
          test: 'authentication-bypass',
          endpoint: endpoint.path,
          passed: response.status === 401 || response.status === 403,
          status: response.status,
          category: 'security'
        });
      } catch (error) {
        results.push({
          testType: 'security',
          test: 'authentication-bypass',
          endpoint: endpoint.path,
          passed: false,
          error: error.message,
          category: 'security'
        });
      }
    }
    
    return results;
  }

  /**
   * Test input validation
   */
  async testInputValidation(endpoints) {
    const results = [];
    const postEndpoints = endpoints.filter(ep => ep.methods.includes('POST')).slice(0, 5);
    
    const invalidInputs = [
      { name: 'empty-object', data: {} },
      { name: 'null-values', data: { field1: null, field2: null } },
      { name: 'long-strings', data: { field: 'x'.repeat(10000) } },
      { name: 'invalid-types', data: { email: 12345, phone: true } }
    ];
    
    for (const endpoint of postEndpoints) {
      for (const invalidInput of invalidInputs) {
        try {
          const response = await this.utils.makeRequest('POST', endpoint.path, invalidInput.data);
          
          results.push({
            testType: 'security',
            test: `input-validation-${invalidInput.name}`,
            endpoint: endpoint.path,
            passed: response.status >= 400 && response.status < 500,
            status: response.status,
            category: 'security'
          });
        } catch (error) {
          results.push({
            testType: 'security',
            test: `input-validation-${invalidInput.name}`,
            endpoint: endpoint.path,
            passed: false,
            error: error.message,
            category: 'security'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Test injection attacks
   */
  async testInjectionAttacks(endpoints) {
    const results = [];
    const testPayloads = [
      { name: 'sql-injection', payload: "'; DROP TABLE users; --" },
      { name: 'xss-script', payload: '<script>alert("xss")</script>' },
      { name: 'command-injection', payload: '; rm -rf /' },
      { name: 'nosql-injection', payload: { $ne: null } }
    ];
    
    const postEndpoints = endpoints.filter(ep => ep.methods.includes('POST')).slice(0, 3);
    
    for (const endpoint of postEndpoints) {
      for (const payload of testPayloads) {
        try {
          const testData = { testField: payload.payload };
          const response = await this.utils.makeRequest('POST', endpoint.path, testData);
          
          // Check if the payload was properly handled (not executed)
          const responseText = JSON.stringify(response.data).toLowerCase();
          const containsPayload = responseText.includes(payload.payload.toLowerCase());
          
          results.push({
            testType: 'security',
            test: `injection-${payload.name}`,
            endpoint: endpoint.path,
            passed: response.status >= 400 || !containsPayload,
            status: response.status,
            category: 'security'
          });
        } catch (error) {
          results.push({
            testType: 'security',
            test: `injection-${payload.name}`,
            endpoint: endpoint.path,
            passed: false,
            error: error.message,
            category: 'security'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders(endpoints) {
    const results = [];
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security'
    ];
    
    const testEndpoint = endpoints[0]; // Test one endpoint for headers
    
    try {
      const response = await this.utils.makeRequest('GET', testEndpoint.path);
      
      for (const header of requiredHeaders) {
        const hasHeader = response.headers && response.headers.get && response.headers.get(header);
        
        results.push({
          testType: 'security',
          test: `security-header-${header}`,
          endpoint: testEndpoint.path,
          passed: !!hasHeader,
          category: 'security'
        });
      }
    } catch (error) {
      results.push({
        testType: 'security',
        test: 'security-headers',
        endpoint: testEndpoint.path,
        passed: false,
        error: error.message,
        category: 'security'
      });
    }
    
    return results;
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting(endpoints) {
    const results = [];
    const testEndpoint = endpoints.find(ep => ep.path.includes('health')) || endpoints[0];
    
    try {
      // Make rapid requests to trigger rate limiting
      const requests = Array(10).fill(null).map(() => 
        this.utils.makeRequest('GET', testEndpoint.path)
      );
      
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );
      
      results.push({
        testType: 'security',
        test: 'rate-limiting',
        endpoint: testEndpoint.path,
        passed: rateLimited,
        category: 'security'
      });
    } catch (error) {
      results.push({
        testType: 'security',
        test: 'rate-limiting',
        endpoint: testEndpoint.path,
        passed: false,
        error: error.message,
        category: 'security'
      });
    }
    
    return results;
  }
}

/**
 * Performance testing utilities
 */
class PerformanceTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.utils = new ApiTestUtils(baseUrl);
    this.thresholds = {
      fast: 500,      // < 500ms
      acceptable: 2000, // < 2s
      slow: 5000      // < 5s
    };
  }

  /**
   * Run all performance tests
   */
  async runAllTests(endpoints) {
    const results = [];
    
    console.log('   ⚡ Testing response times...');
    results.push(...await this.testResponseTimes(endpoints));
    
    console.log('   🔄 Testing concurrent requests...');
    results.push(...await this.testConcurrentRequests(endpoints));
    
    console.log('   📊 Testing payload sizes...');
    results.push(...await this.testPayloadSizes(endpoints));
    
    return results;
  }

  /**
   * Test response times for all endpoints
   */
  async testResponseTimes(endpoints) {
    const results = [];
    
    for (const endpoint of endpoints.slice(0, 10)) { // Test first 10 endpoints
      for (const method of endpoint.methods.slice(0, 1)) { // Test first method only
        try {
          const startTime = performance.now();
          const response = await this.utils.makeRequest(method, endpoint.path);
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          let performanceRating;
          if (responseTime < this.thresholds.fast) performanceRating = 'fast';
          else if (responseTime < this.thresholds.acceptable) performanceRating = 'acceptable';
          else if (responseTime < this.thresholds.slow) performanceRating = 'slow';
          else performanceRating = 'very-slow';
          
          results.push({
            testType: 'performance',
            test: 'response-time',
            endpoint: endpoint.path,
            method,
            passed: responseTime < this.thresholds.slow,
            duration: Math.round(responseTime),
            rating: performanceRating,
            category: 'performance'
          });
        } catch (error) {
          results.push({
            testType: 'performance',
            test: 'response-time',
            endpoint: endpoint.path,
            method,
            passed: false,
            error: error.message,
            category: 'performance'
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Test concurrent request handling
   */
  async testConcurrentRequests(endpoints) {
    const results = [];
    const testEndpoint = endpoints.find(ep => !ep.auth) || endpoints[0];
    const concurrentCount = 5;
    
    try {
      const startTime = performance.now();
      
      const requests = Array(concurrentCount).fill(null).map(() =>
        this.utils.makeRequest('GET', testEndpoint.path)
      );
      
      const responses = await Promise.allSettled(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      const successful = responses.filter(r => r.status === 'fulfilled').length;
      const avgTimePerRequest = totalTime / concurrentCount;
      
      results.push({
        testType: 'performance',
        test: 'concurrent-requests',
        endpoint: testEndpoint.path,
        passed: successful === concurrentCount && avgTimePerRequest < this.thresholds.acceptable,
        duration: Math.round(totalTime),
        concurrent: concurrentCount,
        successful,
        avgTimePerRequest: Math.round(avgTimePerRequest),
        category: 'performance'
      });
    } catch (error) {
      results.push({
        testType: 'performance',
        test: 'concurrent-requests',
        endpoint: testEndpoint.path,
        passed: false,
        error: error.message,
        category: 'performance'
      });
    }
    
    return results;
  }

  /**
   * Test response payload sizes
   */
  async testPayloadSizes(endpoints) {
    const results = [];
    const maxReasonableSize = 1024 * 1024; // 1MB
    
    for (const endpoint of endpoints.slice(0, 5)) {
      try {
        const response = await this.utils.makeRequest('GET', endpoint.path);
        
        let payloadSize = 0;
        if (response.data) {
          payloadSize = JSON.stringify(response.data).length;
        }
        
        results.push({
          testType: 'performance',
          test: 'payload-size',
          endpoint: endpoint.path,
          passed: payloadSize <= maxReasonableSize,
          payloadSize,
          category: 'performance'
        });
      } catch (error) {
        results.push({
          testType: 'performance',
          test: 'payload-size',
          endpoint: endpoint.path,
          passed: false,
          error: error.message,
          category: 'performance'
        });
      }
    }
    
    return results;
  }
}

/**
 * Integration testing utilities
 */
class IntegrationTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.utils = new ApiTestUtils(baseUrl);
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    const results = [];
    
    console.log('   🔗 Testing user workflow...');
    results.push(...await this.testUserWorkflow());
    
    console.log('   📄 Testing document workflow...');
    results.push(...await this.testDocumentWorkflow());
    
    console.log('   🤖 Testing AI service chain...');
    results.push(...await this.testAiServiceChain());
    
    return results;
  }

  /**
   * Test complete user workflow
   */
  async testUserWorkflow() {
    const results = [];
    
    try {
      // 1. Create client
      const clientData = this.utils.generateTestData('/api/clients', 'POST');
      const clientResponse = await this.utils.makeRequest('POST', '/api/clients', clientData);
      
      results.push({
        testType: 'integration',
        test: 'user-workflow-create-client',
        passed: clientResponse.status === 201 || clientResponse.status === 200,
        status: clientResponse.status,
        category: 'integration'
      });
      
      if (clientResponse.ok) {
        // 2. Create case for client
        const caseData = {
          ...this.utils.generateTestData('/api/cases', 'POST'),
          clientId: clientResponse.data?.id || 'test-client-id'
        };
        
        const caseResponse = await this.utils.makeRequest('POST', '/api/cases', caseData);
        
        results.push({
          testType: 'integration',
          test: 'user-workflow-create-case',
          passed: caseResponse.status === 201 || caseResponse.status === 200,
          status: caseResponse.status,
          category: 'integration'
        });
      }
    } catch (error) {
      results.push({
        testType: 'integration',
        test: 'user-workflow',
        passed: false,
        error: error.message,
        category: 'integration'
      });
    }
    
    return results;
  }

  /**
   * Test document workflow
   */
  async testDocumentWorkflow() {
    const results = [];
    
    try {
      // 1. Upload document
      const uploadData = this.utils.generateTestData('/api/upload', 'POST');
      const uploadResponse = await this.utils.makeRequest('POST', '/api/upload', uploadData);
      
      results.push({
        testType: 'integration',
        test: 'document-workflow-upload',
        passed: uploadResponse.status === 201 || uploadResponse.status === 200,
        status: uploadResponse.status,
        category: 'integration'
      });
      
      if (uploadResponse.ok) {
        // 2. Process document with AI
        const aiData = {
          documentId: uploadResponse.data?.id || 'test-doc-id',
          operation: 'analyze'
        };
        
        const aiResponse = await this.utils.makeRequest('POST', '/api/ai/document', aiData);
        
        results.push({
          testType: 'integration',
          test: 'document-workflow-ai-process',
          passed: aiResponse.status === 200,
          status: aiResponse.status,
          category: 'integration'
        });
      }
    } catch (error) {
      results.push({
        testType: 'integration',
        test: 'document-workflow',
        passed: false,
        error: error.message,
        category: 'integration'
      });
    }
    
    return results;
  }

  /**
   * Test AI service chain
   */
  async testAiServiceChain() {
    const results = [];
    
    try {
      // 1. Legal research
      const researchData = this.utils.generateTestData('/api/ai/legal/research', 'POST');
      const researchResponse = await this.utils.makeRequest('POST', '/api/ai/legal/research', researchData);
      
      results.push({
        testType: 'integration',
        test: 'ai-chain-research',
        passed: researchResponse.status === 200,
        status: researchResponse.status,
        category: 'integration'
      });
      
      if (researchResponse.ok) {
        // 2. Generate brief based on research
        const briefData = {
          ...this.utils.generateTestData('/api/ai/legal/brief', 'POST'),
          researchId: researchResponse.data?.id || 'test-research-id'
        };
        
        const briefResponse = await this.utils.makeRequest('POST', '/api/ai/legal/brief', briefData);
        
        results.push({
          testType: 'integration',
          test: 'ai-chain-brief',
          passed: briefResponse.status === 200,
          status: briefResponse.status,
          category: 'integration'
        });
      }
    } catch (error) {
      results.push({
        testType: 'integration',
        test: 'ai-service-chain',
        passed: false,
        error: error.message,
        category: 'integration'
      });
    }
    
    return results;
  }
}

/**
 * Test report generator
 */
class TestReporter {
  /**
   * Generate HTML test report
   */
  async generateHtmlReport(report, outputPath) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HODOS 360 API Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .header .subtitle { opacity: 0.8; margin-top: 10px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .success { color: #10b981; }
        .error { color: #ef4444; }
        .warning { color: #f59e0b; }
        .section { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .section h2 { margin-top: 0; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
        .status-pass { background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; }
        .status-fail { background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; font-size: 0.85em; }
        .category-tag { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; }
        .duration { color: #6b7280; font-size: 0.9em; }
        .footer { text-align: center; color: #6b7280; margin-top: 40px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 HODOS 360 API Test Report</h1>
            <div class="subtitle">Generated on ${new Date(report.timestamp).toLocaleString()}</div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.summary.total}</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">${report.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value error">${report.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value warning">${report.summary.warnings}</div>
                <div class="metric-label">Warnings</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.passRate}%</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.avgResponseTime}ms</div>
                <div class="metric-label">Avg Response</div>
            </div>
        </div>
        
        <div class="section">
            <h2>📊 Test Results by Category</h2>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Method</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Details</th>
                    </tr>
                </thead>
                <tbody>
                    ${report.results.map(result => `
                        <tr>
                            <td><code>${result.endpoint}</code></td>
                            <td><strong>${result.method || 'N/A'}</strong></td>
                            <td><span class="category-tag">${result.category || 'general'}</span></td>
                            <td><span class="status-${result.passed ? 'pass' : 'fail'}">${result.passed ? 'PASS' : 'FAIL'}</span></td>
                            <td class="duration">${result.duration || 0}ms</td>
                            <td>${result.error || result.warning || 'OK'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        ${report.summary.failed > 0 ? `
            <div class="section">
                <h2>❌ Failed Tests</h2>
                <table>
                    <thead>
                        <tr><th>Endpoint</th><th>Method</th><th>Error</th></tr>
                    </thead>
                    <tbody>
                        ${report.summary.failures.map(failure => `
                            <tr>
                                <td><code>${failure.endpoint}</code></td>
                                <td><strong>${failure.method}</strong></td>
                                <td class="error">${failure.error}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''}
        
        <div class="section">
            <h2>⚡ Performance Metrics</h2>
            <p><strong>Average Response Time:</strong> ${report.performance.averageResponseTime}ms</p>
            ${report.performance.slowQueries.length > 0 ? `
                <h3>🐌 Slow Queries (>${2000}ms)</h3>
                <ul>
                    ${report.performance.slowQueries.map(query => 
                        `<li><code>${query.endpoint}</code> - ${query.duration}ms</li>`
                    ).join('')}
                </ul>
            ` : '<p class="success">✅ All queries performed well!</p>'}
        </div>
        
        <div class="section">
            <h2>🔒 Security Results</h2>
            <p><strong>Security Tests:</strong> ${report.security.passed}/${report.security.total} passed</p>
            ${report.security.vulnerabilities.length > 0 ? `
                <h3>⚠️ Security Issues Found</h3>
                <ul>
                    ${report.security.vulnerabilities.map(vuln => 
                        `<li><strong>${vuln.test}:</strong> ${vuln.error || 'Failed'}</li>`
                    ).join('')}
                </ul>
            ` : '<p class="success">✅ No security vulnerabilities detected!</p>'}
        </div>
        
        <div class="footer">
            <p>Generated by HODOS 360 API Test Suite | Total Time: ${(report.totalTime / 1000).toFixed(2)}s</p>
        </div>
    </div>
</body>
</html>`;
    
    await fs.writeFile(outputPath, html);
  }
}

module.exports = {
  ApiTestUtils,
  SecurityTester,
  PerformanceTester,
  IntegrationTester,
  TestReporter
};