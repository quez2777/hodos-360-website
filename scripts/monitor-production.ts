#!/usr/bin/env tsx

/**
 * HODOS 360 Production Monitoring System
 * 
 * Continuous monitoring for production deployment
 * Monitors health, performance, integrations, and business metrics
 */

import axios, { AxiosResponse } from 'axios'
import { performance } from 'perf_hooks'

interface MonitoringMetrics {
  timestamp: string
  uptime: boolean
  responseTime: number
  healthScore: number
  errors: string[]
  warnings: string[]
  services: {
    database: ServiceStatus
    api: ServiceStatus
    ghl: ServiceStatus
    stripe: ServiceStatus
    email: ServiceStatus
  }
  performance: {
    avgResponseTime: number
    slowQueries: number
    errorRate: number
    memoryUsage?: number
    cpuUsage?: number
  }
  business: {
    activeUsers: number
    leadsToday: number
    conversionsToday: number
    revenueToday: number
  }
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded' | 'unknown'
  responseTime: number
  lastCheck: string
  error?: string
  details?: any
}

interface Alert {
  level: 'info' | 'warning' | 'critical'
  service: string
  message: string
  timestamp: string
  resolved?: boolean
}

class ProductionMonitor {
  private baseUrl: string
  private apiKey?: string
  private alerts: Alert[] = []
  private metrics: MonitoringMetrics[] = []
  private isRunning = false
  private intervalId?: NodeJS.Timeout

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
  }

  private async makeRequest(
    method: 'GET' | 'POST',
    endpoint: string,
    data?: any
  ): Promise<AxiosResponse> {
    const url = `${this.baseUrl}${endpoint}`
    return axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'HODOS-Production-Monitor/1.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      },
      timeout: 30000,
      validateStatus: () => true
    })
  }

  private addAlert(level: Alert['level'], service: string, message: string): void {
    const alert: Alert = {
      level,
      service,
      message,
      timestamp: new Date().toISOString()
    }

    this.alerts.push(alert)
    
    // Log alert immediately
    const emoji = level === 'critical' ? '🚨' : level === 'warning' ? '⚠️' : 'ℹ️'
    console.log(`${emoji} [${level.toUpperCase()}] ${service}: ${message}`)

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100)
    }
  }

  // Database Health Check
  private async checkDatabase(): Promise<ServiceStatus> {
    const startTime = performance.now()
    
    try {
      const response = await this.makeRequest('GET', '/api/health')
      const responseTime = performance.now() - startTime

      if (response.status === 200 && response.data.status === 'healthy') {
        const dbCheck = response.data.checks?.database
        if (dbCheck?.status === 'up') {
          return {
            status: 'up',
            responseTime,
            lastCheck: new Date().toISOString(),
            details: dbCheck
          }
        }
      }

      return {
        status: 'down',
        responseTime,
        lastCheck: new Date().toISOString(),
        error: `Database check failed: ${response.status}`
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // API Health Check
  private async checkAPI(): Promise<ServiceStatus> {
    const startTime = performance.now()
    
    try {
      const response = await this.makeRequest('GET', '/api/health/detailed')
      const responseTime = performance.now() - startTime

      if (response.status === 200) {
        return {
          status: 'up',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: response.data
        }
      } else if (response.status >= 500) {
        return {
          status: 'down',
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `API returning 5xx errors: ${response.status}`
        }
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `API issues: ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // GHL Integration Check
  private async checkGHLIntegration(): Promise<ServiceStatus> {
    const startTime = performance.now()
    
    try {
      // Test GHL webhook endpoint
      const response = await this.makeRequest('POST', '/api/integrations/crm', {
        type: 'health_check',
        timestamp: new Date().toISOString()
      })
      
      const responseTime = performance.now() - startTime

      if ([200, 400].includes(response.status)) {
        return {
          status: 'up',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: { webhookStatus: 'responsive' }
        }
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `GHL webhook issues: ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Stripe Integration Check  
  private async checkStripeIntegration(): Promise<ServiceStatus> {
    const startTime = performance.now()
    
    try {
      const response = await this.makeRequest('POST', '/api/integrations/payment', {
        type: 'health_check',
        amount: 100, // Test amount in cents
        currency: 'usd'
      })
      
      const responseTime = performance.now() - startTime

      if ([200, 400].includes(response.status)) {
        return {
          status: 'up',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: { paymentGateway: 'responsive' }
        }
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `Stripe integration issues: ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Email Service Check
  private async checkEmailService(): Promise<ServiceStatus> {
    const startTime = performance.now()
    
    try {
      const response = await this.makeRequest('GET', '/api/email/status')
      const responseTime = performance.now() - startTime

      if (response.status === 200) {
        return {
          status: 'up',
          responseTime,
          lastCheck: new Date().toISOString(),
          details: response.data
        }
      } else {
        return {
          status: 'degraded',
          responseTime,
          lastCheck: new Date().toISOString(),
          error: `Email service issues: ${response.status}`
        }
      }
    } catch (error) {
      return {
        status: 'down',
        responseTime: performance.now() - startTime,
        lastCheck: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  // Performance Monitoring
  private async checkPerformance(): Promise<MonitoringMetrics['performance']> {
    const checks = [
      this.makeRequest('GET', '/'),
      this.makeRequest('GET', '/api/health'),
      this.makeRequest('GET', '/api/data/pricing'),
      this.makeRequest('GET', '/products'),
      this.makeRequest('GET', '/contact')
    ]

    const results = await Promise.allSettled(checks)
    const responseTimes: number[] = []
    let errors = 0

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const response = result.value
        if (response.status >= 500) errors++
      } else {
        errors++
      }
    })

    // Calculate average response time from successful requests
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b) / responseTimes.length 
      : 0

    const errorRate = (errors / checks.length) * 100

    return {
      avgResponseTime,
      slowQueries: responseTimes.filter(t => t > 1000).length,
      errorRate
    }
  }

  // Business Metrics (Mock implementation - replace with real data sources)
  private async getBusinessMetrics(): Promise<MonitoringMetrics['business']> {
    try {
      // In production, these would be real database queries
      const today = new Date().toISOString().split('T')[0]
      
      return {
        activeUsers: Math.floor(Math.random() * 100) + 50,
        leadsToday: Math.floor(Math.random() * 20) + 5,
        conversionsToday: Math.floor(Math.random() * 5) + 1,
        revenueToday: Math.floor(Math.random() * 10000) + 1000
      }
    } catch (error) {
      console.warn('Failed to fetch business metrics:', error)
      return {
        activeUsers: 0,
        leadsToday: 0,
        conversionsToday: 0,
        revenueToday: 0
      }
    }
  }

  // Main monitoring check
  private async runHealthCheck(): Promise<MonitoringMetrics> {
    console.log(`🔍 Running health check at ${new Date().toISOString()}`)

    const [
      database,
      api,
      ghl,
      stripe,
      email,
      performance,
      business
    ] = await Promise.all([
      this.checkDatabase(),
      this.checkAPI(),
      this.checkGHLIntegration(),
      this.checkStripeIntegration(),
      this.checkEmailService(),
      this.checkPerformance(),
      this.getBusinessMetrics()
    ])

    const services = { database, api, ghl, stripe, email }
    const errors: string[] = []
    const warnings: string[] = []

    // Analyze service statuses
    Object.entries(services).forEach(([serviceName, status]) => {
      if (status.status === 'down') {
        errors.push(`${serviceName}: ${status.error}`)
        this.addAlert('critical', serviceName, status.error || 'Service is down')
      } else if (status.status === 'degraded') {
        warnings.push(`${serviceName}: ${status.error}`)
        this.addAlert('warning', serviceName, status.error || 'Service is degraded')
      }

      // Check response times
      if (status.responseTime > 5000) {
        warnings.push(`${serviceName}: Slow response time (${status.responseTime.toFixed(2)}ms)`)
        this.addAlert('warning', serviceName, `Slow response time: ${status.responseTime.toFixed(2)}ms`)
      }
    })

    // Check performance metrics
    if (performance.errorRate > 10) {
      errors.push(`High error rate: ${performance.errorRate.toFixed(2)}%`)
      this.addAlert('critical', 'performance', `High error rate: ${performance.errorRate.toFixed(2)}%`)
    } else if (performance.errorRate > 5) {
      warnings.push(`Elevated error rate: ${performance.errorRate.toFixed(2)}%`)
      this.addAlert('warning', 'performance', `Elevated error rate: ${performance.errorRate.toFixed(2)}%`)
    }

    if (performance.avgResponseTime > 3000) {
      warnings.push(`Slow average response time: ${performance.avgResponseTime.toFixed(2)}ms`)
      this.addAlert('warning', 'performance', `Slow average response time: ${performance.avgResponseTime.toFixed(2)}ms`)
    }

    // Calculate overall health score
    const upServices = Object.values(services).filter(s => s.status === 'up').length
    const totalServices = Object.keys(services).length
    const healthScore = Math.round((upServices / totalServices) * 100)

    const metrics: MonitoringMetrics = {
      timestamp: new Date().toISOString(),
      uptime: errors.length === 0,
      responseTime: api.responseTime,
      healthScore,
      errors,
      warnings,
      services,
      performance,
      business
    }

    this.metrics.push(metrics)

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100)
    }

    return metrics
  }

  // Display current status
  private displayStatus(metrics: MonitoringMetrics): void {
    console.clear()
    console.log('🏥 HODOS 360 Production Monitoring Dashboard')
    console.log('=' .repeat(60))
    console.log(`Last Update: ${new Date(metrics.timestamp).toLocaleString()}`)
    console.log(`Health Score: ${metrics.healthScore}% ${metrics.uptime ? '✅' : '❌'}`)
    console.log(`Response Time: ${metrics.responseTime.toFixed(2)}ms`)
    console.log()

    // Services Status
    console.log('📊 SERVICES STATUS')
    console.log('-'.repeat(40))
    Object.entries(metrics.services).forEach(([name, status]) => {
      const emoji = status.status === 'up' ? '✅' : status.status === 'degraded' ? '⚠️' : '❌'
      const responseTime = status.responseTime.toFixed(2)
      console.log(`${emoji} ${name.toUpperCase().padEnd(12)} | ${status.status.padEnd(8)} | ${responseTime}ms`)
    })
    console.log()

    // Performance Metrics
    console.log('⚡ PERFORMANCE METRICS')
    console.log('-'.repeat(40))
    console.log(`Avg Response Time: ${metrics.performance.avgResponseTime.toFixed(2)}ms`)
    console.log(`Error Rate: ${metrics.performance.errorRate.toFixed(2)}%`)
    console.log(`Slow Queries: ${metrics.performance.slowQueries}`)
    console.log()

    // Business Metrics
    console.log('💼 BUSINESS METRICS')
    console.log('-'.repeat(40))
    console.log(`Active Users: ${metrics.business.activeUsers}`)
    console.log(`Leads Today: ${metrics.business.leadsToday}`)
    console.log(`Conversions Today: ${metrics.business.conversionsToday}`)
    console.log(`Revenue Today: $${metrics.business.revenueToday.toLocaleString()}`)
    console.log()

    // Recent Alerts
    if (this.alerts.length > 0) {
      console.log('🚨 RECENT ALERTS (Last 5)')
      console.log('-'.repeat(40))
      this.alerts.slice(-5).forEach(alert => {
        const emoji = alert.level === 'critical' ? '🚨' : alert.level === 'warning' ? '⚠️' : 'ℹ️'
        const time = new Date(alert.timestamp).toLocaleTimeString()
        console.log(`${emoji} [${time}] ${alert.service}: ${alert.message}`)
      })
      console.log()
    }

    // Current Issues
    if (metrics.errors.length > 0) {
      console.log('❌ CRITICAL ISSUES')
      console.log('-'.repeat(40))
      metrics.errors.forEach(error => console.log(`  • ${error}`))
      console.log()
    }

    if (metrics.warnings.length > 0) {
      console.log('⚠️  WARNINGS')
      console.log('-'.repeat(40))
      metrics.warnings.forEach(warning => console.log(`  • ${warning}`))
      console.log()
    }

    console.log(`Next check in 60 seconds... (Ctrl+C to stop)`)
  }

  // Save monitoring report
  private async saveReport(): Promise<void> {
    const report = {
      generatedAt: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        totalChecks: this.metrics.length,
        avgHealthScore: this.metrics.length > 0 
          ? this.metrics.reduce((sum, m) => sum + m.healthScore, 0) / this.metrics.length 
          : 0,
        totalAlerts: this.alerts.length,
        criticalAlerts: this.alerts.filter(a => a.level === 'critical').length,
        uptime: this.metrics.filter(m => m.uptime).length / this.metrics.length * 100
      },
      recentMetrics: this.metrics.slice(-10),
      recentAlerts: this.alerts.slice(-20)
    }

    const fs = await import('fs')
    const reportPath = `./monitoring-reports/monitoring-report-${Date.now()}.json`
    await fs.promises.mkdir('./monitoring-reports', { recursive: true })
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
    
    console.log(`📋 Monitoring report saved: ${reportPath}`)
  }

  // Start monitoring
  public async start(intervalMinutes = 1): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Monitor is already running')
      return
    }

    this.isRunning = true
    console.log(`🚀 Starting production monitoring for ${this.baseUrl}`)
    console.log(`📊 Check interval: ${intervalMinutes} minute(s)`)
    console.log()

    // Initial check
    const initialMetrics = await this.runHealthCheck()
    this.displayStatus(initialMetrics)

    // Set up interval
    this.intervalId = setInterval(async () => {
      if (this.isRunning) {
        const metrics = await this.runHealthCheck()
        this.displayStatus(metrics)

        // Save report every 10 checks
        if (this.metrics.length % 10 === 0) {
          await this.saveReport()
        }
      }
    }, intervalMinutes * 60 * 1000)

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Stopping monitor...')
      await this.stop()
      process.exit(0)
    })

    process.on('SIGTERM', async () => {
      await this.stop()
      process.exit(0)
    })
  }

  // Stop monitoring
  public async stop(): Promise<void> {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }

    // Save final report
    if (this.metrics.length > 0) {
      await this.saveReport()
      console.log('✅ Final monitoring report saved')
    }
  }

  // Get current metrics
  public getCurrentMetrics(): MonitoringMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  // Get recent alerts
  public getRecentAlerts(count = 10): Alert[] {
    return this.alerts.slice(-count)
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const baseUrl = args[0] || 'http://localhost:3000'
  const apiKey = args[1] || process.env.PRODUCTION_API_KEY
  const interval = parseInt(args[2]) || 1

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
HODOS 360 Production Monitoring System

Usage: tsx scripts/monitor-production.ts [BASE_URL] [API_KEY] [INTERVAL_MINUTES]

Arguments:
  BASE_URL          Base URL to monitor (default: http://localhost:3000)
  API_KEY           Optional API key for authenticated endpoints  
  INTERVAL_MINUTES  Check interval in minutes (default: 1)

Environment Variables:
  PRODUCTION_API_KEY    API key for production monitoring

Examples:
  tsx scripts/monitor-production.ts
  tsx scripts/monitor-production.ts https://hodos360.com
  tsx scripts/monitor-production.ts https://hodos360.com your-api-key 5
`)
    process.exit(0)
  }

  const monitor = new ProductionMonitor(baseUrl, apiKey)
  await monitor.start(interval)
}

if (require.main === module) {
  main().catch(console.error)
}

export { ProductionMonitor }