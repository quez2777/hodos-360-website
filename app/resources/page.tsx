import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download,
  PlayCircle,
  Users,
  Calendar,
  Zap,
  Brain,
  BarChart,
  Shield,
  Clock,
  ArrowRight,
  ExternalLink
} from "lucide-react"

export const metadata: Metadata = {
  title: "Resources & Learning Center | HODOS 360",
  description: "Access guides, webinars, case studies, and tools to maximize your success with HODOS 360's AI legal technology.",
}

const resources = {
  guides: [
    {
      title: "AI Implementation Guide for Law Firms",
      description: "Complete roadmap for integrating AI into your practice",
      type: "PDF Guide",
      readTime: "15 min read",
      icon: Brain,
      badge: "Most Popular",
      link: "/resources/ai-implementation-guide"
    },
    {
      title: "ROI Calculator for Legal AI",
      description: "Calculate your potential return on investment with HODOS 360",
      type: "Interactive Tool",
      readTime: "5 min",
      icon: BarChart,
      badge: "Interactive",
      link: "/resources/roi-calculator"
    },
    {
      title: "Security & Compliance Whitepaper",
      description: "How HODOS 360 ensures data security and regulatory compliance",
      type: "Whitepaper",
      readTime: "20 min read",
      icon: Shield,
      badge: "Technical",
      link: "/resources/security-whitepaper"
    },
    {
      title: "Legal AI Best Practices",
      description: "Industry best practices for using AI in legal services",
      type: "PDF Guide",
      readTime: "10 min read",
      icon: BookOpen,
      badge: "Essential",
      link: "/resources/best-practices"
    }
  ],
  webinars: [
    {
      title: "Maximizing Case Value with AI Analytics",
      date: "Jan 15, 2025",
      duration: "45 min",
      speaker: "Sarah Johnson, Legal AI Expert",
      attendees: 234,
      status: "upcoming"
    },
    {
      title: "Automating Document Review & Discovery",
      date: "Jan 22, 2025",
      duration: "60 min",
      speaker: "Michael Chen, Product Lead",
      attendees: 189,
      status: "upcoming"
    },
    {
      title: "AI-Powered Client Acquisition Strategies",
      date: "Dec 18, 2024",
      duration: "45 min",
      speaker: "David Martinez, Marketing Director",
      attendees: 412,
      status: "recorded"
    },
    {
      title: "Building Your Digital Law Practice",
      date: "Dec 11, 2024",
      duration: "60 min",
      speaker: "Emily Williams, Digital Strategist",
      attendees: 356,
      status: "recorded"
    }
  ],
  caseStudies: [
    {
      firm: "Johnson & Associates",
      type: "Personal Injury",
      results: {
        revenueIncrease: "187%",
        timeReduction: "65%",
        casesHandled: "3x more"
      },
      quote: "HODOS 360 transformed how we handle personal injury cases. We've tripled our caseload without adding staff.",
      author: "Mark Johnson, Managing Partner"
    },
    {
      firm: "Rivera Corporate Law",
      type: "Corporate Law",
      results: {
        revenueIncrease: "142%",
        timeReduction: "72%",
        casesHandled: "2.5x more"
      },
      quote: "The AI contract analysis alone saves us 20 hours per week. It's been a game-changer.",
      author: "Ana Rivera, Senior Partner"
    },
    {
      firm: "Thompson Family Law",
      type: "Family Law",
      results: {
        revenueIncrease: "98%",
        timeReduction: "58%",
        casesHandled: "2x more"
      },
      quote: "Our clients love the 24/7 AI support, and we love the efficiency gains.",
      author: "Lisa Thompson, Founder"
    }
  ],
  tools: [
    {
      name: "Chrome Extension",
      description: "Access HODOS AI directly from your browser",
      icon: Zap,
      link: "/download/chrome-extension"
    },
    {
      name: "Mobile App",
      description: "Manage your practice on the go",
      icon: Download,
      link: "/download/mobile-app"
    },
    {
      name: "API Documentation",
      description: "Integrate HODOS with your existing tools",
      icon: FileText,
      link: "/api-docs"
    },
    {
      name: "Training Videos",
      description: "Step-by-step tutorials for all features",
      icon: PlayCircle,
      link: "/training"
    }
  ]
}

