import dynamic from 'next/dynamic'
import type { LucideIcon } from 'lucide-react'

// Type for icon components
type IconComponent = React.ComponentType<React.ComponentProps<LucideIcon>>

// Cache for loaded icons
const iconCache = new Map<string, IconComponent>()

/**
 * Dynamically load Lucide icons to reduce initial bundle size
 * Icons are loaded on-demand and cached for subsequent use
 */
export function dynamicIcon(iconName: string): IconComponent {
  // Check cache first
  if (iconCache.has(iconName)) {
    return iconCache.get(iconName)!
  }

  // Dynamically import the icon
  const DynamicIcon = dynamic<React.ComponentProps<LucideIcon>>(
    () => import('lucide-react')
      .then((mod) => {
        const Icon = (mod as any)[iconName]
        if (!Icon) {
          console.warn(`Icon ${iconName} not found in lucide-react`)
          return mod.HelpCircle // Fallback icon
        }
        return Icon
      })
      .catch(() => {
        console.error(`Failed to load icon: ${iconName}`)
        return import('lucide-react').then(mod => mod.HelpCircle)
      }),
    {
      loading: () => <div className="h-4 w-4 animate-pulse bg-muted rounded" />,
      ssr: false
    }
  )

  // Cache the component
  iconCache.set(iconName, DynamicIcon as IconComponent)
  
  return DynamicIcon as IconComponent
}

// Pre-load commonly used icons
export const preloadIcons = (iconNames: string[]) => {
  iconNames.forEach(iconName => dynamicIcon(iconName))
}