"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Eye, Zap } from "lucide-react"

const sections = [
  {
    icon: Target,
    title: "Our Mission",
    content: "To empower law firms with AI-driven solutions that enhance efficiency, improve client experiences, and drive unprecedented growth. We believe every firm, regardless of size, deserves access to enterprise-grade AI technology.",
  },
  {
    icon: Eye,
    title: "Our Vision",
    content: "A legal industry where AI amplifies human expertise, not replaces it. Where lawyers can focus on what they do best—practicing law—while AI handles the rest. Where justice is more accessible through technology.",
  },
  {
    icon: Zap,
    title: "Our Approach",
    content: "We combine cutting-edge AI technology with deep legal industry expertise. Every solution is designed by lawyers, for lawyers, ensuring practical applications that deliver real results from day one.",
  },
]

export function AboutMission() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          {sections.map((section, index) => {
            const Icon = section.icon
            
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="inline-flex p-3 rounded-lg bg-primary/10 mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
                    <p className="text-muted-foreground">{section.content}</p>
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