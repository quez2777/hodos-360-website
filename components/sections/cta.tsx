"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CTA } from "@/lib/constants"
import { ArrowRight, Calendar, MessageSquare } from "lucide-react"

const CTASection = React.memo(function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden bg-[#0A0F1C]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/20 via-[#FFD700]/10 to-[#1756DB]/10" />
      
      {/* Pattern overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-transparent to-[#0A0F1C]/50" />
      
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
              <Button size="xl" className="group bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] text-[#0A0F1C] shadow-[0_0_40px_rgba(255,215,0,0.4)]">
                <Calendar className="mr-2 h-5 w-5" />
                {CTA.primary}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="xl" variant="outline" className="bg-[#0A0F1C]/40 backdrop-blur-sm hover:bg-[#FFD700]/10 text-white border-[#FFD700]/50 hover:border-[#FFD700]">
                <MessageSquare className="mr-2 h-5 w-5" />
                {CTA.contact}
              </Button>
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FFD700]" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FFD700]" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#FFD700]" />
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