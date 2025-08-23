"use client"

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Only register service worker in production
      if (process.env.NODE_ENV === 'production') {
        window.addEventListener('load', async () => {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
              scope: '/',
            })
            
            console.log('Service Worker registered:', registration)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60000) // Check every minute
            
            // Handle updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available, prompt user to refresh
                    if (window.confirm('New version available! Refresh to update?')) {
                      window.location.reload()
                    }
                  }
                })
              }
            })
          } catch (error) {
            console.error('Service Worker registration failed:', error)
          }
        })
      } else {
        console.log('Service Worker disabled in development')
      }
    }
  }, [])
  
  return null
}