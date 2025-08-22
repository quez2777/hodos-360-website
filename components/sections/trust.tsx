"use client"

import React from "react"
import { motion } from "framer-motion"
import Image from "next/image"

const trustedBy = [
  { name: "AmLaw 100", logo: "/images/trust/amlaw100.svg" },
  { name: "BigLaw Partners", logo: "/images/trust/biglaw.svg" },
  { name: "State Bar Association", logo: "/images/trust/statebar.svg" },
  { name: "Legal Tech Awards", logo: "/images/trust/legaltech.svg" },
  { name: "Fortune 500 Legal", logo: "/images/trust/fortune500.svg" },
  { name: "Innovation Awards", logo: "/images/trust/innovation.svg" },
]

const TrustSection = React.memo(function TrustSection() {
  return (
    <section className="py-20 border-y bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Trusted by industry leaders
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {trustedBy.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center justify-center"
              >
                <div className="text-2xl font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  {company.name}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
})

TrustSection.displayName = 'TrustSection'

export { TrustSection }