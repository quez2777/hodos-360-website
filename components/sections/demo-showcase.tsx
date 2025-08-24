'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { MessageSquare, Search, Video, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { 
  AIChatDemoWithLoader, 
  SEOAnalysisDemoWithLoader, 
  VideoAgentDemoWithLoader 
} from '@/components/lazy/lazy-demos'
import { PerformanceMonitor } from '@/components/utils/performance-monitor'

interface DemoTab {
  id: string
  label: string
  icon: React.ReactNode
  description: string
  product: string
  productHref: string
  color: string
}

const demoTabs: DemoTab[] = [
  {
    id: 'ai-chat',
    label: 'AI Assistant',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Experience our advanced legal AI that handles research, drafting, and client interactions',
    product: 'HODOS',
    productHref: '/products/hodos',
    color: 'blue'
  },
  {
    id: 'seo-analysis',
    label: 'SEO Analysis',
    icon: <Search className="h-4 w-4" />,
    description: 'See how AI optimizes your law firm\'s online presence and generates more leads',
    product: 'HODOS Marketing',
    productHref: '/products/marketing',
    color: 'green'
  },
  {
    id: 'video-agent',
    label: 'Video Agent',
    icon: <Video className="h-4 w-4" />,
    description: 'Watch AI agents handle client calls with human-like conversation and empathy',
    product: 'HODOS VIDEO',
    productHref: '/products/video',
    color: 'purple'
  }
]

// Component to handle lazy loading on visibility
const LazyDemoContainer = ({ 
  children, 
  demoId 
}: { 
  children: React.ReactNode
  demoId: string 
}) => {
  const [shouldLoad, setShouldLoad] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true)
          }
        })
      },
      {
        rootMargin: '100px', // Start loading 100px before visible
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
  }, [shouldLoad])

  return (
    <div ref={containerRef} className="min-h-[600px]">
      {shouldLoad ? (
        <>
          <PerformanceMonitor componentName={`Demo-${demoId}`} />
          {children}
        </>
      ) : (
        <div className="flex items-center justify-center h-[600px]">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground">Scroll to load {demoId} demo</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function DemoShowcase() {
  const [activeTab, setActiveTab] = useState('ai-chat')
  const activeDemo = demoTabs.find(tab => tab.id === activeTab)

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            See Our AI in Action
          </h2>
          <p className="text-xl text-muted-foreground">
            Experience the power of HODOS AI through interactive demonstrations
          </p>
        </motion.div>

        {/* Demo Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 w-full max-w-2xl mx-auto h-auto p-2">
            {demoTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className={cn(
                  "flex flex-col items-center gap-2 py-4 px-2 data-[state=active]:bg-primary/10",
                  "transition-all duration-300"
                )}
              >
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  activeTab === tab.id 
                    ? `bg-${tab.color}-500/20 text-${tab.color}-400` 
                    : "bg-muted text-muted-foreground"
                )}>
                  {tab.icon}
                </div>
                <span className="text-sm font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Demo Description */}
          <AnimatePresence mode="wait">
            {activeDemo && (
              <motion.div
                key={activeDemo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-center max-w-2xl mx-auto space-y-4"
              >
                <p className="text-lg text-muted-foreground">
                  {activeDemo.description}
                </p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    Powered by {activeDemo.product}
                  </span>
                  <Link href={activeDemo.productHref}>
                    <Button variant="ghost" size="sm" className="group">
                      Learn More
                      <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo Content with Lazy Loading */}
          <div className="mt-12">
            <TabsContent value="ai-chat" className="mt-0">
              <LazyDemoContainer demoId="AI Chat">
                <AIChatDemoWithLoader />
              </LazyDemoContainer>
            </TabsContent>

            <TabsContent value="seo-analysis" className="mt-0">
              <LazyDemoContainer demoId="SEO Analysis">
                <SEOAnalysisDemoWithLoader />
              </LazyDemoContainer>
            </TabsContent>

            <TabsContent value="video-agent" className="mt-0">
              <LazyDemoContainer demoId="Video Agent">
                <VideoAgentDemoWithLoader />
              </LazyDemoContainer>
            </TabsContent>
          </div>
        </Tabs>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-lg text-muted-foreground mb-6">
            Ready to transform your law firm with AI?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" variant="ai">
                Schedule a Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/products">
              <Button size="lg" variant="outline">
                Explore All Products
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
      </div>
    </section>
  )
}