export default function ResourcesPage() {
  return (
    <>
      <Navigation />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-lapis-deep/10 via-background to-lapis/10" />
          <div className="container relative z-10 mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Resources &{" "}
                <span className="bg-gradient-to-r from-lapis-deep via-lapis to-lapis-light bg-clip-text text-transparent">
                  Learning Center
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Everything you need to succeed with HODOS 360. Access guides, webinars, 
                case studies, and tools designed to help you maximize your AI investment.
              </p>
            </div>
          </div>
        </section>

        {/* Guides Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-3xl font-bold">Essential Guides & Tools</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Download our comprehensive guides and use our interactive tools
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {resources.guides.map((guide, idx) => {
                const Icon = guide.icon
                return (
                  <Card key={idx} className="group hover:shadow-lg transition-all duration-300 border-lapis/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="rounded-lg bg-gradient-to-br from-lapis/10 to-lapis-light/10 p-3">
                            <Icon className="h-6 w-6 text-lapis" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{guide.title}</CardTitle>
                              {guide.badge && (
                                <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20">
                                  {guide.badge}
                                </Badge>
                              )}
                            </div>
                            <CardDescription>{guide.description}</CardDescription>
                            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{guide.type}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {guide.readTime}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Link href={guide.link}>
                        <Button variant="outline" className="w-full border-lapis/30 hover:bg-lapis/10">
                          Access Resource
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Webinars Section */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="text-3xl font-bold">Webinars & Training</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Join live sessions or watch recordings at your convenience
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {resources.webinars.map((webinar, idx) => (
                <Card key={idx} className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge 
                          variant={webinar.status === 'upcoming' ? 'default' : 'secondary'}
                          className={webinar.status === 'upcoming' ? 'bg-lapis text-white' : ''}
                        >
                          {webinar.status === 'upcoming' ? 'Upcoming' : 'Recorded'}
                        </Badge>
                        <CardTitle className="mt-3">{webinar.title}</CardTitle>
                        <CardDescription className="mt-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {webinar.date}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-4 w-4" />
                            {webinar.duration}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Users className="h-4 w-4" />
                            {webinar.attendees} {webinar.status === 'upcoming' ? 'registered' : 'attended'}
                          </div>
                        </CardDescription>
                      </div>
                      {webinar.status === 'upcoming' ? (
                        <Video className="h-8 w-8 text-lapis" />
                      ) : (
                        <PlayCircle className="h-8 w-8 text-gold" />
                      )}
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Speaker: {webinar.speaker}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full bg-gradient-to-r from-lapis-deep to-lapis hover:from-lapis-deep hover:to-lapis-medium text-white">
                      {webinar.status === 'upcoming' ? 'Register Now' : 'Watch Recording'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Case Studies Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold">Success Stories</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                See how law firms are transforming their practices with HODOS 360
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {resources.caseStudies.map((study, idx) => (
                <Card key={idx} className="hover:shadow-xl transition-all duration-300 border-lapis/10">
                  <CardHeader>
                    <Badge variant="outline" className="w-fit">{study.type}</Badge>
                    <CardTitle className="mt-3">{study.firm}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-lapis">{study.results.revenueIncrease}</p>
                        <p className="text-xs text-muted-foreground">Revenue</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gold">{study.results.timeReduction}</p>
                        <p className="text-xs text-muted-foreground">Time Saved</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-lapis">{study.results.casesHandled}</p>
                        <p className="text-xs text-muted-foreground">Cases</p>
                      </div>
                    </div>
                    <blockquote className="border-l-2 border-lapis/50 pl-4 italic text-muted-foreground">
                      "{study.quote}"
                    </blockquote>
                    <p className="mt-3 text-sm font-medium">— {study.author}</p>
                    <Button variant="link" className="mt-4 p-0 text-lapis">
                      Read Full Case Study
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Downloads Section */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold">Downloads & Tools</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Extend HODOS 360 with our suite of tools and integrations
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {resources.tools.map((tool, idx) => {
                const Icon = tool.icon
                return (
                  <Card key={idx} className="text-center hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="mx-auto rounded-full bg-gradient-to-br from-lapis/10 to-lapis-light/10 p-4 w-fit">
                        <Icon className="h-8 w-8 text-lapis" />
                      </div>
                      <CardTitle className="text-lg">{tool.name}</CardTitle>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link href={tool.link}>
                        <Button variant="outline" className="w-full border-lapis/30 hover:bg-lapis/10">
                          Download
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-lapis-deep to-lapis text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
              Join thousands of legal professionals already using HODOS 360 to transform their practice.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-lapis hover:bg-white/90">
                  Schedule Your Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  Talk to Sales
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}