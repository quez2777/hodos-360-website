'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, Users, DollarSign, Clock, 
  BarChart3, Activity, Zap, Target,
  ArrowUp, ArrowDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Metric {
  label: string
  value: number
  unit: string
  change: number
  icon: React.ReactNode
  color: string
  target: number
}

interface ChartData {
  label: string
  value: number
}

const generateRandomChange = (base: number, variance: number) => {
  return base + (Math.random() - 0.5) * variance
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Active Cases',
      value: 142,
      unit: '',
      change: 12,
      icon: <Users className="h-5 w-5" />,
      color: 'from-blue-500 to-cyan-500',
      target: 150
    },
    {
      label: 'Revenue This Month',
      value: 485000,
      unit: '$',
      change: 23,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-500',
      target: 500000
    },
    {
      label: 'Avg Response Time',
      value: 2.4,
      unit: 'min',
      change: -35,
      icon: <Clock className="h-5 w-5" />,
      color: 'from-purple-500 to-pink-500',
      target: 2.0
    },
    {
      label: 'Client Satisfaction',
      value: 94,
      unit: '%',
      change: 8,
      icon: <Target className="h-5 w-5" />,
      color: 'from-yellow-500 to-orange-500',
      target: 95
    }
  ])

  const [chartData, setChartData] = useState<ChartData[]>([
    { label: 'Mon', value: 65 },
    { label: 'Tue', value: 72 },
    { label: 'Wed', value: 78 },
    { label: 'Thu', value: 82 },
    { label: 'Fri', value: 88 },
    { label: 'Sat', value: 85 },
    { label: 'Sun', value: 90 }
  ])

  const [liveMetrics, setLiveMetrics] = useState({
    activeCalls: 3,
    onlineAgents: 8,
    queueTime: 45,
    casesCompleted: 12
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics with small variations
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.unit === '$' 
          ? Math.round(generateRandomChange(metric.value, metric.value * 0.01))
          : parseFloat(generateRandomChange(metric.value, metric.value * 0.02).toFixed(1))
      })))

      // Update live metrics
      setLiveMetrics(prev => ({
        activeCalls: Math.max(0, Math.round(generateRandomChange(prev.activeCalls, 2))),
        onlineAgents: Math.max(5, Math.round(generateRandomChange(prev.onlineAgents, 1))),
        queueTime: Math.max(10, Math.round(generateRandomChange(prev.queueTime, 10))),
        casesCompleted: Math.min(20, Math.round(generateRandomChange(prev.casesCompleted, 1)))
      }))

      // Update chart data
      setChartData(prev => prev.map(item => ({
        ...item,
        value: Math.max(50, Math.min(100, Math.round(generateRandomChange(item.value, 5))))
      })))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const formatValue = (value: number, unit: string) => {
    if (unit === '$') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value)
    }
    return `${value}${unit}`
  }

  const getProgressWidth = (value: number, target: number) => {
    return Math.min(100, (value / target) * 100)
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Performance Dashboard</h3>
              <p className="text-sm text-gray-300">Real-time law firm analytics</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30">
              <Activity className="h-4 w-4 text-green-400 animate-pulse" />
              <span className="text-sm text-green-300">Live</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AnimatePresence mode="sync">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-xl border border-white/20 dark:border-gray-800/20 p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  'p-2 rounded-lg bg-gradient-to-br',
                  metric.color
                )}>
                  {metric.icon}
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm',
                  metric.change > 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {metric.change > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-gray-400">{metric.label}</p>
                <div className="text-2xl font-bold text-white">
                  {formatValue(metric.value, metric.unit)}
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full bg-gradient-to-r', metric.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressWidth(metric.value, metric.target)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Target: {formatValue(metric.target, metric.unit)}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-xl border border-white/20 dark:border-gray-800/20 p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Weekly Activity
          </h4>
          
          <div className="h-48 flex items-end justify-between gap-2">
            {chartData.map((item, index) => (
              <div key={item.label} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  className="w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${item.value}%` }}
                  transition={{ 
                    duration: 1, 
                    delay: index * 0.1,
                    ease: 'easeOut'
                  }}
                />
                <span className="text-xs text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Live Stats */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-xl border border-white/20 dark:border-gray-800/20 p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-400" />
            Live Operations
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Active Calls</span>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
              <motion.div
                key={liveMetrics.activeCalls}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-white"
              >
                {liveMetrics.activeCalls}
              </motion.div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Online Agents</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
              </div>
              <motion.div
                key={liveMetrics.onlineAgents}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-white"
              >
                {liveMetrics.onlineAgents}
              </motion.div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Avg Queue Time</span>
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              </div>
              <motion.div
                key={liveMetrics.queueTime}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-white"
              >
                {liveMetrics.queueTime}s
              </motion.div>
            </div>

            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Cases Today</span>
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
              </div>
              <motion.div
                key={liveMetrics.casesCompleted}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-2xl font-bold text-white"
              >
                {liveMetrics.casesCompleted}
              </motion.div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 p-3 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Daily Goal Progress</span>
              <span className="text-sm font-medium text-white">
                {Math.round((liveMetrics.casesCompleted / 20) * 100)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${(liveMetrics.casesCompleted / 20) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>
    </div>
  )
}