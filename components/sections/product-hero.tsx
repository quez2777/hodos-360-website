"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, Building, TrendingUp, Video } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Product } from "@/types"

const productIcons = {
  Building,
  TrendingUp,
  Video,
}

const productLogos = {
  hodos: "/images/hodos-main-logo.jpg",
  marketing: "/images/hodos-marketing-platform-logo.png",
  "video-agents": "/images/hodos-main-logo.jpg", // Using main logo for video agents for now
}

interface ProductHeroProps {
  product: Product
}

export function ProductHero({ product }: ProductHeroProps) {
  const Icon = productIcons[product.icon as keyof typeof productIcons]
  
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br from-${product.color}/20 via-background to-${product.color}/10`} />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={`inline-flex p-3 rounded-lg bg-${product.color}/10 mb-6`}>
              <Icon className={`h-8 w-8 text-${product.color}`} />
            </div>
            
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl mb-6">
              {product.name}
            </h1>
            
            <p className="text-2xl text-muted-foreground mb-6">
              {product.tagline}
            </p>
            
            <p className="text-lg mb-8">
              {product.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/demo">
                <Button size="xl" variant="ai">
                  Book a Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button size="xl" variant="outline">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Video
                </Button>
              </Link>
            </div>
          </motion.div>
          
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative"
          >
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-lapis-deep/20 via-background to-lapis/10 flex items-center justify-center p-8">
              {productLogos[product.id as keyof typeof productLogos] ? (
                <Image
                  src={productLogos[product.id as keyof typeof productLogos]}
                  alt={`${product.name} Logo`}
                  width={400}
                  height={400}
                  className="w-full h-full object-contain"
                  priority
                />
              ) : (
                <Icon className="h-48 w-48 text-lapis/50" />
              )}
            </div>
            
            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-card rounded-lg shadow-xl p-4"
            >
              <p className="text-4xl font-bold text-primary">{product.benefits[0].split(' ')[0]}</p>
              <p className="text-sm text-muted-foreground">{product.benefits[0].split(' ').slice(1).join(' ')}</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}