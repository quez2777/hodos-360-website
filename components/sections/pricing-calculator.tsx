"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calculator, TrendingUp, Clock, Users } from "lucide-react"
import Link from "next/link"

export function PricingCalculator() {
  const [attorneys, setAttorneys] = useState(10)
  const [hoursPerWeek, setHoursPerWeek] = useState(5)
  
  // ROI calculations
  const hoursSavedPerMonth = attorneys * hoursPerWeek * 4
  const valueSaved = hoursSavedPerMonth * 300 // $300/hour average
  const revenueIncrease = attorneys * 2500 // Average revenue increase per attorney
  const totalROI = valueSaved + revenueIncrease
  
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
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm mb-6">
            <Calculator className="h-4 w-4" />
            <span>ROI Calculator</span>
          </div>
          
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            Calculate Your Return on Investment
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how much time and money HODOS 360 can save your firm
          </p>
        </motion.div>
        
        <div className="grid gap-8 lg:grid-cols-2 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardHeader>
                <h3 className="text-xl font-semibold">Your Firm Details</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Number of Attorneys
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={attorneys}
                    onChange={(e) => setAttorneys(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1</span>
                    <span className="font-medium text-foreground">{attorneys}</span>
                    <span>100</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Hours Saved per Attorney per Week
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>1</span>
                    <span className="font-medium text-foreground">{hoursPerWeek}</span>
                    <span>20</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Based on industry averages: $300/hour billing rate, 
                    25% increase in client acquisition, 30% reduction in admin time
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <Card className="h-full bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <h3 className="text-xl font-semibold">Your Estimated ROI</h3>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Time Saved Monthly</p>
                      <p className="text-2xl font-bold">{hoursSavedPerMonth.toLocaleString()} hours</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Value of Time Saved</p>
                      <p className="text-2xl font-bold">${valueSaved.toLocaleString()}/month</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Revenue Increase</p>
                      <p className="text-2xl font-bold">${revenueIncrease.toLocaleString()}/month</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Total Monthly ROI</p>
                  <p className="text-4xl font-bold text-primary">
                    ${totalROI.toLocaleString()}
                  </p>
                </div>
                
                <Link href="/demo" className="block">
                  <Button variant="ai" fullWidth>
                    See How It Works
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
}