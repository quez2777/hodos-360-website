"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { CTA, COMPANY } from "@/lib/constants"
import { ArrowRight, Play, Sparkles } from "lucide-react"
import dynamic from "next/dynamic"

// Lazy load TypeAnimation for better performance
const TypeAnimation = dynamic(
  () => import("react-type-animation").then(mod => mod.TypeAnimation),
  { 
    ssr: false,
    loading: () => <span>Legal Intelligence</span>
  }
)

const HeroSection = React.memo(function HeroSection() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0F1C]">
      {/* Full Screen Logo Background - Absolute positioning */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="relative w-[120%] h-[120%]"
        >
          <Image
            src="/images/hodos-main-logo.jpg"
            alt="HODOS Background"
            fill
            className="object-contain"
            quality={100}
            priority
          />
        </motion.div>
      </div>
      
      {/* Multiple Gradient Overlays for Perfect Blending */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1C] via-transparent to-[#0A0F1C]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0A0F1C]/80 via-transparent to-[#0A0F1C]/80" />
      
      {/* Radial gradient from center */}
      <div className="absolute inset-0" 
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(10, 15, 28, 0.4) 40%, rgba(10, 15, 28, 0.9) 100%)'
        }} 
      />
      
      {/* Animated Gold Particles */}
      <div className="absolute inset-0">
        {mounted && [...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#FFD700] rounded-full opacity-60"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              opacity: 0
            }}
            animate={{ 
              y: [null, -100],
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: 10 + Math.random() * 10,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "linear"
            }}
          />
        ))}
      </div>
      
      {/* Animated Gold and blue luxury accents */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-[#FFD700]/10 to-transparent blur-3xl" 
      />
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.3, 0.2]
        }}
        transition={{ duration: 10, repeat: Infinity }}
        className="absolute bottom-0 left-0 h-[800px] w-[800px] rounded-full bg-gradient-to-br from-[#1756DB]/20 to-transparent blur-3xl" 
      />

      <div className="container relative z-10 mx-auto px-4 py-32">
        <div className="mx-auto max-w-5xl text-center">
          {/* Small Centered Logo with Glow */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-12 flex justify-center relative z-10"
          >
            <div className="relative">
              <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-[#FFD700]/40 to-[#1756DB]/40 rounded-full animate-pulse" />
              <Image
                src="/images/hodos-main-logo.jpg"
                alt="HODOS - Artificial Intelligence"
                width={180}
                height={180}
                className="w-40 h-40 object-contain relative z-10 drop-shadow-[0_0_80px_rgba(255,215,0,0.6)]"
                priority
                quality={100}
              />
            </div>
          </motion.div>

          {/* Coming Soon Badge - Gold luxury style with backdrop blur */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-3 px-8 py-3 text-xs font-light tracking-[0.3em] text-[#FFD700] uppercase border-t border-b border-[#FFD700]/30 mb-8 shadow-[0_0_40px_rgba(255,215,0,0.4)] backdrop-blur-md bg-[#0A0F1C]/60"
          >
            <Sparkles className="h-4 w-4 text-[#FFD700]" />
            <span>LAUNCHING JANUARY 2026</span>
            <Sparkles className="h-4 w-4 text-[#FFD700]" />
          </motion.div>

          {/* Luxury tagline with backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <p className="text-xs font-light tracking-[0.25em] text-[#FFD700]/90 uppercase backdrop-blur-sm bg-[#0A0F1C]/30 inline-block px-6 py-2 rounded-full">
              Enterprise AI Platform • Advanced Automation • Seamless Integration
            </p>
          </motion.div>

          {/* Main Heading - Dark luxury typography */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-5xl font-light tracking-tight sm:text-6xl md:text-7xl text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <span className="block font-extralight tracking-wide">The Quantum Revolution</span>
            <span className="block mt-2">
              in{" "}
              <span className="font-normal bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">
                {mounted && (
                  <TypeAnimation
                    sequence={[
                      "Legal Intelligence",
                      2000,
                      "AI-Powered Legal Tech",
                      2000,
                      "Next-Gen Law Practice",
                      2000,
                    ]}
                    wrapper="span"
                    repeat={Infinity}
                  />
                )}
              </span>
            </span>
          </motion.h1>

          {/* Subheading - Dark luxury style */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 text-lg text-white/90 sm:text-xl max-w-2xl mx-auto font-light leading-relaxed backdrop-blur-sm bg-[#0A0F1C]/20 px-6 py-3 rounded-lg"
          >
            {COMPANY.description}
          </motion.p>

          {/* CTA Buttons - Luxury design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6"
          >
            <Link href="/demo">
              <Button size="lg" className="group bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] text-[#0A0F1C] px-10 py-6 text-sm tracking-widest uppercase font-semibold transition-all duration-500 shadow-[0_0_50px_rgba(255,215,0,0.5)] hover:shadow-[0_0_70px_rgba(255,215,0,0.7)]">
                Join Early Access
                <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/demo-video">
              <Button size="lg" variant="outline" className="group border-[#1756DB] hover:border-[#FFD700] text-white hover:text-[#FFD700] px-10 py-6 text-sm tracking-widest uppercase font-light transition-all duration-500 hover:shadow-[0_0_30px_rgba(23,86,219,0.3)] backdrop-blur-sm bg-[#0A0F1C]/40">
                <Play className="mr-3 h-4 w-4" />
                Watch Preview
              </Button>
            </Link>
          </motion.div>

          {/* Trust Indicators - Dark luxury minimal with glass effect */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 flex flex-col items-center gap-4 backdrop-blur-md bg-[#0A0F1C]/40 px-8 py-6 rounded-2xl"
          >
            <p className="text-xs font-light tracking-[0.3em] text-[#FFD700]/80 uppercase">
              Transform Your Practice with Cutting-Edge AI Technology
            </p>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-4xl font-extralight text-[#FFD700]">10x</p>
                <p className="text-xs tracking-wider text-white/70 uppercase mt-1">Productivity Boost</p>
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-[#FFD700]/30 to-transparent" />
              <div className="text-center">
                <p className="text-4xl font-extralight text-[#FFD700]">24/7</p>
                <p className="text-xs tracking-wider text-white/70 uppercase mt-1">AI Availability</p>
              </div>
              <div className="h-12 w-px bg-gradient-to-b from-transparent via-[#FFD700]/30 to-transparent" />
              <div className="text-center">
                <p className="text-4xl font-extralight text-[#FFD700]">99.9%</p>
                <p className="text-xs tracking-wider text-white/70 uppercase mt-1">Accuracy Rate</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator - Dark luxury minimal */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex flex-col items-center gap-2 text-[#FFD700]/60"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="h-6 w-0.5 bg-gradient-to-b from-transparent via-[#FFD700]/40 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  )
})

HeroSection.displayName = 'HeroSection'

export { HeroSection }// Force update
