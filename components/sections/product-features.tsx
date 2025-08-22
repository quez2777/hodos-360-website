"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"
import { Product } from "@/types"

interface ProductFeaturesProps {
  product: Product
}

export function ProductFeatures({ product }: ProductFeaturesProps) {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to transform your law firm's {product.id === 'hodos' ? 'operations' : product.id === 'marketing' ? 'marketing' : 'client interactions'}
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {product.features.map((feature, index) => (
            <motion.div
              key={feature}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{feature}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {getFeatureDescription(product.id, feature)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function getFeatureDescription(productId: string, feature: string): string {
  const descriptions: Record<string, Record<string, string>> = {
    hodos: {
      "AI Chief Financial Officer (CFO)": "Automated financial management, reporting, and budget optimization powered by AI.",
      "AI Chief Marketing Officer (CMO)": "Strategic marketing leadership and campaign management without the executive salary.",
      "AI Chief AI Officer (CAIO)": "Oversee and optimize all AI implementations across your firm.",
      "AI Reception & Administration": "24/7 intelligent reception services that never miss a call or appointment.",
      "AI Operations Management": "Streamline workflows and automate routine tasks for maximum efficiency.",
      "Workflow Automation": "Custom automation solutions tailored to your firm's specific needs.",
    },
    marketing: {
      "AI-Powered SEO Optimization": "Dominate search results with intelligent keyword targeting and content optimization.",
      "Automated Content Generation": "Create compelling legal content at scale while maintaining your firm's voice.",
      "Smart PPC Campaign Management": "Maximize ROI with AI-driven bid optimization and audience targeting.",
      "Performance Analytics Dashboard": "Real-time insights into your marketing performance and ROI.",
      "Competitor Analysis": "Stay ahead with automated monitoring of competitor strategies and market trends.",
      "ROI Tracking & Reporting": "Transparent reporting showing exactly how your marketing dollars perform.",
    },
    video: {
      "24/7 AI Video Receptionist": "Professional video reception that creates personal connections with every caller.",
      "Intelligent Client Intake": "Automated intake process that qualifies leads and captures all essential information.",
      "AI Sales Representatives": "Convert more leads with AI agents trained on your firm's unique value proposition.",
      "Multi-language Support": "Serve clients in their preferred language with native-speaking AI agents.",
      "Appointment Scheduling": "Seamless calendar integration for effortless appointment booking.",
      "Lead Qualification": "Instantly identify and prioritize high-value leads for your team.",
    },
  }
  
  return descriptions[productId]?.[feature] || "Advanced AI-powered functionality to enhance your law firm's capabilities."
}