"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { STATS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import CountUp from "react-countup"
import { useInView } from "react-intersection-observer"

const StatsSection = React.memo(function StatsSection() {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  })

  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-ai-mesh opacity-5" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Proven Results That Speak for Themselves
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of law firms already transforming their practice with AI
          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center p-6 rounded-2xl bg-card shadow-lg border mb-4">
                <div>
                  <div className="text-5xl font-bold text-primary mb-2">
                    {inView && (
                      <CountUp
                        start={0}
                        end={parseInt(stat.value.replace(/\D/g, '')) || 0}
                        duration={2.5}
                        separator=","
                        suffix={stat.suffix}
                      />
                    )}
                  </div>
                  <p className="text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ROI Calculator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-lg text-muted-foreground mb-4">
            Curious about your potential ROI?
          </p>
          <Link href="/roi-calculator">
            <Button size="lg" variant="outline">
              Calculate Your ROI
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
})

StatsSection.displayName = 'StatsSection'

export { StatsSection }