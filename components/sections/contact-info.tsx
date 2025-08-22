"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { COMPANY } from "@/lib/constants"
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  MessageSquare,
  Calendar,
  Linkedin,
  Twitter,
  Facebook,
  Youtube,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const socialIcons = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  youtube: Youtube,
}

export function ContactInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="space-y-6"
    >
      {/* Contact Methods */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-6">Get in Touch</h3>
          
          <div className="space-y-4">
            <a 
              href={`mailto:${COMPANY.email}`}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Email Us</p>
                <p className="text-sm text-muted-foreground">{COMPANY.email}</p>
              </div>
            </a>
            
            <a 
              href={`tel:${COMPANY.phone}`}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted transition-colors"
            >
              <Phone className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Call Us</p>
                <p className="text-sm text-muted-foreground">{COMPANY.phone}</p>
              </div>
            </a>
            
            <div className="flex items-start gap-4 p-4 rounded-lg">
              <MapPin className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Visit Us</p>
                <p className="text-sm text-muted-foreground">
                  {COMPANY.address.street}<br />
                  {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4 p-4 rounded-lg">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">Business Hours</p>
                <p className="text-sm text-muted-foreground">
                  Monday - Friday: 9:00 AM - 6:00 PM PST<br />
                  24/7 AI Support Available
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-6">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link href="/demo" className="block">
              <Button variant="outline" fullWidth className="justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Schedule a Demo
              </Button>
            </Link>
            
            <Link href="/support" className="block">
              <Button variant="outline" fullWidth className="justify-start">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
      
      {/* Social Links */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-xl font-semibold mb-6">Follow Us</h3>
          
          <div className="flex gap-4">
            {Object.entries(COMPANY.social).map(([platform, url]) => {
              const Icon = socialIcons[platform as keyof typeof socialIcons]
              return (
                <a
                  key={platform}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                  aria-label={platform}
                >
                  <Icon className="h-5 w-5" />
                </a>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}