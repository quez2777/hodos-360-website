"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { NAV_LINKS, PRODUCTS, CTA } from "@/lib/constants"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { 
  Menu, 
  X, 
  ChevronRight,
  Building,
  TrendingUp,
  Video,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"
import { motion, AnimatePresence } from "framer-motion"
import { RevealUnderline, MagneticHover, ShimmerHover } from "@/components/animations/luxury-hover"

// Memoize product icons mapping
const productIcons = {
  Building,
  TrendingUp,
  Video,
}

// Memoize desktop menu content
const DesktopProductMenu = React.memo(function DesktopProductMenu() {
  return (
    <NavigationMenuContent>
      <ul className="grid w-[600px] gap-3 p-4 md:grid-cols-2">
        {Object.values(PRODUCTS).map((product) => {
          const Icon = productIcons[product.icon as keyof typeof productIcons]
          return (
            <li key={product.id}>
              <NavigationMenuLink asChild>
                <Link
                  href={product.href}
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-all hover:bg-gold/10 hover:text-gold focus:bg-gold/10 focus:text-gold border border-transparent hover:border-gold/30"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-gold mt-1" />
                    <div className="flex-1">
                      <div className="text-sm font-medium leading-none mb-1">
                        {product.name}
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {product.tagline}
                      </p>
                    </div>
                  </div>
                </Link>
              </NavigationMenuLink>
            </li>
          )
        })}
      </ul>
      <div className="p-4 pt-0">
        <Link href="/products" className="flex items-center text-sm text-gold hover:text-gold-dark transition-colors">
          View all products
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </NavigationMenuContent>
  )
})

// Memoize mobile menu
const MobileMenu = React.memo(function MobileMenu({ 
  isOpen, 
  pathname, 
  onClose 
}: { 
  isOpen: boolean
  pathname: string
  onClose: () => void 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="lg:hidden"
        >
          <div className="space-y-1 pb-4 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-md px-3 py-2 text-base font-medium transition-all",
                  pathname === link.href
                    ? "bg-gold/20 text-gold border border-gold/30"
                    : "text-white/80 hover:bg-gold/10 hover:text-gold border border-transparent hover:border-gold/20"
                )}
                onClick={onClose}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Products Section */}
            <div className="border-t pt-2 mt-2">
              <p className="px-3 py-2 text-sm font-semibold text-gold/70">
                Products
              </p>
              {Object.values(PRODUCTS).map((product) => {
                const Icon = productIcons[product.icon as keyof typeof productIcons]
                return (
                  <Link
                    key={product.id}
                    href={product.href}
                    className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm text-white/80 transition-all hover:bg-gold/10 hover:text-gold border border-transparent hover:border-gold/20"
                    onClick={onClose}
                  >
                    <Icon className="h-4 w-4 text-gold" />
                    <span>{product.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile CTA */}
            <div className="border-t pt-4 mt-4">
              <Link href="/demo" onClick={onClose}>
                <Button className="w-full bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold-darker text-epic-dark font-bold shadow-lg shadow-gold/30">
                  {CTA.primary}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
})

const Navigation = React.memo(function Navigation() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggleTheme = React.useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark")
  }, [theme, setTheme])

  const handleToggleMenu = React.useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleCloseMenu = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
      className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#0A0F1C]/95 border-b border-[#FFD700]/20 shadow-[0_4px_30px_rgba(255,215,0,0.1)]"
    >
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Premium Logo with Magnetic Effect */}
          <MagneticHover strength={0.2}>
            <Link href="/" className="flex items-center space-x-4 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Image
                  src="/images/hodos-main-logo.jpg"
                  alt="HODOS 360 - Artificial Intelligence"
                  width={200}
                  height={80}
                  className="h-12 w-auto"
                  priority
                  quality={100}
                />
              </motion.div>
            </Link>
          </MagneticHover>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "relative text-white hover:text-[#FFD700] transition-colors duration-300"
                    )}>
                      <RevealUnderline color="#FFD700">
                        Home
                      </RevealUnderline>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-white hover:text-[#FFD700] transition-colors duration-300">
                    <RevealUnderline color="#FFD700">
                      Products
                    </RevealUnderline>
                  </NavigationMenuTrigger>
                  <DesktopProductMenu />
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/solutions" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "relative text-white hover:text-[#FFD700] transition-colors duration-300"
                    )}>
                      <RevealUnderline color="#FFD700">
                        Solutions
                      </RevealUnderline>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/about" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "relative text-white hover:text-[#FFD700] transition-colors duration-300"
                    )}>
                      <RevealUnderline color="#FFD700">
                        About
                      </RevealUnderline>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/resources" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "relative text-white hover:text-[#FFD700] transition-colors duration-300"
                    )}>
                      <RevealUnderline color="#FFD700">
                        Resources
                      </RevealUnderline>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/contact" legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                      navigationMenuTriggerStyle(),
                      "relative text-white hover:text-[#FFD700] transition-colors duration-300"
                    )}>
                      <RevealUnderline color="#FFD700">
                        Contact
                      </RevealUnderline>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleTheme}
                className="relative h-9 w-9"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            {/* Luxury CTA Button */}
            <div className="hidden lg:block">
              <Link href="/demo">
                <ShimmerHover>
                  <Button className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FFD700] text-[#0A0F1C] px-8 py-2 text-xs tracking-[0.2em] uppercase font-semibold transition-all duration-500 shadow-[0_0_30px_rgba(255,215,0,0.3)] hover:shadow-[0_0_40px_rgba(255,215,0,0.5)] border border-[#FFD700]">
                    {CTA.primary}
                  </Button>
                </ShimmerHover>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={handleToggleMenu}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Toggle menu</span>
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <MobileMenu 
          isOpen={isOpen} 
          pathname={pathname} 
          onClose={handleCloseMenu}
        />
      </nav>
    </motion.header>
  )
})

Navigation.displayName = 'Navigation'

export { Navigation }