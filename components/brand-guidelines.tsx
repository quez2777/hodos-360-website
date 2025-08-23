'use client'

import React from 'react'
import { motion } from 'framer-motion'

export default function BrandGuidelines() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-dark-primary p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl font-bold text-gradient-lapis mb-12">
            HODOS 360 Brand Guidelines
          </h1>
        </motion.div>

        {/* Logo Usage */}
        <motion.section
          className="mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-8">Logo Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-card p-8">
              <h3 className="text-xl font-medium text-white mb-4">Primary Logo</h3>
              <div className="bg-white rounded-lg p-8 mb-4">
                <img 
                  src="/images/hodos-logo.svg" 
                  alt="HODOS 360 Primary Logo" 
                  className="w-full max-w-[300px] mx-auto"
                />
              </div>
              <p className="text-brand-gray">
                Use on light backgrounds. Maintain clear space equal to the height of the "360" element.
              </p>
            </div>
            
            <div className="glass-card p-8">
              <h3 className="text-xl font-medium text-white mb-4">Light Logo</h3>
              <div className="bg-dark-secondary rounded-lg p-8 mb-4">
                <img 
                  src="/images/hodos-logo-light.svg" 
                  alt="HODOS 360 Light Logo" 
                  className="w-full max-w-[300px] mx-auto"
                />
              </div>
              <p className="text-brand-gray">
                Use on dark backgrounds. Ensure sufficient contrast for visibility.
              </p>
            </div>
          </div>
        </motion.section>

        {/* Color Palette */}
        <motion.section
          className="mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-8">Color Palette</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Lapis Gradient */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-medium text-white mb-4">Lapis Blue Gradient</h3>
              <div className="h-32 rounded-lg bg-lapis-gradient mb-4"></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-gray">Start:</span>
                  <span className="text-white font-mono">#1e3a8a</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">End:</span>
                  <span className="text-white font-mono">#2563eb</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Angle:</span>
                  <span className="text-white font-mono">135deg</span>
                </div>
              </div>
            </div>

            {/* Gold Gradient */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-medium text-white mb-4">Gold Accent Gradient</h3>
              <div className="h-32 rounded-lg bg-gold-gradient mb-4"></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-gray">Start:</span>
                  <span className="text-white font-mono">#fbbf24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">End:</span>
                  <span className="text-white font-mono">#f59e0b</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Angle:</span>
                  <span className="text-white font-mono">135deg</span>
                </div>
              </div>
            </div>

            {/* Brand Gray */}
            <div className="glass-card p-6">
              <h3 className="text-xl font-medium text-white mb-4">Brand Gray</h3>
              <div className="h-32 rounded-lg bg-brand-gray mb-4"></div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-gray">Hex:</span>
                  <span className="text-white font-mono">#64748b</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray">Usage:</span>
                  <span className="text-white">Secondary text</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Typography */}
        <motion.section
          className="mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-8">Typography</h2>
          
          <div className="glass-card p-8">
            <div className="space-y-6">
              <div>
                <p className="text-brand-gray text-sm mb-2">Font Family</p>
                <p className="text-white font-mono text-lg">system-ui, -apple-system, sans-serif</p>
              </div>
              
              <div className="space-y-4">
                <div className="border-b border-gray-700 pb-4">
                  <p className="text-brand-gray text-sm mb-2">Heading 1 - Bold (700)</p>
                  <h1 className="text-4xl font-bold text-gradient-lapis">HODOS 360</h1>
                </div>
                
                <div className="border-b border-gray-700 pb-4">
                  <p className="text-brand-gray text-sm mb-2">Heading 2 - Semibold (600)</p>
                  <h2 className="text-3xl font-semibold text-gradient-gold">AI-Powered Legal Tech</h2>
                </div>
                
                <div className="border-b border-gray-700 pb-4">
                  <p className="text-brand-gray text-sm mb-2">Body Text - Medium (500)</p>
                  <p className="text-lg font-medium text-white">
                    Revolutionary AI solutions for modern law firms
                  </p>
                </div>
                
                <div>
                  <p className="text-brand-gray text-sm mb-2">Supporting Text - Normal (400)</p>
                  <p className="text-base text-brand-gray">
                    Transform your practice with cutting-edge technology
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Gradient Applications */}
        <motion.section
          className="mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-8">Gradient Applications</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Buttons */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-medium text-white mb-6">Buttons</h3>
              <div className="space-y-4">
                <button className="btn-brand-primary px-8 py-3 rounded-lg font-semibold w-full">
                  Primary Button (Lapis)
                </button>
                <button className="btn-brand-accent px-8 py-3 rounded-lg font-semibold w-full">
                  Accent Button (Gold)
                </button>
                <button className="btn-outline px-8 py-3 rounded-lg font-semibold w-full text-white">
                  Outline Button
                </button>
              </div>
            </div>

            {/* Text Effects */}
            <div className="glass-card p-8">
              <h3 className="text-xl font-medium text-white mb-6">Text Effects</h3>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-gradient-lapis">
                  Lapis Gradient Text
                </h4>
                <h4 className="text-2xl font-bold text-gradient-gold">
                  Gold Gradient Text
                </h4>
                <p className="text-lg text-brand-gray">
                  Brand Gray for body text
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Design Elements */}
        <motion.section
          className="mb-16"
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 1.0, duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-8">Design Elements</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Circular Motif */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">Circular Motif</h3>
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-32">
                  <div className="absolute inset-0 rounded-full border-4 border-gold-start"></div>
                  <div className="absolute inset-4 rounded-full bg-gold-gradient opacity-20"></div>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-gradient-gold">
                    360
                  </span>
                </div>
              </div>
              <p className="text-sm text-brand-gray">
                Represents comprehensive 360° solutions
              </p>
            </div>

            {/* Flowing Curves */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">Flowing Curves</h3>
              <div className="flex justify-center mb-4">
                <svg width="128" height="128" viewBox="0 0 128 128">
                  <path
                    d="M 20 64 Q 40 44, 64 64 T 108 64"
                    stroke="url(#goldGradientSvg)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="goldGradientSvg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <p className="text-sm text-brand-gray">
                Symbolizes AI data flow and connectivity
              </p>
            </div>

            {/* Gradient Mesh */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-medium text-white mb-4">AI Mesh Pattern</h3>
              <div className="h-32 rounded-lg tech-grid mb-4"></div>
              <p className="text-sm text-brand-gray">
                Background pattern for tech sections
              </p>
            </div>
          </div>
        </motion.section>

        {/* Usage Examples */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <h2 className="text-3xl font-semibold text-white mb-8">Usage Examples</h2>
          
          <div className="glass-card p-8">
            <h3 className="text-xl font-medium text-white mb-6">Do&apos;s and Don&apos;ts</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-lg font-medium text-green-400 mb-4">✓ Do</h4>
                <ul className="space-y-2 text-brand-gray">
                  <li>• Use gradients at 135° for consistency</li>
                  <li>• Maintain proper contrast ratios</li>
                  <li>• Apply gold accents sparingly for emphasis</li>
                  <li>• Use system fonts for better performance</li>
                  <li>• Keep circular elements proportional</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-red-400 mb-4">✗ Don&apos;t</h4>
                <ul className="space-y-2 text-brand-gray">
                  <li>• Don&apos;t alter gradient colors or angles</li>
                  <li>• Don&apos;t use gradients on small text</li>
                  <li>• Don&apos;t stretch or distort the logo</li>
                  <li>• Don&apos;t use off-brand colors</li>
                  <li>• Don&apos;t overuse animations</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}