"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CTA } from "@/lib/constants"
import { ArrowRight, Calendar, MessageSquare } from "lucide-react"

const CTASection = React.memo(function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-ai-mesh opacity-10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center text-white"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-6">
            Ready to Transform Your Law Firm?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join 500+ law firms already using AI to deliver exceptional client experiences
            and drive unprecedented growth.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/demo">
              <Button size="xl" variant="secondary" className="group">
                <Calendar className="mr-2 h-5 w-5" />
                {CTA.primary}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="xl" variant="outline" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/30">
                <MessageSquare className="mr-2 h-5 w-5" />
                {CTA.contact}
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span>White-glove onboarding</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
})

CTASection.displayName = 'CTASection'

export { CTASection }