"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextValue {
  value: string | string[]
  onValueChange: (value: string | string[]) => void
  type: "single" | "multiple"
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null)

interface AccordionProps {
  type?: "single" | "multiple"
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
  className?: string
  children?: React.ReactNode
}

const Accordion = React.forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", value: controlledValue, defaultValue, onValueChange, className, children }, ref) => {
    const [value, setValue] = React.useState<string | string[]>(
      controlledValue ?? defaultValue ?? (type === "single" ? "" : [])
    )

    const contextValue = React.useMemo(
      () => ({
        value: controlledValue ?? value,
        onValueChange: (newValue: string | string[]) => {
          setValue(newValue)
          onValueChange?.(newValue)
        },
        type,
      }),
      [controlledValue, value, onValueChange, type]
    )

    return (
      <AccordionContext.Provider value={contextValue}>
        <div ref={ref} className={className}>
          {children}
        </div>
      </AccordionContext.Provider>
    )
  }
)
Accordion.displayName = "Accordion"

interface AccordionItemContextValue {
  value: string
  isOpen: boolean
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null)

interface AccordionItemProps {
  value: string
  className?: string
  children?: React.ReactNode
}

const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children }, ref) => {
    const context = React.useContext(AccordionContext)
    if (!context) throw new Error("AccordionItem must be used within an Accordion")

    const isOpen = React.useMemo(() => {
      if (context.type === "single") {
        return context.value === value
      }
      return Array.isArray(context.value) && context.value.includes(value)
    }, [context.type, context.value, value])

    const itemContext = React.useMemo(
      () => ({ value, isOpen }),
      [value, isOpen]
    )

    return (
      <AccordionItemContext.Provider value={itemContext}>
        <div ref={ref} className={cn("border-b", className)} data-state={isOpen ? "open" : "closed"}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    )
  }
)
AccordionItem.displayName = "AccordionItem"

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string
  children?: React.ReactNode
}

const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const accordionContext = React.useContext(AccordionContext)
    const itemContext = React.useContext(AccordionItemContext)
    
    if (!accordionContext || !itemContext) {
      throw new Error("AccordionTrigger must be used within an AccordionItem")
    }

    const handleClick = () => {
      if (accordionContext.type === "single") {
        accordionContext.onValueChange(itemContext.isOpen ? "" : itemContext.value)
      } else {
        const currentValue = accordionContext.value as string[]
        if (itemContext.isOpen) {
          accordionContext.onValueChange(currentValue.filter(v => v !== itemContext.value))
        } else {
          accordionContext.onValueChange([...currentValue, itemContext.value])
        }
      }
    }

    return (
      <div className="flex">
        <button
          ref={ref}
          type="button"
          className={cn(
            "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
            className
          )}
          data-state={itemContext.isOpen ? "open" : "closed"}
          onClick={handleClick}
          {...props}
        >
          {children}
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
        </button>
      </div>
    )
  }
)
AccordionTrigger.displayName = "AccordionTrigger"

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  children?: React.ReactNode
}

const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const itemContext = React.useContext(AccordionItemContext)
    
    if (!itemContext) {
      throw new Error("AccordionContent must be used within an AccordionItem")
    }

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden text-sm transition-all",
          itemContext.isOpen ? "animate-accordion-down" : "animate-accordion-up"
        )}
        data-state={itemContext.isOpen ? "open" : "closed"}
        style={{
          display: itemContext.isOpen ? "block" : "none"
        }}
        {...props}
      >
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </div>
    )
  }
)
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }