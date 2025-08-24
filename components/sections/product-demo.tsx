'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  AIChatDemoWithLoader, 
  SEOAnalysisDemoWithLoader, 
  VideoAgentDemoWithLoader,
  ROICalculatorWithLoader,
  PerformanceDashboardWithLoader
} from '@/components/lazy/lazy-demos'

interface ProductDemoProps {
  productId: 'hodos' | 'marketing' | 'video'
  title?: string
  description?: string
}

const productDemos = {
  hodos: {
    component: AIChatDemoWithLoader,
    defaultTitle: 'Experience HODOS AI Assistant',
    defaultDescription: 'See how our AI handles complex legal tasks with human-like intelligence'
  },
  marketing: {
    component: SEOAnalysisDemoWithLoader,
    defaultTitle: 'AI-Powered SEO Analysis',
    defaultDescription: 'Watch our AI optimize your law firm\'s online presence in real-time'
  },
  video: {
    component: VideoAgentDemoWithLoader,
    defaultTitle: 'Meet Your AI Video Agents',
    defaultDescription: 'Experience human-like conversations with our advanced video AI'
  }
}

export function ProductDemo({ 
  productId, 
  title, 
  description 
}: ProductDemoProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const demoConfig = productDemos[productId]
  const DemoComponent = demoConfig.component
  const displayTitle = title || demoConfig.defaultTitle
  const displayDescription = description || demoConfig.defaultDescription

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            setIsVisible(true)
            setHasLoaded(true)
          }
        })
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [hasLoaded])

  return (
    <section className="py-24 relative overflow-hidden" ref={containerRef}>
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            {displayTitle}
          </h2>
          <p className="text-xl text-muted-foreground">
            {displayDescription}
          </p>
        </motion.div>

        {/* Demo Container */}
        <div className="min-h-[600px]">
          {isVisible ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <DemoComponent />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-[600px]"
            >
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <Button
                  size="lg"
                  variant="ai"
                  onClick={() => setIsVisible(true)}
                  className="group"
                >
                  <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                  Load Interactive Demo
                </Button>
                <p className="mt-4 text-sm text-muted-foreground">
                  Click to load the interactive demonstration
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Additional CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-lg text-muted-foreground mb-6">
            Want to see this in action with your own data?
          </p>
          <Button size="lg" variant="outline">
            Schedule a Personalized Demo
          </Button>
        </motion.div>
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
      </div>
    </section>
  )
}

// Additional showcase components for specific use cases
export function ROICalculatorSection() {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { rootMargin: '100px', threshold: 0.01 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <section className="py-24 bg-muted/5" ref={containerRef}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Calculate Your ROI
          </h2>
          <p className="text-xl text-muted-foreground">
            See how much your firm could save with HODOS AI solutions
          </p>
        </motion.div>

        {isVisible && <ROICalculatorWithLoader />}
      </div>
    </section>
  )
}

export function PerformanceDashboardSection() {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { rootMargin: '100px', threshold: 0.01 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  return (
    <section className="py-24" ref={containerRef}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Real-Time Performance Insights
          </h2>
          <p className="text-xl text-muted-foreground">
            Monitor your firm\'s performance with AI-powered analytics
          </p>
        </motion.div>

        {isVisible && <PerformanceDashboardWithLoader />}
      </div>
    </section>
  )
}