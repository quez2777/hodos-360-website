"use client"

import { useEffect, useState } from 'react'
import { cachedFetch } from '@/lib/api-cache'

interface UseCachedDataOptions {
  ttl?: number
  swr?: number
  prefetch?: boolean
}

export function useCachedData<T>(
  url: string,
  options: UseCachedDataOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    let cancelled = false
    
    const fetchData = async () => {
      try {
        setLoading(true)
        const result = await cachedFetch<T>(url, {
          cache: {
            ttl: options.ttl || 300,
            swr: options.swr || 60,
          },
        })
        
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    
    fetchData()
    
    return () => {
      cancelled = true
    }
  }, [url, options.ttl, options.swr])
  
  const refetch = async () => {
    setLoading(true)
    try {
      const result = await cachedFetch<T>(url, {
        cache: {
          ttl: 0, // Force fresh fetch
        },
      })
      setData(result)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  return { data, loading, error, refetch }
}

// Example usage component
export function CachedDataExample() {
  const { data, loading, error } = useCachedData<{ testimonials: any[] }>(
    '/api/data/testimonials',
    { ttl: 600, swr: 300 }
  )
  
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {data?.testimonials.map((testimonial) => (
        <div key={testimonial.id}>{testimonial.content}</div>
      ))}
    </div>
  )
}