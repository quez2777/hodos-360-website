"use client"

import React, { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

export function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setIsLoading(false), 500)
          return 100
        }
        return prev + 2
      })
    }, 30)

    return () => clearInterval(interval)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0A0F1C]"
        >
          {/* Gold luxury background pattern */}
          <div className="absolute inset-0 opacity-[0.03]">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>

          <div className="relative flex flex-col items-center">
            {/* Logo animation */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="mb-12"
            >
              <motion.div
                animate={{ 
                  rotateY: [0, 360],
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{ transformStyle: "preserve-3d" }}
              >
                <Image
                  src="/images/hodos-main-logo.jpg"
                  alt="HODOS"
                  width={180}
                  height={180}
                  className="w-44 h-44 object-contain drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]"
                  priority
                  quality={100}
                />
              </motion.div>
            </motion.div>

            {/* Brand name */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-2xl font-extralight tracking-[0.4em] text-white uppercase">
                HODOS
              </h1>
              <p className="text-xs font-light tracking-[0.3em] text-[#FFD700] uppercase text-center mt-2">
                Quantum Legal Intelligence
              </p>
            </motion.div>

            {/* Progress bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-64"
            >
              <div className="h-[1px] bg-[#1756DB]/20 relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FFD700] to-[#FFA500]"
                  style={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
              <div className="flex justify-between mt-4">
                <span className="text-[10px] font-light tracking-[0.2em] text-white/40 uppercase">
                  Loading Experience
                </span>
                <span className="text-[10px] font-light tracking-wider text-[#FFD700]">
                  {progress}%
                </span>
              </div>
            </motion.div>
          </div>

          {/* Corner ornaments */}
          <div className="absolute top-8 left-8">
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-12 h-12 border-t border-l border-[#FFD700]/30"
            />
          </div>
          <div className="absolute top-8 right-8">
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="w-12 h-12 border-t border-r border-[#FFD700]/30"
            />
          </div>
          <div className="absolute bottom-8 left-8">
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1 }}
              className="w-12 h-12 border-b border-l border-[#FFD700]/30"
            />
          </div>
          <div className="absolute bottom-8 right-8">
            <motion.div
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.1, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="w-12 h-12 border-b border-r border-[#FFD700]/30"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}