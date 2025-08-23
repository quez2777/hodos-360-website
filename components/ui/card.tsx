import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const cardVariants = cva(
  "rounded-xl transition-all duration-300 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground shadow-md hover:shadow-xl border border-border",
        glass: "glass border border-white/10 shadow-glass hover:shadow-ai-glow backdrop-blur-lg",
        gradient: "bg-gradient-to-br from-primary-900/10 via-transparent to-primary-600/10 border-2 border-transparent before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-primary-900 before:to-primary-600 before:-z-10 hover:from-primary-900/20 hover:to-primary-600/20",
        elevated: "bg-card shadow-xl hover:shadow-2xl hover:-translate-y-1",
        outline: "border-2 border-transparent bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-padding before:absolute before:inset-0 before:rounded-xl before:bg-card before:-z-10 before:m-[2px] hover:shadow-lg",
        goldAccent: "bg-card border-2 border-transparent before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-br before:from-yellow-400 before:to-amber-500 before:-z-10 hover:shadow-gold-glow",
        lapisGlow: "bg-gradient-to-br from-primary-900/5 to-primary-600/5 border border-primary-700/20 shadow-lg hover:shadow-ai-glow hover:border-primary-600/40 hover:from-primary-900/10 hover:to-primary-600/10",
      },
      padding: {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
    },
  }
)

export interface CardProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  hover?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover = true, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant, padding }),
        hover && "hover:scale-[1.02]",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-6", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-6", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }