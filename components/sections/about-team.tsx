"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Linkedin, Twitter } from "lucide-react"
import Image from "next/image"

const team = [
  {
    name: "Sarah Chen",
    role: "CEO & Co-Founder",
    bio: "Former legal tech executive with 15+ years transforming law firms through technology.",
    image: "/images/team/sarah-chen.jpg",
    social: {
      linkedin: "https://linkedin.com/in/sarahchen",
      twitter: "https://twitter.com/sarahchen",
    },
  },
  {
    name: "Michael Rodriguez",
    role: "CTO & Co-Founder",
    bio: "AI researcher and engineer specializing in natural language processing for legal applications.",
    image: "/images/team/michael-rodriguez.jpg",
    social: {
      linkedin: "https://linkedin.com/in/michaelrodriguez",
      twitter: "https://twitter.com/michaelrodriguez",
    },
  },
  {
    name: "Emily Thompson",
    role: "Chief Legal Officer",
    bio: "20-year practicing attorney bringing deep industry knowledge to product development.",
    image: "/images/team/emily-thompson.jpg",
    social: {
      linkedin: "https://linkedin.com/in/emilythompson",
    },
  },
  {
    name: "David Park",
    role: "VP of Product",
    bio: "Product leader focused on creating intuitive AI experiences that lawyers actually love using.",
    image: "/images/team/david-park.jpg",
    social: {
      linkedin: "https://linkedin.com/in/davidpark",
      twitter: "https://twitter.com/davidpark",
    },
  },
  {
    name: "Lisa Johnson",
    role: "VP of Customer Success",
    bio: "Dedicated to ensuring every firm achieves transformative results with our AI solutions.",
    image: "/images/team/lisa-johnson.jpg",
    social: {
      linkedin: "https://linkedin.com/in/lisajohnson",
    },
  },
  {
    name: "Alex Kim",
    role: "Head of AI Research",
    bio: "Leading our R&D efforts to keep HODOS at the forefront of legal AI innovation.",
    image: "/images/team/alex-kim.jpg",
    social: {
      linkedin: "https://linkedin.com/in/alexkim",
      twitter: "https://twitter.com/alexkim",
    },
  },
]

export function AboutTeam() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold sm:text-4xl mb-4">Meet Our Team</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Industry veterans and AI pioneers working together to transform legal practice
          </p>
        </motion.div>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square relative bg-muted">
                  {/* Placeholder for team member photo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20" />
                  </div>
                </div>
                
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold">{member.name}</h3>
                  <p className="text-sm text-primary mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                  
                  <div className="flex gap-2">
                    {member.social.linkedin && (
                      <a
                        href={member.social.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                        aria-label={`${member.name} on LinkedIn`}
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                    {member.social.twitter && (
                      <a
                        href={member.social.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted transition-colors"
                        aria-label={`${member.name} on Twitter`}
                      >
                        <Twitter className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}