import { MetadataRoute } from 'next'
import { PRODUCTS } from '@/lib/constants'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.hodos360.com'
  
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/pricing',
    '/products',
    '/blog',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : route === '/blog' ? 0.9 : 0.8,
  }))
  
  // Product pages
  const productPages = Object.values(PRODUCTS).map(product => ({
    url: `${baseUrl}${product.href}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Blog categories
  const blogCategories = [
    'ai-law-firm-management',
    'legal-marketing-automation', 
    'ai-video-for-law-firms',
    'legal-tech-trends',
    'law-firm-growth'
  ].map(category => ({
    url: `${baseUrl}/blog/category/${category}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Blog posts - In a real app, fetch from API
  // For now, we'll add a few sample posts
  const blogPosts = [
    'ai-revolutionizing-legal-document-review',
    'ultimate-guide-legal-marketing-automation',
    'ai-video-agents-future-client-intake',
    '2024-legal-technology-trends',
    'implementing-ai-case-management-systems'
  ].map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))
  
  return [...staticPages, ...productPages, ...blogCategories, ...blogPosts]
}
