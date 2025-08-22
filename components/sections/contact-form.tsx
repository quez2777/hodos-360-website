"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Send } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

const contactSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  firmSize: z.string().min(1, "Please select your firm size"),
  product: z.string().optional(),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  })
  
  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || "Failed to send message")
      }
      
      toast({
        title: "Message sent successfully!",
        description: result.message || "We'll get back to you within 24 hours.",
        variant: "success" as any,
      })
      
      reset()
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: error instanceof Error ? error.message : "Please try again or email us directly.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Send us a message</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you within 24 hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register("firstName")}
                  error={errors.firstName?.message}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register("lastName")}
                  error={errors.lastName?.message}
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  error={errors.email?.message}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  error={errors.phone?.message}
                />
              </div>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company">Law Firm *</Label>
                <Input
                  id="company"
                  {...register("company")}
                  error={errors.company?.message}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firmSize">Firm Size *</Label>
                <Select onValueChange={(value) => setValue("firmSize", value)}>
                  <SelectTrigger id="firmSize">
                    <SelectValue placeholder="Select firm size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo Practice</SelectItem>
                    <SelectItem value="small">2-10 Attorneys</SelectItem>
                    <SelectItem value="medium">11-50 Attorneys</SelectItem>
                    <SelectItem value="large">51-200 Attorneys</SelectItem>
                    <SelectItem value="enterprise">200+ Attorneys</SelectItem>
                  </SelectContent>
                </Select>
                {errors.firmSize && (
                  <p className="text-sm text-destructive">{errors.firmSize.message}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="product">Product Interest</Label>
              <Select onValueChange={(value) => setValue("product", value)}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Select a product (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hodos">HODOS - AI Management</SelectItem>
                  <SelectItem value="marketing">Marketing Platform</SelectItem>
                  <SelectItem value="video">VIDEO Agents</SelectItem>
                  <SelectItem value="all">All Products</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                rows={5}
                {...register("message")}
                error={errors.message?.message}
                placeholder="Tell us about your firm's needs..."
              />
            </div>
            
            <Button
              type="submit"
              size="lg"
              variant="ai"
              fullWidth
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}