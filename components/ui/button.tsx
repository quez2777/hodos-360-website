import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary-900 to-primary-600 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:from-primary-800 hover:to-primary-500 transition-all duration-300",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 hover:shadow-lg",
        outline:
          "border-2 border-transparent bg-gradient-to-r from-primary-900 to-primary-600 bg-clip-padding relative before:absolute before:inset-0 before:rounded-lg before:bg-white dark:before:bg-dark-primary before:-z-10 before:m-[2px] text-primary-700 dark:text-primary-300 shadow-sm hover:text-white hover:before:opacity-0 transition-all duration-300",
        secondary:
          "bg-gradient-to-br from-yellow-400 to-amber-500 text-dark-primary shadow-md hover:shadow-gold-glow hover:-translate-y-0.5 hover:from-yellow-300 hover:to-amber-400 transition-all duration-300",
        ghost: 
          "text-primary hover:bg-primary/10 hover:text-primary",
        link: 
          "text-primary underline-offset-4 hover:underline",
        ai:
          "bg-gradient-to-r from-primary-900 via-primary-600 to-primary-400 text-white shadow-lg hover:shadow-ai-glow hover:-translate-y-0.5 transition-all duration-300 hover:from-primary-800 hover:via-primary-500 hover:to-primary-300",
        glass:
          "glass text-white border border-white/20 hover:bg-white/10 hover:border-white/30 hover:shadow-glass backdrop-blur-md",
        gradient:
          "bg-gradient-to-r from-primary-900 to-primary-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700",
        gold:
          "bg-gradient-to-br from-yellow-400 via-amber-400 to-amber-500 text-dark-primary shadow-md hover:shadow-gold-glow hover:-translate-y-0.5 transition-all duration-300 font-bold",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    loading = false,
    disabled,
    leftIcon,
    rightIcon,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </>
        )}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }