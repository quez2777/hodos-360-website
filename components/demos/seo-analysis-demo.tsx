'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, TrendingUp, AlertCircle, CheckCircle, BarChart3, Globe, Zap, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface SEOMetric {
  name: string
  score: number
  status: 'good' | 'warning' | 'error'
  description: string
  icon: React.ReactNode
}

interface AnalysisResult {
  url: string
  overallScore: number
  metrics: SEOMetric[]
  keywords: string[]
  recommendations: string[]
  competitorScore: number
}

const DEMO_RESULTS: Record<string, AnalysisResult> = {
  default: {
    url: 'example-law-firm.com',
    overallScore: 65,
    metrics: [
      {
        name: 'Page Speed',
        score: 45,
        status: 'warning',
        description: 'Page load time: 4.2s (should be under 3s)',
        icon: <Zap className="h-4 w-4" />
      },
      {
        name: 'Mobile Optimization',
        score: 72,
        status: 'warning',
        description: 'Some elements not mobile-friendly',
        icon: <Globe className="h-4 w-4" />
      },
      {
        name: 'Content Quality',
        score: 58,
        status: 'warning',
        description: 'Content could be more comprehensive',
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        name: 'Technical SEO',
        score: 81,
        status: 'good',
        description: 'Good meta tags and structure',
        icon: <Target className="h-4 w-4" />
      }
    ],
    keywords: ['personal injury lawyer', 'car accident attorney', 'legal services', 'law firm near me'],
    recommendations: [
      'Optimize images to improve page speed',
      'Add more long-tail keywords for local SEO',
      'Create more comprehensive practice area pages',
      'Implement schema markup for better visibility'
    ],
    competitorScore: 78
  },
  optimized: {
    url: 'example-law-firm.com',
    overallScore: 92,
    metrics: [
      {
        name: 'Page Speed',
        score: 94,
        status: 'good',
        description: 'Page load time: 1.8s - Excellent!',
        icon: <Zap className="h-4 w-4" />
      },
      {
        name: 'Mobile Optimization',
        score: 98,
        status: 'good',
        description: 'Fully responsive and mobile-optimized',
        icon: <Globe className="h-4 w-4" />
      },
      {
        name: 'Content Quality',
        score: 89,
        status: 'good',
        description: 'Rich, comprehensive content',
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        name: 'Technical SEO',
        score: 95,
        status: 'good',
        description: 'Perfect technical implementation',
        icon: <Target className="h-4 w-4" />
      }
    ],
    keywords: ['personal injury lawyer', 'car accident attorney', 'legal services', 'law firm near me'],
    recommendations: [
      'Continue monitoring Core Web Vitals',
      'Expand content for emerging legal topics',
      'Build more high-quality backlinks',
      'Maintain consistent content publishing schedule'
    ],
    competitorScore: 78
  }
}

export function SEOAnalysisDemo() {
  const [url, setUrl] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null)
  const [progress, setProgress] = useState(0)
  const [showOptimized, setShowOptimized] = useState(false)

  const analyzeURL = async () => {
    if (!url.trim()) return

    setIsAnalyzing(true)
    setShowResults(false)
    setProgress(0)
    setShowOptimized(false)

    // Simulate analysis progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    // Show results after animation
    setTimeout(() => {
      setIsAnalyzing(false)
      setShowResults(true)
      setCurrentResult(DEMO_RESULTS.default)
    }, 2500)
  }

  const showOptimizedVersion = () => {
    setShowOptimized(true)
    setCurrentResult(DEMO_RESULTS.optimized)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-400 bg-green-500/20'
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20'
      case 'error':
        return 'text-red-400 bg-red-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500'
    if (score >= 60) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-pink-500'
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-white/10">
              <Search className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">SEO Analysis Tool</h3>
              <p className="text-sm text-gray-300">AI-powered SEO optimization for law firms</p>
            </div>
          </div>

          {/* URL Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              analyzeURL()
            }}
            className="flex gap-2"
          >
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter your law firm's website URL..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              disabled={isAnalyzing}
            />
            <Button
              type="submit"
              disabled={!url.trim() || isAnalyzing}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </Button>
          </form>
        </div>

        {/* Analysis Progress */}
        <AnimatePresence mode="wait">
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-6 space-y-4"
            >
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Analyzing website performance...</span>
                  <span className="text-gray-300">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {['Checking page speed', 'Analyzing content', 'Reviewing technical SEO', 'Comparing with competitors'].map((task, index) => (
                  <motion.div
                    key={task}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.3 }}
                    className="flex items-center gap-2 text-sm text-gray-300"
                  >
                    {progress > (index + 1) * 25 ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-600 animate-pulse" />
                    )}
                    {task}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          {showResults && currentResult && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 space-y-6"
            >
              {/* Overall Score */}
              <div className="text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="relative inline-flex items-center justify-center"
                >
                  <div className={cn(
                    'w-32 h-32 rounded-full bg-gradient-to-br p-1',
                    getScoreColor(currentResult.overallScore)
                  )}>
                    <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center">
                      <div>
                        <div className="text-4xl font-bold text-white">{currentResult.overallScore}</div>
                        <div className="text-sm text-gray-400">SEO Score</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                
                {!showOptimized && (
                  <div className="space-y-2">
                    <p className="text-gray-300">Your competitors average: {currentResult.competitorScore}/100</p>
                    <Button
                      onClick={showOptimizedVersion}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      See Optimized Version <TrendingUp className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                {currentResult.metrics.map((metric, index) => (
                  <motion.div
                    key={metric.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 rounded-lg p-4 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1.5 rounded', getStatusColor(metric.status))}>
                          {metric.icon}
                        </div>
                        <h4 className="text-sm font-medium text-white">{metric.name}</h4>
                      </div>
                      <span className={cn('text-2xl font-bold', 
                        metric.score >= 80 ? 'text-green-400' : 
                        metric.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                      )}>
                        {metric.score}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">{metric.description}</p>
                  </motion.div>
                ))}
              </div>

              {/* Keywords */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">Target Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {currentResult.keywords.map((keyword, index) => (
                    <motion.span
                      key={keyword}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    >
                      {keyword}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-300">
                  {showOptimized ? 'Next Steps' : 'Recommendations'}
                </h4>
                <div className="space-y-2">
                  {currentResult.recommendations.map((rec, index) => (
                    <motion.div
                      key={rec}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{rec}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>
    </div>
  )
}