import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const gradientTextVariants = cva(
  "bg-clip-text text-transparent font-bold",
  {
    variants: {
      variant: {
        lapis: "bg-gradient-to-r from-primary-900 to-primary-600",
        gold: "bg-gradient-to-r from-yellow-400 to-amber-500",
        lapisGold: "bg-gradient-to-r from-primary-900 via-primary-600 to-amber-500",
        radial: "bg-gradient-to-br from-primary-900 via-primary-600 to-primary-400",
        shine: "bg-gradient-to-r from-primary-900 via-white to-primary-900 bg-[length:200%_auto] animate-gradient-shift",
      },
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
        "2xl": "text-2xl",
        "3xl": "text-3xl",
        "4xl": "text-4xl",
        "5xl": "text-5xl",
        "6xl": "text-6xl",
        "7xl": "text-7xl",
      },
    },
    defaultVariants: {
      variant: "lapis",
      size: "md",
    },
  }
)

export interface GradientTextProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof gradientTextVariants> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span"
}

const GradientText = React.forwardRef<HTMLElement, GradientTextProps>(
  ({ className, variant, size, as: Component = "span", ...props }, ref) => {
    return (
      <Component
        ref={ref as any}
        className={cn(gradientTextVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
GradientText.displayName = "GradientText"

export { GradientText, gradientTextVariants }