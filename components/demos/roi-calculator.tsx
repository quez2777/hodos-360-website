'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, TrendingUp, DollarSign, Users, 
  Clock, BarChart3, PiggyBank, Zap 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface CalculatorInputs {
  firmSize: number
  avgCaseValue: number
  monthlyMarketingSpend: number
  hoursPerWeek: number
  averageHourlyRate: number
}

interface ROIMetrics {
  monthlySavings: number
  yearlySavings: number
  timeSavedHours: number
  additionalCases: number
  roiPercentage: number
  paybackMonths: number
}

const HODOS_MONTHLY_COST = 2999

export function ROICalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    firmSize: 5,
    avgCaseValue: 15000,
    monthlyMarketingSpend: 5000,
    hoursPerWeek: 40,
    averageHourlyRate: 250
  })

  const [showResults, setShowResults] = useState(false)
  const [metrics, setMetrics] = useState<ROIMetrics>({
    monthlySavings: 0,
    yearlySavings: 0,
    timeSavedHours: 0,
    additionalCases: 0,
    roiPercentage: 0,
    paybackMonths: 0
  })

  const calculateROI = () => {
    // Time savings calculation (AI automation saves ~60% of admin time)
    const weeklyAdminHours = inputs.hoursPerWeek * 0.4 // 40% of time is admin
    const timeSavedWeekly = weeklyAdminHours * 0.6 // 60% reduction
    const timeSavedMonthly = timeSavedWeekly * 4.33
    const timeSavingsValue = timeSavedMonthly * inputs.averageHourlyRate

    // Marketing efficiency gains (AI improves conversion by ~35%)
    const marketingEfficiencyGain = inputs.monthlyMarketingSpend * 0.35

    // Additional cases from better intake (AI converts 25% more leads)
    const monthlyLeads = Math.floor(inputs.monthlyMarketingSpend / 500) // Rough lead cost
    const additionalCasesMonthly = monthlyLeads * 0.25 * 0.3 // 25% more leads, 30% conversion
    const additionalCaseValue = additionalCasesMonthly * inputs.avgCaseValue * 0.1 // 10% monthly value

    // Total savings
    const totalMonthlySavings = timeSavingsValue + marketingEfficiencyGain + additionalCaseValue
    const netMonthlySavings = totalMonthlySavings - HODOS_MONTHLY_COST
    const yearlyNetSavings = netMonthlySavings * 12

    // ROI calculation
    const yearlyInvestment = HODOS_MONTHLY_COST * 12
    const roiPercentage = (yearlyNetSavings / yearlyInvestment) * 100

    // Payback period
    const paybackMonths = HODOS_MONTHLY_COST / totalMonthlySavings

    setMetrics({
      monthlySavings: Math.round(netMonthlySavings),
      yearlySavings: Math.round(yearlyNetSavings),
      timeSavedHours: Math.round(timeSavedMonthly),
      additionalCases: Math.round(additionalCasesMonthly * 12),
      roiPercentage: Math.round(roiPercentage),
      paybackMonths: Math.round(paybackMonths * 10) / 10
    })

    setShowResults(true)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator Inputs */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="backdrop-blur-md bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-800/20 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10">
                <Calculator className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">ROI Calculator</h3>
                <p className="text-sm text-gray-300">Calculate your potential savings with HODOS</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Firm Size */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Attorneys
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.firmSize]}
                  onValueChange={([value]) => setInputs({ ...inputs, firmSize: value })}
                  min={1}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-white font-medium w-12 text-right">{inputs.firmSize}</span>
              </div>
            </div>

            {/* Average Case Value */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Average Case Value
              </Label>
              <Input
                type="number"
                value={inputs.avgCaseValue}
                onChange={(e) => setInputs({ ...inputs, avgCaseValue: Number(e.target.value) })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="15000"
              />
            </div>

            {/* Monthly Marketing Spend */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Monthly Marketing Spend
              </Label>
              <Input
                type="number"
                value={inputs.monthlyMarketingSpend}
                onChange={(e) => setInputs({ ...inputs, monthlyMarketingSpend: Number(e.target.value) })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="5000"
              />
            </div>

            {/* Hours per Week */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hours Worked per Week (per attorney)
              </Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={[inputs.hoursPerWeek]}
                  onValueChange={([value]) => setInputs({ ...inputs, hoursPerWeek: value })}
                  min={20}
                  max={80}
                  step={5}
                  className="flex-1"
                />
                <span className="text-white font-medium w-12 text-right">{inputs.hoursPerWeek}</span>
              </div>
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2">
              <Label className="text-gray-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Average Hourly Rate
              </Label>
              <Input
                type="number"
                value={inputs.averageHourlyRate}
                onChange={(e) => setInputs({ ...inputs, averageHourlyRate: Number(e.target.value) })}
                className="bg-white/10 border-white/20 text-white"
                placeholder="250"
              />
            </div>

            <Button
              onClick={calculateROI}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              size="lg"
            >
              Calculate ROI
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {showResults && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* ROI Summary */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="backdrop-blur-md bg-gradient-to-br from-green-600/20 to-blue-600/20 rounded-2xl border border-white/20 p-6"
              >
                <div className="text-center space-y-4">
                  <TrendingUp className="h-12 w-12 text-green-400 mx-auto" />
                  <div>
                    <div className="text-5xl font-bold text-white">
                      {metrics.roiPercentage}%
                    </div>
                    <div className="text-lg text-gray-300">Return on Investment</div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <div className="text-sm text-gray-400">Payback Period</div>
                    <div className="text-2xl font-semibold text-white">
                      {metrics.paybackMonths} months
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Savings Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <PiggyBank className="h-5 w-5 text-green-400" />
                    <span className="text-sm text-gray-300">Monthly Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(metrics.monthlySavings)}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    <span className="text-sm text-gray-300">Yearly Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(metrics.yearlySavings)}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-purple-400" />
                    <span className="text-sm text-gray-300">Hours Saved/Month</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {metrics.timeSavedHours}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-pink-400" />
                    <span className="text-sm text-gray-300">Extra Cases/Year</span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    +{metrics.additionalCases}
                  </div>
                </motion.div>
              </div>

              {/* Value Proposition */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="backdrop-blur-md bg-white/10 rounded-xl border border-white/20 p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  What You Get
                </h4>
                <div className="space-y-3">
                  {[
                    'AI-powered case management and automation',
                    'Intelligent marketing and SEO optimization',
                    'Automated client intake and communication',
                    '24/7 AI receptionist and support',
                    'Real-time analytics and insights'
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-gray-300">{feature}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {!showResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center space-y-4">
                <BarChart3 className="h-24 w-24 text-gray-600 mx-auto" />
                <div>
                  <h4 className="text-xl font-semibold text-white mb-2">
                    See Your Potential Savings
                  </h4>
                  <p className="text-gray-400 max-w-sm">
                    Enter your firm's details to calculate how much you could save with HODOS AI solutions
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute bottom-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>
    </div>
  )
}