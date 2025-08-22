"use client"

import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"

export function ProductsHero() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm mb-6">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Legal Solutions</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
            Transform Every Aspect of Your Practice
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Our integrated suite of AI solutions works seamlessly together to automate operations, 
            amplify marketing, and enhance client interactions—giving you the competitive edge 
            in today's legal market.
          </p>
        </motion.div>
      </div>
    </section>
  )
}