// Company Information
export const COMPANY = {
  name: "HODOS 360 LLC",
  tagline: "AI-Powered Legal Tech Solutions",
  description: "Transform your law firm with AI-driven solutions that enhance efficiency, improve client experiences, and drive unprecedented growth.",
  email: "hello@hodos360.com",
  phone: "+1 (888) 555-0123",
  address: {
    street: "123 Innovation Drive",
    city: "San Francisco",
    state: "CA",
    zip: "94105",
    country: "USA",
  },
  social: {
    linkedin: "https://linkedin.com/company/hodos360",
    twitter: "https://twitter.com/hodos360",
    facebook: "https://facebook.com/hodos360",
    youtube: "https://youtube.com/@hodos360",
  },
} as const

// Navigation Links
export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Solutions", href: "/solutions" },
  { label: "About", href: "/about" },
  { label: "Resources", href: "/resources" },
  { label: "Contact", href: "/contact" },
] as const

// Products
export const PRODUCTS = {
  hodos: {
    id: "hodos",
    name: "HODOS",
    tagline: "Complete AI Law Firm Management",
    description: "Transform your entire law firm with AI-powered executives from C-suite to reception.",
    features: [
      "AI Chief Financial Officer (CFO)",
      "AI Chief Marketing Officer (CMO)",
      "AI Chief AI Officer (CAIO)",
      "AI Reception & Administration",
      "AI Operations Management",
      "Workflow Automation",
    ],
    benefits: [
      "Reduce operational costs by 60%",
      "24/7 availability and support",
      "Consistent high-quality service",
      "Scalable to firm growth",
    ],
    icon: "Building",
    color: "primary",
    href: "/products/hodos",
  },
  marketing: {
    id: "marketing",
    name: "HODOS Marketing Platform",
    tagline: "AI-Driven Legal Marketing",
    description: "Dominate your market with intelligent SEO and automated paid marketing campaigns.",
    features: [
      "AI-Powered SEO Optimization",
      "Automated Content Generation",
      "Smart PPC Campaign Management",
      "Performance Analytics Dashboard",
      "Competitor Analysis",
      "ROI Tracking & Reporting",
    ],
    benefits: [
      "3x increase in qualified leads",
      "50% reduction in marketing costs",
      "Real-time campaign optimization",
      "Predictive market insights",
    ],
    icon: "TrendingUp",
    color: "secondary",
    href: "/products/marketing",
  },
  video: {
    id: "video",
    name: "HODOS VIDEO Agents",
    tagline: "AI Video & Voice Assistants",
    description: "Revolutionary video and voice AI agents for reception, intake, and sales.",
    features: [
      "24/7 AI Video Receptionist",
      "Intelligent Client Intake",
      "AI Sales Representatives",
      "Multi-language Support",
      "Appointment Scheduling",
      "Lead Qualification",
    ],
    benefits: [
      "Never miss a client call",
      "Instant response times",
      "Personalized client experiences",
      "Seamless CRM integration",
    ],
    icon: "Video",
    color: "accent",
    href: "/products/video-agents",
  },
} as const

// Statistics
export const STATS = [
  { label: "Law Firms Transformed", value: "500+", suffix: "" },
  { label: "Average ROI Increase", value: "312", suffix: "%" },
  { label: "Hours Saved Monthly", value: "1000", suffix: "+" },
  { label: "Client Satisfaction", value: "98", suffix: "%" },
] as const

// Testimonials
export const TESTIMONIALS = [
  {
    id: "1",
    name: "Sarah Johnson",
    role: "Managing Partner",
    company: "Johnson & Associates",
    content: "HODOS 360 transformed our practice. We've seen a 300% increase in efficiency and our clients love the 24/7 availability.",
    rating: 5,
    image: "/testimonials/sarah.jpg",
  },
  {
    id: "2",
    name: "Michael Chen",
    role: "Senior Partner",
    company: "Chen Law Group",
    content: "The AI Marketing Platform doubled our client base in just 6 months. The ROI is incredible.",
    rating: 5,
    image: "/testimonials/michael.jpg",
  },
  {
    id: "3",
    name: "Lisa Martinez",
    role: "Founder",
    company: "Martinez Legal",
    content: "VIDEO Agents handle our intake flawlessly. We haven't missed a lead since implementation.",
    rating: 5,
    image: "/testimonials/lisa.jpg",
  },
] as const

// FAQs
export const FAQS = [
  {
    question: "How quickly can HODOS 360 be implemented?",
    answer: "Most firms are fully operational within 2-4 weeks. Our white-glove onboarding ensures a smooth transition with minimal disruption to your practice.",
  },
  {
    question: "Is my data secure with HODOS 360?",
    answer: "Absolutely. We maintain SOC 2 Type II compliance, use bank-level encryption, and follow all legal industry data protection standards including attorney-client privilege.",
  },
  {
    question: "Can HODOS 360 integrate with my existing systems?",
    answer: "Yes! We integrate seamlessly with all major legal practice management systems, CRMs, and accounting software. Our API allows for custom integrations as well.",
  },
  {
    question: "What kind of support do you provide?",
    answer: "We offer 24/7 technical support, dedicated account management, regular training sessions, and quarterly business reviews to ensure your success.",
  },
  {
    question: "How does pricing work?",
    answer: "We offer flexible pricing based on firm size and selected modules. Contact us for a customized quote that fits your firm's needs and budget.",
  },
] as const

// Pricing Tiers
export const PRICING = [
  {
    name: "Starter",
    price: 999,
    period: "month",
    description: "Perfect for solo practitioners and small firms",
    features: [
      "1 AI Executive Assistant",
      "Basic Marketing Automation",
      "Email Support",
      "Monthly Analytics Report",
      "5 Team Members",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: 2999,
    period: "month",
    description: "Ideal for growing firms",
    features: [
      "Full AI C-Suite",
      "Advanced Marketing Platform",
      "VIDEO Agents (Limited)",
      "Priority Support",
      "Weekly Analytics",
      "Unlimited Team Members",
      "Custom Integrations",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "month",
    description: "For large firms with specific needs",
    features: [
      "Everything in Professional",
      "Unlimited VIDEO Agents",
      "Dedicated Account Manager",
      "Custom AI Training",
      "White-label Options",
      "SLA Guarantee",
      "On-premise Deployment",
    ],
    cta: "Contact Sales",
    popular: false,
  },
] as const

// Export alias for backward compatibility
export const PRICING_TIERS = PRICING

// CTA Messages
export const CTA = {
  primary: "Book Your Demo",
  secondary: "Start Free Trial",
  learn: "Learn More",
  contact: "Contact Sales",
  download: "Download Guide",
  watch: "Watch Demo",
} as const

// Meta Tags
export const META = {
  title: "HODOS 360 LLC - AI-Powered Legal Tech Solutions",
  description: "Transform your law firm with AI-driven solutions. Complete AI management, marketing automation, and video agents for modern legal practices.",
  keywords: [
    "legal tech",
    "AI law firm",
    "legal AI",
    "law firm automation",
    "legal marketing",
    "AI receptionist",
    "legal practice management",
    "law firm software",
    "legal technology",
    "AI for lawyers",
  ],
} as const