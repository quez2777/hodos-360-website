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
                  className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="h-5 w-5 text-primary mt-1" />
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
        <Link href="/products" className="flex items-center text-sm text-primary hover:underline">
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
                  "block rounded-md px-3 py-2 text-base font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={onClose}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Mobile Products Section */}
            <div className="border-t pt-2 mt-2">
              <p className="px-3 py-2 text-sm font-semibold text-muted-foreground">
                Products
              </p>
              {Object.values(PRODUCTS).map((product) => {
                const Icon = productIcons[product.icon as keyof typeof productIcons]
                return (
                  <Link
                    key={product.id}
                    href={product.href}
                    className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                    onClick={onClose}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <span>{product.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* Mobile CTA */}
            <div className="border-t pt-4 mt-4">
              <Link href="/demo" onClick={onClose}>
                <Button variant="ai" size="lg" fullWidth>
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo with optimized loading */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/images/hodos-logo.svg"
              alt="HODOS 360"
              width={150}
              height={40}
              className="h-10 w-auto"
              priority
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjQwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iNDAiIGZpbGw9IiNlNWU3ZWIiLz48L3N2Zz4="
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:space-x-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Products</NavigationMenuTrigger>
                  <DesktopProductMenu />
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/solutions" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Solutions
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/about" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      About
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/resources" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Resources
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <Link href="/contact" legacyBehavior passHref>
                    <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                      Contact
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

            {/* CTA Button */}
            <div className="hidden lg:block">
              <Link href="/demo">
                <Button variant="ai" size="lg">
                  {CTA.primary}
                </Button>
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
    </header>
  )
})

Navigation.displayName = 'Navigation'

export { Navigation }