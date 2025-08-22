"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PRODUCTS } from "@/lib/constants"
import { ArrowRight, Building, TrendingUp, Video, CheckCircle2 } from "lucide-react"

const productIcons = {
  Building,
  TrendingUp,
  Video,
}

export function ProductsGrid() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="space-y-16">
          {Object.values(PRODUCTS).map((product, index) => {
            const Icon = productIcons[product.icon as keyof typeof productIcons]
            const isEven = index % 2 === 0
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className={`grid gap-12 lg:grid-cols-2 items-center ${
                  isEven ? "" : "lg:grid-flow-col-reverse"
                }`}
              >
                {/* Content */}
                <div className="space-y-6">
                  <div className={`inline-flex p-3 rounded-lg bg-${product.color}/10`}>
                    <Icon className={`h-8 w-8 text-${product.color}`} />
                  </div>
                  
                  <div>
                    <h2 className="text-4xl font-bold tracking-tight mb-4">
                      {product.name}
                    </h2>
                    <p className="text-xl text-muted-foreground mb-6">
                      {product.tagline}
                    </p>
                    <p className="text-lg mb-8">
                      {product.description}
                    </p>
                  </div>
                  
                  {/* Features */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {product.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={product.href}>
                      <Button size="lg" variant="ai">
                        Learn More
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/demo">
                      <Button size="lg" variant="outline">
                        See Demo
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Visual */}
                <div className="relative">
                  <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center">
                    <Icon className="h-32 w-32 text-primary/50" />
                  </div>
                  
                  {/* Benefits floating cards */}
                  <div className="absolute -right-4 -bottom-4 bg-card rounded-lg shadow-xl p-4 max-w-[200px]">
                    <p className="text-sm font-semibold mb-1">Key Benefit</p>
                    <p className="text-xs text-muted-foreground">
                      {product.benefits[0]}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}