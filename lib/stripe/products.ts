/**
 * HODOS 360 Stripe Product Configuration
 * 
 * This module defines all product configurations, pricing tiers,
 * and feature lists for the HODOS 360 product suite.
 */

export interface ProductFeature {
  name: string;
  included: boolean;
  value?: string;
}

export interface PricingTier {
  id: string;
  name: string;
  stripePriceId: string;
  monthlyPrice: number;
  annualPrice: number;
  annualSavings: number;
  description: string;
  features: ProductFeature[];
  popular?: boolean;
  trialDays?: number;
  setupFee?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription: string;
  category: 'core' | 'addon' | 'enterprise';
  icon: string;
  tiers: PricingTier[];
  benefits: string[];
  testimonial?: {
    quote: string;
    author: string;
    company: string;
    role: string;
  };
}

// HODOS Core Platform
const hodosTiers: PricingTier[] = [
  {
    id: 'hodos-starter',
    name: 'Starter',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_hodos_starter_prod' 
      : 'price_hodos_starter_test',
    monthlyPrice: 497,
    annualPrice: 4970,
    annualSavings: 964,
    description: 'Perfect for solo practitioners and small firms',
    trialDays: 14,
    features: [
      { name: 'AI Case Management', included: true },
      { name: 'Document Automation', included: true, value: '50 docs/month' },
      { name: 'Legal Research AI', included: true, value: '100 queries/month' },
      { name: 'Client Portal', included: true },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Support', included: true },
      { name: 'Custom Workflows', included: false },
      { name: 'Advanced Reporting', included: false },
      { name: 'API Access', included: false },
      { name: 'White-Label', included: false },
    ]
  },
  {
    id: 'hodos-professional',
    name: 'Professional',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_hodos_professional_prod' 
      : 'price_hodos_professional_test',
    monthlyPrice: 997,
    annualPrice: 9970,
    annualSavings: 1964,
    description: 'Ideal for growing firms with advanced needs',
    popular: true,
    trialDays: 14,
    features: [
      { name: 'AI Case Management', included: true },
      { name: 'Document Automation', included: true, value: 'Unlimited' },
      { name: 'Legal Research AI', included: true, value: 'Unlimited' },
      { name: 'Client Portal', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Priority Support', included: true },
      { name: 'Custom Workflows', included: true },
      { name: 'Advanced Reporting', included: true },
      { name: 'API Access', included: true },
      { name: 'White-Label', included: false },
    ]
  },
  {
    id: 'hodos-enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_hodos_enterprise_prod' 
      : 'price_hodos_enterprise_test',
    monthlyPrice: 1997,
    annualPrice: 19970,
    annualSavings: 3964,
    description: 'Complete solution for large firms and multi-location practices',
    trialDays: 30,
    setupFee: 2500,
    features: [
      { name: 'AI Case Management', included: true },
      { name: 'Document Automation', included: true, value: 'Unlimited' },
      { name: 'Legal Research AI', included: true, value: 'Unlimited' },
      { name: 'Client Portal', included: true },
      { name: 'Advanced Analytics', included: true },
      { name: 'Dedicated Success Manager', included: true },
      { name: 'Custom Workflows', included: true },
      { name: 'Advanced Reporting', included: true },
      { name: 'API Access', included: true },
      { name: 'White-Label', included: true },
    ]
  }
];

// HODOS Marketing Platform
const marketingTiers: PricingTier[] = [
  {
    id: 'marketing-starter',
    name: 'Starter',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_marketing_starter_prod' 
      : 'price_marketing_starter_test',
    monthlyPrice: 297,
    annualPrice: 2970,
    annualSavings: 564,
    description: 'Essential SEO and marketing tools for small firms',
    trialDays: 14,
    features: [
      { name: 'AI SEO Optimization', included: true },
      { name: 'Content Generation', included: true, value: '20 pieces/month' },
      { name: 'Keyword Research', included: true, value: 'Basic' },
      { name: 'Local SEO', included: true },
      { name: 'Social Media Scheduler', included: true, value: '3 platforms' },
      { name: 'Basic Analytics', included: true },
      { name: 'Google Ads Integration', included: false },
      { name: 'Advanced Competitor Analysis', included: false },
      { name: 'Custom Landing Pages', included: false },
      { name: 'A/B Testing', included: false },
    ]
  },
  {
    id: 'marketing-professional',
    name: 'Professional',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_marketing_professional_prod' 
      : 'price_marketing_professional_test',
    monthlyPrice: 597,
    annualPrice: 5970,
    annualSavings: 1164,
    description: 'Complete marketing automation for serious growth',
    popular: true,
    trialDays: 14,
    features: [
      { name: 'AI SEO Optimization', included: true },
      { name: 'Content Generation', included: true, value: 'Unlimited' },
      { name: 'Keyword Research', included: true, value: 'Advanced' },
      { name: 'Local SEO', included: true },
      { name: 'Social Media Scheduler', included: true, value: 'All platforms' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Google Ads Integration', included: true },
      { name: 'Advanced Competitor Analysis', included: true },
      { name: 'Custom Landing Pages', included: true, value: '10 pages' },
      { name: 'A/B Testing', included: true },
    ]
  },
  {
    id: 'marketing-enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_marketing_enterprise_prod' 
      : 'price_marketing_enterprise_test',
    monthlyPrice: 997,
    annualPrice: 9970,
    annualSavings: 1964,
    description: 'Enterprise-grade marketing solution with dedicated support',
    trialDays: 30,
    features: [
      { name: 'AI SEO Optimization', included: true },
      { name: 'Content Generation', included: true, value: 'Unlimited' },
      { name: 'Keyword Research', included: true, value: 'Enterprise' },
      { name: 'Local SEO', included: true },
      { name: 'Social Media Scheduler', included: true, value: 'All platforms' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Google Ads Integration', included: true },
      { name: 'Advanced Competitor Analysis', included: true },
      { name: 'Custom Landing Pages', included: true, value: 'Unlimited' },
      { name: 'A/B Testing', included: true },
    ]
  }
];

// HODOS Video Agents
const videoTiers: PricingTier[] = [
  {
    id: 'video-starter',
    name: 'Starter',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_video_starter_prod' 
      : 'price_video_starter_test',
    monthlyPrice: 197,
    annualPrice: 1970,
    annualSavings: 364,
    description: 'AI receptionist and basic video interactions',
    trialDays: 14,
    features: [
      { name: 'AI Receptionist', included: true },
      { name: 'Basic Voice Interactions', included: true },
      { name: 'Appointment Scheduling', included: true },
      { name: 'Call Recording', included: true, value: '100 hours/month' },
      { name: 'Basic Analytics', included: true },
      { name: 'Email Integration', included: true },
      { name: 'Advanced Voice Cloning', included: false },
      { name: 'Video Avatar Creation', included: false },
      { name: 'Multi-language Support', included: false },
      { name: 'Custom Workflows', included: false },
    ]
  },
  {
    id: 'video-professional',
    name: 'Professional',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_video_professional_prod' 
      : 'price_video_professional_test',
    monthlyPrice: 397,
    annualPrice: 3970,
    annualSavings: 764,
    description: 'Full AI video agent suite with custom avatars',
    popular: true,
    trialDays: 14,
    features: [
      { name: 'AI Receptionist', included: true },
      { name: 'Advanced Voice Interactions', included: true },
      { name: 'Appointment Scheduling', included: true },
      { name: 'Call Recording', included: true, value: 'Unlimited' },
      { name: 'Advanced Analytics', included: true },
      { name: 'CRM Integration', included: true },
      { name: 'Advanced Voice Cloning', included: true },
      { name: 'Video Avatar Creation', included: true, value: '3 avatars' },
      { name: 'Multi-language Support', included: true, value: '10 languages' },
      { name: 'Custom Workflows', included: true },
    ]
  },
  {
    id: 'video-enterprise',
    name: 'Enterprise',
    stripePriceId: process.env.NODE_ENV === 'production' 
      ? 'price_video_enterprise_prod' 
      : 'price_video_enterprise_test',
    monthlyPrice: 697,
    annualPrice: 6970,
    annualSavings: 1364,
    description: 'Enterprise video AI with unlimited customization',
    trialDays: 30,
    features: [
      { name: 'AI Receptionist', included: true },
      { name: 'Advanced Voice Interactions', included: true },
      { name: 'Appointment Scheduling', included: true },
      { name: 'Call Recording', included: true, value: 'Unlimited' },
      { name: 'Advanced Analytics', included: true },
      { name: 'Full CRM Integration', included: true },
      { name: 'Advanced Voice Cloning', included: true },
      { name: 'Video Avatar Creation', included: true, value: 'Unlimited' },
      { name: 'Multi-language Support', included: true, value: 'All languages' },
      { name: 'Custom Workflows', included: true },
    ]
  }
];

export const products: Product[] = [
  {
    id: 'hodos',
    name: 'HODOS',
    description: 'Complete AI-powered law firm management system that revolutionizes how you practice law',
    shortDescription: 'AI Law Firm Management',
    category: 'core',
    icon: '⚖️',
    tiers: hodosTiers,
    benefits: [
      'Reduce case management time by 75%',
      'Automate document generation',
      'AI-powered legal research',
      'Streamlined client communications',
      'Real-time case analytics'
    ],
    testimonial: {
      quote: "HODOS transformed our practice. We're handling 3x more cases with the same team size.",
      author: "Sarah Mitchell",
      company: "Mitchell & Associates",
      role: "Managing Partner"
    }
  },
  {
    id: 'marketing',
    name: 'HODOS Marketing Platform',
    description: 'AI-driven SEO and marketing automation designed specifically for law firms',
    shortDescription: 'AI Marketing & SEO',
    category: 'core',
    icon: '🚀',
    tiers: marketingTiers,
    benefits: [
      'Increase online visibility by 400%',
      'Generate quality leads automatically',
      'Content creation at scale',
      'Local SEO optimization',
      'Competitor analysis and insights'
    ],
    testimonial: {
      quote: "Our online leads increased by 300% in just 6 months with HODOS Marketing.",
      author: "David Chen",
      company: "Chen Law Group",
      role: "Senior Partner"
    }
  },
  {
    id: 'video',
    name: 'HODOS Video Agents',
    description: 'Intelligent video and voice AI agents for reception, client intake, and sales',
    shortDescription: 'AI Video & Voice Agents',
    category: 'core',
    icon: '🎬',
    tiers: videoTiers,
    benefits: [
      '24/7 intelligent reception',
      'Automated client intake',
      'Professional video presence',
      'Multi-language support',
      'Seamless CRM integration'
    ],
    testimonial: {
      quote: "The AI receptionist handles 80% of our initial client interactions flawlessly.",
      author: "Maria Rodriguez",
      company: "Rodriguez Legal",
      role: "Founding Partner"
    }
  }
];

// Utility functions
export function getProductById(id: string): Product | undefined {
  return products.find(product => product.id === id);
}

export function getTierById(productId: string, tierId: string): PricingTier | undefined {
  const product = getProductById(productId);
  return product?.tiers.find(tier => tier.id === tierId);
}

export function calculateAnnualSavings(monthlyPrice: number, annualPrice: number): number {
  return (monthlyPrice * 12) - annualPrice;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Coupon codes
export const coupons = {
  'LAUNCH50': {
    code: 'LAUNCH50',
    discount: 50,
    type: 'percent' as const,
    description: '50% off first 3 months',
    expiresAt: new Date('2024-12-31'),
    applicableProducts: ['hodos', 'marketing', 'video']
  },
  'ANNUAL20': {
    code: 'ANNUAL20',
    discount: 20,
    type: 'percent' as const,
    description: '20% off annual plans',
    expiresAt: new Date('2024-12-31'),
    applicableProducts: ['hodos', 'marketing', 'video'],
    billingPeriod: 'annual' as const
  },
  'NEWCLIENT': {
    code: 'NEWCLIENT',
    discount: 100,
    type: 'fixed' as const,
    description: '$100 off first month',
    expiresAt: new Date('2024-12-31'),
    applicableProducts: ['hodos', 'marketing', 'video']
  }
};

export type CouponCode = keyof typeof coupons;