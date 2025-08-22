"use client"

import { motion } from "framer-motion"
import { MessageSquare } from "lucide-react"

export function ContactHero() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm mb-6">
            <MessageSquare className="h-4 w-4" />
            <span>Get in Touch</span>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
            Let's Transform Your Law Firm Together
          </h1>
          
          <p className="text-xl text-muted-foreground">
            Whether you're ready to get started or just have questions, 
            our team is here to help you harness the power of AI for your practice.
          </p>
        </motion.div>
      </div>
    </section>
  )
}