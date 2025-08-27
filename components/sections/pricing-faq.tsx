"use client"

import { motion } from "framer-motion"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "Can I switch plans at any time?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, you'll receive credit toward future billing.",
  },
  {
    question: "Is there a setup fee?",
    answer: "No, there are no setup fees for any of our plans. We believe in transparent pricing with no hidden costs.",
  },
  {
    question: "Do you offer discounts for annual billing?",
    answer: "Yes, we offer a 20% discount when you pay annually. This applies to all plans and helps you save significantly over monthly billing.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer: "Your data remains available for 90 days after cancellation, giving you plenty of time to export everything. We also provide comprehensive data export tools.",
  },
  {
    question: "Can I get a custom plan for my large firm?",
    answer: "Absolutely! Our Enterprise plan is fully customizable. Contact our sales team to discuss your specific needs, and we'll create a tailored solution.",
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, we offer a 14-day free trial for our Starter and Professional plans. No credit card required. Enterprise plans include a custom pilot program.",
  },
  {
    question: "What kind of support is included?",
    answer: "All plans include 24/7 AI-powered support. Professional and Enterprise plans also include dedicated human support and personalized onboarding.",
  },
  {
    question: "How does billing work?",
    answer: "We bill monthly or annually via credit card or ACH transfer. Enterprise clients can also request invoice billing with NET 30 terms.",
  },
]

export function PricingFAQ() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about our pricing and plans
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <Accordion type="single" className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}