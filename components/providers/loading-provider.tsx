"use client"

import React, { useEffect, useState } from "react"
import { LoadingScreen } from "@/components/ui/loading-screen"

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate initial load time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 3500) // Slightly longer than the loading animation

    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      {isLoading && <LoadingScreen />}
      <div className={isLoading ? "opacity-0" : "opacity-100 transition-opacity duration-800"}>
        {children}
      </div>
    </>
  )
}