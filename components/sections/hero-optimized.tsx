"use client"

import React, { useMemo, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CTA, COMPANY } from "@/lib/constants"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import { TypeAnimation } from "react-type-animation"

const HeroSectionOptimized = React.memo(function HeroSectionOptimized() {
  const shouldReduceMotion = useReducedMotion()
  const [isInViewport, setIsInViewport] = useState(false)
  
  // Only render particles when in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry.isIntersecting),
      { threshold: 0.1 }
    )
    
    const section = document.getElementById('hero-section')
    if (section) observer.observe(section)
    
    return () => {
      if (section) observer.unobserve(section)
    }
  }, [])

  // Memoize particle positions
  const particles = useMemo(() => {
    if (shouldReduceMotion || !isInViewport) return []
    
    return [...Array(8)].map((_, i) => ({
      id: i,
      initialX: Math.random() * 100,
      initialY: Math.random() * 100,
      duration: Math.random() * 10 + 20,
    }))
  }, [shouldReduceMotion, isInViewport])

  return (
    <section id="hero-section" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Background with animated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
      
      {/* Animated mesh background */}
      <div className="absolute inset-0 bg-ai-mesh opacity-20 dark:opacity-10" />
      
      {/* Floating particles effect - only render when in viewport */}
      {isInViewport && !shouldReduceMotion && (
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute h-2 w-2 rounded-full bg-primary/20"
              initial={{
                x: particle.initialX + "%",
                y: particle.initialY + "%",
              }}
              animate={{
                x: [(particle.initialX) + "%", (particle.initialX + 20) + "%", particle.initialX + "%"],
                y: [(particle.initialY) + "%", (particle.initialY - 20) + "%", particle.initialY + "%"],
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4 py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* AI Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4" />
            <span>Powered by Advanced AI</span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
          >
            <span className="block">Transform Your Law Firm</span>
            <span className="block mt-2">
              with{" "}
              <span className="gradient-text">
                {shouldReduceMotion ? (
                  "AI Solutions"
                ) : (
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
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-xl text-muted-foreground sm:text-2xl max-w-3xl mx-auto"
          >
            {COMPANY.description}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6"
          >
            <Link href="/demo">
              <Button size="xl" variant="ai" className="group">
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
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
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
                <p className="text-3xl font-bold text-primary">98%</p>
                <p className="text-sm text-muted-foreground">Client Satisfaction</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">312%</p>
                <p className="text-sm text-muted-foreground">Average ROI</p>
              </div>
              <div className="h-8 w-px bg-border" />
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">24/7</p>
                <p className="text-sm text-muted-foreground">AI Support</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={shouldReduceMotion ? {} : { y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-sm">Scroll to explore</span>
          <div className="h-6 w-0.5 bg-gradient-to-b from-transparent via-muted-foreground to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  )
})

HeroSectionOptimized.displayName = 'HeroSectionOptimized'

export { HeroSectionOptimized }