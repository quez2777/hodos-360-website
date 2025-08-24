"use client"

import React, { useMemo, useEffect, useState } from "react"
import { motion, LazyMotion, domAnimation, m } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CTA, COMPANY } from "@/lib/constants"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import dynamic from "next/dynamic"

// Lazy load TypeAnimation for better performance
const TypeAnimation = dynamic(
  () => import("react-type-animation").then(mod => mod.TypeAnimation),
  { 
    ssr: false,
    loading: () => <span>AI Solutions</span>
  }
)

const HeroSection = React.memo(function HeroSection() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <LazyMotion features={domAnimation}>
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background with animated gradient matching logo */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-background to-primary-600/20" />
        
        {/* Animated mesh background */}
        <div className="absolute inset-0 bg-ai-mesh opacity-20 dark:opacity-10" />
        
        {/* Circular gradient orbs - matching logo's circular motif */}
        <div className="absolute top-20 right-20 h-96 w-96 rounded-full bg-gradient-to-br from-primary-900/20 to-primary-600/20 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 left-20 h-96 w-96 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/20 blur-3xl animate-pulse-slow animation-delay-2000" />
        
        {/* Floating particles effect - optimized with CSS animations */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="particle absolute h-2 w-2 rounded-full bg-primary/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${20 + i * 5}s`
              }}
            />
          ))}
        </div>

        <div className="container relative z-10 mx-auto px-4 py-32">
          <div className="mx-auto max-w-5xl text-center">
            {/* AI Badge */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4" />
              <span>Powered by Advanced AI</span>
            </m.div>

            {/* Main Heading with gradient text matching logo */}
            <m.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-8 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
            >
              <span className="block">Transform Your Law Firm</span>
              <span className="block mt-2">
                with{" "}
                <span className="bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">
                  {mounted && (
                    <TypeAnimation
                      sequence={[
                        "AI Executives",
                        2000,
                        "AI Marketing",
                        2000,
                        "AI Agents",
                        2000,
                      ]}
                      wrapper="span"
                      repeat={Infinity}
                    />
                  )}
                </span>
              </span>
            </m.h1>

            {/* Subheading */}
            <m.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-xl text-muted-foreground sm:text-2xl max-w-3xl mx-auto"
            >
              {COMPANY.description}
            </m.p>

            {/* CTA Buttons */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6"
            >
              <Link href="/demo">
                <Button size="xl" variant="gradient" className="group">
                  {CTA.primary}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/demo-video">
                <Button size="xl" variant="outline" className="group">
                  <Play className="mr-2 h-5 w-5" />
                  {CTA.watch}
                </Button>
              </Link>
            </m.div>

            {/* Trust Indicators */}
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <p className="text-sm text-muted-foreground">
                Trusted by 500+ law firms nationwide
              </p>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">98%</p>
                  <p className="text-sm text-muted-foreground">Client Satisfaction</p>
                </div>
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-primary-600/50 to-transparent" />
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">312%</p>
                  <p className="text-sm text-muted-foreground">Average ROI</p>
                </div>
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-primary-600/50 to-transparent" />
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-text text-transparent">24/7</p>
                  <p className="text-sm text-muted-foreground">AI Support</p>
                </div>
              </div>
            </m.div>
          </div>
        </div>

        {/* Scroll indicator */}
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <m.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex flex-col items-center gap-2 text-muted-foreground"
          >
            <span className="text-sm">Scroll to explore</span>
            <div className="h-6 w-0.5 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />
          </m.div>
        </m.div>
      </section>
    </LazyMotion>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection }