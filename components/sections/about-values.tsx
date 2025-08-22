"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Shield, Rocket, Users, Brain, Heart, Globe } from "lucide-react"

const values = [
  {
    icon: Shield,
    title: "Trust & Security",
    description: "We handle sensitive legal data with bank-grade encryption and strict compliance standards. Your clients' trust is our top priority.",
  },
  {
    icon: Rocket,
    title: "Innovation First",
    description: "We're constantly pushing the boundaries of what's possible with AI, bringing cutting-edge solutions to the legal industry.",
  },
  {
    icon: Users,
    title: "Client-Centric",
    description: "Every feature we build starts with understanding your needs. We're not just vendors—we're partners in your success.",
  },
  {
    icon: Brain,
    title: "Intelligent by Design",
    description: "Our AI doesn't just automate—it learns, adapts, and improves, making your firm smarter with every interaction.",
  },
  {
    icon: Heart,
    title: "Empowering People",
    description: "Technology should enhance human capability, not replace it. We help lawyers do what they do best, better.",
  },
  {
    icon: Globe,
    title: "Accessible Innovation",
    description: "Enterprise-grade AI shouldn't be limited to big firms. We're democratizing access to legal tech innovation.",
  },
]

export function AboutValues() {
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
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">Our Values</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The principles that guide everything we do at HODOS 360
          </p>
        </motion.div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {values.map((value, index) => {
            const Icon = value.icon
            
            return (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}