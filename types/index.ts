// Navigation Types
export interface NavLink {
  label: string
  href: string
  children?: NavLink[]
}

// Product Types
export interface Product {
  id: string
  name: string
  tagline: string
  description: string
  features: readonly string[]
  benefits: readonly string[]
  icon: string
  color: "primary" | "secondary" | "accent"
  href: string
}

// Testimonial Types
export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  image?: string
}

// FAQ Types
export interface FAQ {
  question: string
  answer: string
}

// Pricing Types
export interface PricingTier {
  name: string
  price: number | string
  period: "month" | "year"
  description: string
  features: string[]
  cta: string
  popular: boolean
}

// Contact Types
export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  company: string
  firmSize: string
  message: string
  product?: string
}

// Blog/Resource Types
export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: Author
  category: string
  tags: string[]
  publishedAt: string
  updatedAt?: string
  image: string
  readTime: number
}

export interface Author {
  id: string
  name: string
  role: string
  bio: string
  image: string
  social?: {
    linkedin?: string
    twitter?: string
  }
}

// Analytics Types
export interface AnalyticsEvent {
  event: string
  category: string
  action: string
  label?: string
  value?: number
  userId?: string
  properties?: Record<string, any>
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
}

// Form Types
export interface FormField {
  name: string
  label: string
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox" | "radio"
  placeholder?: string
  required?: boolean
  options?: { label: string; value: string }[]
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
  }
}

// Component Props Types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
  id?: string
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "link"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  onClick?: () => void
  type?: "button" | "submit" | "reset"
  href?: string
  target?: "_blank" | "_self" | "_parent" | "_top"
  rel?: string
}

export interface CardProps extends BaseComponentProps {
  variant?: "default" | "glass" | "gradient"
  padding?: "none" | "sm" | "md" | "lg"
  hover?: boolean
  onClick?: () => void
}

// Animation Types
export interface AnimationConfig {
  initial?: Record<string, any>
  animate?: Record<string, any>
  exit?: Record<string, any>
  transition?: Record<string, any>
  whileHover?: Record<string, any>
  whileTap?: Record<string, any>
  whileInView?: Record<string, any>
  viewport?: {
    once?: boolean
    amount?: number | "all" | "some"
    margin?: string
  }
}

// Theme Types
export interface Theme {
  mode: "light" | "dark"
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
  }
}

// SEO Types
export interface SEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: "website" | "article" | "product"
  author?: string
  publishedTime?: string
  modifiedTime?: string
}