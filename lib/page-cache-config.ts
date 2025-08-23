// Comprehensive page caching configuration for Next.js App Router

// Types for page configuration
export interface PageCacheConfig {
  revalidate?: number | false
  dynamic?: 'auto' | 'force-dynamic' | 'error' | 'force-static'
  dynamicParams?: boolean
  fetchCache?: 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store'
  runtime?: 'nodejs' | 'edge'
  preferredRegion?: string | string[]
}

// Page-specific cache configurations
export const pageCacheConfigs: Record<string, PageCacheConfig> = {
  // Homepage - revalidate every hour
  home: {
    revalidate: 3600,
    dynamic: 'force-static',
    runtime: 'edge',
  },
  
  // Product pages - revalidate every 2 hours
  products: {
    revalidate: 7200,
    dynamic: 'force-static',
    runtime: 'edge',
  },
  
  // About page - revalidate daily
  about: {
    revalidate: 86400,
    dynamic: 'force-static',
    runtime: 'edge',
  },
  
  // Pricing page - revalidate every hour
  pricing: {
    revalidate: 3600,
    dynamic: 'force-static',
    runtime: 'edge',
  },
  
  // Contact page - always dynamic (form submissions)
  contact: {
    revalidate: false,
    dynamic: 'force-dynamic',
    runtime: 'nodejs',
  },
  
  // Blog posts - revalidate every 30 minutes
  blog: {
    revalidate: 1800,
    dynamic: 'force-static',
    dynamicParams: true,
    runtime: 'edge',
  },
  
  // Dashboard - always dynamic (user-specific)
  dashboard: {
    revalidate: false,
    dynamic: 'force-dynamic',
    runtime: 'nodejs',
  },
}

// Helper to get config for a specific page
export function getPageCacheConfig(pageName: string): PageCacheConfig {
  return pageCacheConfigs[pageName] || {
    revalidate: 3600, // Default 1 hour
    dynamic: 'auto',
    runtime: 'nodejs',
  }
}

// Generate static params for dynamic routes
export async function generateStaticParams(type: 'products' | 'blog') {
  switch (type) {
    case 'products':
      return [
        { slug: 'hodos' },
        { slug: 'marketing' },
        { slug: 'video-agents' },
      ]
    case 'blog':
      // This would typically fetch from a CMS or database
      return [
        { slug: 'ai-transformation-legal-industry' },
        { slug: 'reduce-overhead-ai-law-firm' },
        { slug: 'future-legal-tech-2024' },
      ]
    default:
      return []
  }
}

// Fetch configuration for data fetching in pages
export const fetchConfig = {
  // Static data that rarely changes
  static: {
    cache: 'force-cache' as const,
    next: { revalidate: 86400 }, // 24 hours
  },
  
  // Semi-dynamic data
  revalidating: {
    cache: 'default-cache' as const,
    next: { revalidate: 3600 }, // 1 hour
  },
  
  // Frequently changing data
  dynamic: {
    cache: 'no-store' as const,
  },
  
  // User-specific data
  authenticated: {
    cache: 'no-store' as const,
    credentials: 'include' as const,
  },
}

// Example usage in a page:
/*
// app/products/[slug]/page.tsx
import { getPageCacheConfig, generateStaticParams as genParams } from '@/lib/page-cache-config'

const config = getPageCacheConfig('products')
export const revalidate = config.revalidate
export const dynamic = config.dynamic
export const runtime = config.runtime

export async function generateStaticParams() {
  return genParams('products')
}
*/