"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, DollarSign, Clock, Users, TrendingUp } from "lucide-react"
import { Product } from "@/types"
import CountUp from "react-countup"
import { useInView } from "react-intersection-observer"

const benefitIcons = {
  cost: DollarSign,
  time: Clock,
  satisfaction: Users,
  growth: TrendingUp,
}

interface ProductBenefitsProps {
  product: Product
}

export function ProductBenefits({ product }: ProductBenefitsProps) {
  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: true,
  })
  
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Real Results for Real Firms
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of law firms already experiencing these benefits
          </p>
        </motion.div>

        <div ref={ref} className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-16">
          {product.benefits.map((benefit, index) => {
            const stats = getBenefitStats(benefit)
            const Icon = benefitIcons[stats.icon as keyof typeof benefitIcons]
            
            return (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-flex p-4 rounded-full bg-primary/10 mb-4">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="text-4xl font-bold text-primary mb-2">
                  {inView && stats.value && (
                    <CountUp
                      start={0}
                      end={stats.value}
                      duration={2.5}
                      suffix={stats.suffix}
                      prefix={stats.prefix}
                    />
                  )}
                </div>
                <p className="text-muted-foreground">{benefit}</p>
              </motion.div>
            )
          })}
        </div>

        {/* ROI Calculator CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 rounded-2xl p-8 text-center"
        >
          <h3 className="text-2xl font-bold mb-4">
            Calculate Your ROI
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            See exactly how much {product.name} can save your firm in time and money
          </p>
          <Link href="/roi-calculator">
            <Button size="lg" variant="ai">
              Calculate ROI
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function getBenefitStats(benefit: string): { value?: number; prefix?: string; suffix?: string; icon: string } {
  if (benefit.includes("60%")) return { value: 60, suffix: "%", icon: "cost" }
  if (benefit.includes("50%")) return { value: 50, suffix: "%", icon: "cost" }
  if (benefit.includes("3x")) return { value: 3, suffix: "x", icon: "growth" }
  if (benefit.includes("24/7")) return { value: 24, suffix: "/7", icon: "time" }
  if (benefit.includes("98")) return { value: 98, suffix: "%", icon: "satisfaction" }
  return { icon: "growth" }
}