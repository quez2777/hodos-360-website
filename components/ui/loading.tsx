import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

const loadingVariants = cva(
  "animate-spin",
  {
    variants: {
      variant: {
        default: "text-primary-600",
        gold: "text-amber-500",
        gradient: "text-primary-600 [&>*]:fill-amber-500",
      },
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "gold",
      size: "md",
    },
  }
)

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
  fullScreen?: boolean
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, variant, size, text, fullScreen = false, ...props }, ref) => {
    const content = (
      <div ref={ref} className={cn("flex flex-col items-center gap-4", className)} {...props}>
        <Loader2 className={cn(loadingVariants({ variant, size }))} />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    )

    if (fullScreen) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          {content}
        </div>
      )
    }

    return content
  }
)
Loading.displayName = "Loading"

// Circular loading indicator with gradient border
export const CircularLoading = React.forwardRef<
  HTMLDivElement,
  { size?: number; strokeWidth?: number }
>(({ size = 40, strokeWidth = 4 }, ref) => {
  return (
    <div ref={ref} className="relative" style={{ width: size, height: size }}>
      <svg
        className="animate-spin"
        viewBox="0 0 50 50"
        style={{ width: size, height: size }}
      >
        <defs>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#goldGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray="80 20"
          strokeLinecap="round"
          className="origin-center"
        />
      </svg>
    </div>
  )
})
CircularLoading.displayName = "CircularLoading"

// Skeleton loader with gradient animation
export const SkeletonLoading = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        "before:animate-shimmer",
        className
      )}
      {...props}
    />
  )
})
SkeletonLoading.displayName = "SkeletonLoading"

export { Loading, loadingVariants }