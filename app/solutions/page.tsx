import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Navigation } from "@/components/layout/navigation"
import { Footer } from "@/components/layout/footer"
import { 
  Scale, 
  Users, 
  Building, 
  Briefcase, 
  Home, 
  Heart,
  Shield,
  Gavel,
  FileText,
  TrendingUp,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight
} from "lucide-react"

export const metadata: Metadata = {
  title: "Solutions for Every Practice Area | HODOS 360",
  description: "Tailored AI solutions for personal injury, corporate, family, criminal, and real estate law firms. Transform your practice with HODOS 360.",
}

const solutions = [
  {
    id: "personal-injury",
    title: "Personal Injury",
    icon: Heart,
    description: "Streamline case management, automate document generation, and maximize settlements with AI-powered insights.",
    features: [
      "Automated medical record analysis",
      "Settlement value prediction",
      "Case timeline generation",
      "Client communication automation"
    ],
    stats: {
      avgSettlementIncrease: "47%",
      timeReduction: "65%",
      clientSatisfaction: "96%"
    }
  },
  {
    id: "corporate",
    title: "Corporate Law",
    icon: Building,
    description: "Accelerate due diligence, contract review, and compliance monitoring with intelligent automation.",
    features: [
      "AI contract analysis and drafting",
      "Regulatory compliance tracking",
      "M&A due diligence automation",
      "Corporate governance tools"
    ],
    stats: {
      avgSettlementIncrease: "38%",
      timeReduction: "72%",
      clientSatisfaction: "94%"
    }
  },
  {
    id: "family",
    title: "Family Law",
    icon: Home,
    description: "Manage complex family matters with sensitivity and efficiency using our specialized AI tools.",
    features: [
      "Asset division calculators",
      "Custody arrangement optimization",
      "Document automation for divorces",
      "Financial disclosure analysis"
    ],
    stats: {
      avgSettlementIncrease: "32%",
      timeReduction: "58%",
      clientSatisfaction: "97%"
    }
  },
  {
    id: "criminal",
    title: "Criminal Defense",
    icon: Shield,
    description: "Build stronger defenses with AI-powered case analysis and evidence management.",
    features: [
      "Evidence analysis and organization",
      "Precedent research automation",
      "Sentencing guideline analysis",
      "Witness testimony management"
    ],
    stats: {
      avgSettlementIncrease: "41%",
      timeReduction: "61%",
      clientSatisfaction: "95%"
    }
  },
  {
    id: "real-estate",
    title: "Real Estate",
    icon: Briefcase,
    description: "Streamline transactions and due diligence with comprehensive real estate AI solutions.",
    features: [
      "Title search automation",
      "Contract generation and review",
      "Closing document preparation",
      "Property valuation analysis"
    ],
    stats: {
      avgSettlementIncrease: "35%",
      timeReduction: "68%",
      clientSatisfaction: "93%"
    }
  },
  {
    id: "litigation",
    title: "Litigation",
    icon: Gavel,
    description: "Win more cases with AI-powered litigation support and strategy tools.",
    features: [
      "Case outcome prediction",
      "Discovery document analysis",
      "Motion drafting assistance",
      "Trial preparation automation"
    ],
    stats: {
      avgSettlementIncrease: "52%",
      timeReduction: "70%",
      clientSatisfaction: "98%"
    }
  }
]

const benefits = [
  {
    icon: TrendingUp,
    title: "Increase Revenue",
    description: "Handle more cases with the same resources and maximize settlement values with AI insights."
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate repetitive tasks and focus on high-value activities that grow your practice."
  },
  {
    icon: DollarSign,
    title: "Reduce Costs",
    description: "Lower operational expenses while improving service quality and client outcomes."
  },
  {
    icon: CheckCircle,
    title: "Improve Accuracy",
    description: "Eliminate human error with AI-powered document review and analysis."
  }
]

export default function SolutionsPage() {
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
                AI Solutions for Every{" "}
                <span className="bg-gradient-to-r from-lapis-deep via-lapis to-lapis-light bg-clip-text text-transparent">
                  Practice Area
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Whether you specialize in personal injury, corporate law, or family matters, 
                HODOS 360 has tailored AI solutions to transform your practice.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Link href="/demo">
                  <Button size="lg" className="bg-gradient-to-r from-lapis-deep to-lapis hover:from-lapis-deep hover:to-lapis-medium text-white shadow-lg shadow-lapis/25">
                    Book a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-lapis/30 hover:bg-lapis/10">
                    Contact Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Solutions Grid */}
        <section className="py-24 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Specialized Solutions by Practice Area
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Our AI adapts to your specific needs, providing targeted tools and insights for your practice.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {solutions.map((solution) => {
                const Icon = solution.icon
                return (
                  <Card key={solution.id} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-lapis/10">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-gradient-to-br from-lapis/10 to-lapis-light/10 p-3 w-fit">
                          <Icon className="h-6 w-6 text-lapis" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-lapis">{solution.stats.avgSettlementIncrease}</p>
                          <p className="text-xs text-muted-foreground">Avg. Increase</p>
                        </div>
                      </div>
                      <CardTitle className="mt-4">{solution.title}</CardTitle>
                      <CardDescription>{solution.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {solution.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start">
                            <CheckCircle className="h-4 w-4 text-gold mt-0.5 mr-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex items-center justify-between text-sm">
                        <div>
                          <p className="font-semibold text-lapis">{solution.stats.timeReduction}</p>
                          <p className="text-xs text-muted-foreground">Time Saved</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gold">{solution.stats.clientSatisfaction}</p>
                          <p className="text-xs text-muted-foreground">Satisfaction</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Transform Your Practice with AI
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Regardless of your practice area, HODOS 360 delivers measurable results.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit, idx) => {
                const Icon = benefit.icon
                return (
                  <div key={idx} className="text-center">
                    <div className="mx-auto w-fit rounded-full bg-gradient-to-br from-lapis/10 to-lapis-light/10 p-4">
                      <Icon className="h-8 w-8 text-lapis" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{benefit.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 bg-gradient-to-br from-lapis-deep to-lapis text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Ready to Transform Your Practice?
            </h2>
            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto">
              Join hundreds of law firms already using HODOS 360 to deliver better results for their clients.
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-lapis hover:bg-white/90">
                  Schedule Your Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  View Pricing
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