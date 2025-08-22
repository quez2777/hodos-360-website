"use client"

import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const features = [
  { name: "24/7 AI Availability", hodos: true, marketing: true, video: true },
  { name: "C-Suite AI Executives", hodos: true, marketing: false, video: false },
  { name: "SEO Optimization", hodos: false, marketing: true, video: false },
  { name: "Paid Ad Management", hodos: false, marketing: true, video: false },
  { name: "Video Reception", hodos: false, marketing: false, video: true },
  { name: "Automated Intake", hodos: true, marketing: false, video: true },
  { name: "Lead Qualification", hodos: true, marketing: true, video: true },
  { name: "Performance Analytics", hodos: true, marketing: true, video: true },
  { name: "Multi-language Support", hodos: true, marketing: false, video: true },
  { name: "CRM Integration", hodos: true, marketing: true, video: true },
]

export function ProductComparison() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Compare Our Solutions
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Each product is powerful on its own, but together they create an unstoppable force
            for your law firm's growth.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-6 font-medium">Features</th>
                    <th className="text-center p-6">
                      <div className="font-semibold text-lg">HODOS</div>
                      <div className="text-sm text-muted-foreground">AI Management</div>
                    </th>
                    <th className="text-center p-6">
                      <div className="font-semibold text-lg">Marketing</div>
                      <div className="text-sm text-muted-foreground">AI Marketing</div>
                    </th>
                    <th className="text-center p-6">
                      <div className="font-semibold text-lg">VIDEO Agents</div>
                      <div className="text-sm text-muted-foreground">AI Reception</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <tr key={feature.name} className="border-b">
                      <td className="p-6 font-medium">{feature.name}</td>
                      <td className="text-center p-6">
                        {feature.hodos ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-6">
                        {feature.marketing ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                      <td className="text-center p-6">
                        {feature.video ? (
                          <Check className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Bundle CTA */}
            <div className="p-6 bg-primary/5 text-center">
              <p className="text-lg font-semibold mb-2">
                Get all three solutions for maximum impact
              </p>
              <p className="text-muted-foreground mb-4">
                Save 20% when you bundle all products
              </p>
              <Link href="/pricing">
                <Button size="lg" variant="ai">
                  View Bundle Pricing
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}