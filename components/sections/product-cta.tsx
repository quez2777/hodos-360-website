"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar, CheckCircle2 } from "lucide-react"
import { Product } from "@/types"

interface ProductCTAProps {
  product: Product
}

export function ProductCTA({ product }: ProductCTAProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
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
            Ready to Transform Your Firm with {product.name}?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join leading law firms already using AI to deliver exceptional results
          </p>
          
          {/* Benefits list */}
          <div className="grid gap-4 sm:grid-cols-3 mb-12 text-left max-w-3xl mx-auto">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">White-glove onboarding</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">14-day free trial</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">No setup fees</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Cancel anytime</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">Dedicated support</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm">ROI guarantee</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo">
              <Button size="xl" variant="secondary" className="group">
                <Calendar className="mr-2 h-5 w-5" />
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="xl" variant="outline" className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/30">
                View Pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}