"use client"

import React from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PRODUCTS } from "@/lib/constants"
import { ArrowRight, Building, TrendingUp, Video, Check } from "lucide-react"
import Tilt from "react-parallax-tilt"

const productIcons = {
  Building,
  TrendingUp,
  Video,
}

const ProductsSection = React.memo(function ProductsSection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Complete AI Solutions for Modern Law Firms
          </h2>
          <p className="text-xl text-muted-foreground">
            Three powerful platforms working together to transform every aspect of your practice
          </p>
        </motion.div>

        {/* Products Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {Object.values(PRODUCTS).map((product, index) => {
            const Icon = productIcons[product.icon as keyof typeof productIcons]
            
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Tilt
                  tiltMaxAngleX={5}
                  tiltMaxAngleY={5}
                  perspective={1000}
                  scale={1.02}
                  transitionSpeed={2000}
                >
                  <Card variant="lapisGlow" className="h-full group transition-all duration-300">
                    
                    <CardHeader className="relative">
                      <div className={`inline-flex p-3 rounded-lg bg-${product.color}/10 mb-4`}>
                        <Icon className={`h-6 w-6 text-${product.color}`} />
                      </div>
                      <CardTitle className="text-2xl">{product.name}</CardTitle>
                      <CardDescription className="text-base">
                        {product.tagline}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="relative space-y-4">
                      <p className="text-muted-foreground">
                        {product.description}
                      </p>
                      
                      {/* Feature List */}
                      <ul className="space-y-2">
                        {product.features.slice(0, 4).map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* CTA */}
                      <div className="pt-4">
                        <Link href={product.href}>
                          <Button variant="outline" className="group/btn w-full">
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </Tilt>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link href="/products">
            <Button size="lg" variant="ai">
              Explore All Features
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
})

ProductsSection.displayName = 'ProductsSection'

export { ProductsSection }