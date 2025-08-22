import { MetadataRoute } from 'next'
import { PRODUCTS } from '@/lib/constants'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.hodos360.com'
  
  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/pricing',
    '/products',
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
  
  // Product pages
  const productPages = Object.values(PRODUCTS).map(product => ({
    url: `${baseUrl}${product.href}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))
  
  return [...staticPages, ...productPages]
}