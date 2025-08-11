import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Custom modal implementation without transparency
interface AppModalProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const AppModal: React.FC<AppModalProps> = ({ open = false, onOpenChange, children }) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', // Dark overlay
        backdropFilter: 'none'
      }}
      onClick={() => onOpenChange?.(false)}
    >
      {children}
    </div>
  )
}

interface AppModalTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  onClick?: () => void
}

const AppModalTrigger: React.FC<AppModalTriggerProps> = ({ children, onClick, asChild = false }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...children.props,
      onClick: (e: any) => {
        children.props.onClick?.(e)
        onClick?.()
      }
    })
  }
  
  return (
    <button onClick={onClick}>
      {children}
    </button>
  )
}

interface AppModalContentProps {
  children: React.ReactNode
  title?: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
  className?: string
}

const AppModalContent: React.FC<AppModalContentProps> = ({ 
  children, 
  title, 
  description, 
  maxWidth = 'lg', 
  className 
}) => {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl'
  }

  return (
    <div
      className={cn(
        "relative w-full grid gap-4 rounded-xl shadow-2xl",
        maxWidthClasses[maxWidth],
        className
      )}
      style={{ 
        backgroundColor: '#ffffff',
        border: '2px solid #f1f5f9',
        padding: '0'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {(title || description) && (
        <div 
          className="p-6 pb-4 rounded-t-xl" 
          style={{ backgroundColor: '#fdf2f8', borderBottom: '1px solid #f1f5f9' }}
        >
          {title && (
            <h2 
              className="text-xl font-bold mb-2" 
              style={{ color: '#000000' }}
            >
              {title}
            </h2>
          )}
          {description && (
            <p 
              className="text-base font-medium" 
              style={{ color: '#374151' }}
            >
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="p-6" style={{ backgroundColor: '#ffffff' }}>
        {children}
      </div>
    </div>
  )
}

const AppModalClose: React.FC<{ 
  children: React.ReactNode
  onClick?: () => void
  className?: string
}> = ({ children, onClick, className }) => (
  <button 
    onClick={onClick}
    className={cn("absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", className)}
    style={{ color: '#000000' }}
  >
    {children}
    <span className="sr-only">Close</span>
  </button>
)

// Field component for consistent form styling
interface AppModalFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

const AppModalField: React.FC<AppModalFieldProps> = ({ label, required = false, children, className }) => (
  <div className={cn("space-y-2", className)}>
    <label 
      className="text-sm font-bold block" 
      style={{ color: '#000000' }}
    >
      {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
    </label>
    {children}
  </div>
)

// Actions container for buttons
interface AppModalActionsProps {
  children: React.ReactNode
  className?: string
}

const AppModalActions: React.FC<AppModalActionsProps> = ({ children, className }) => (
  <div className={cn("flex justify-end space-x-2 pt-4", className)}>
    {children}
  </div>
)

// Pre-styled Input component
interface AppModalInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const AppModalInput: React.FC<AppModalInputProps> = ({ className, ...props }) => (
  <input
    className={cn(
      "w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500",
      className
    )}
    style={{ 
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '2px solid #e2e8f0'
    }}
    {...props}
  />
)

// Pre-styled Textarea component
interface AppModalTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const AppModalTextarea: React.FC<AppModalTextareaProps> = ({ className, ...props }) => (
  <textarea
    className={cn(
      "w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none",
      className
    )}
    style={{ 
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '2px solid #e2e8f0'
    }}
    {...props}
  />
)

// Pre-styled Button component
interface AppModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'primary' | 'destructive'
  children: React.ReactNode
}

const AppModalButton: React.FC<AppModalButtonProps> = ({ 
  variant = 'default', 
  children, 
  className,
  ...props 
}) => {
  const baseStyles = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors"
  
  const variantStyles = {
    default: { backgroundColor: '#f1f5f9', color: '#000000', border: '2px solid #e2e8f0' },
    outline: { backgroundColor: '#ffffff', color: '#000000', border: '2px solid #e2e8f0' },
    primary: { backgroundColor: '#e11d48', color: '#ffffff', border: 'none' },
    destructive: { backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }
  }

  return (
    <button
      className={cn(baseStyles, className)}
      style={variantStyles[variant]}
      {...props}
    >
      {children}
    </button>
  )
}

// Pre-styled Select components for consistent styling
interface AppModalSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
  'data-testid'?: string
}

const AppModalSelect: React.FC<AppModalSelectProps> = ({ 
  value, 
  onValueChange, 
  children, 
  className,
  'data-testid': testId,
  ...props 
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
      className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500", className)}
      style={{ 
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #e2e8f0'
      }}
      data-testid={testId}
      {...props}
    >
      {children}
    </select>
  )
}

interface AppModalSelectOptionProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode
}

const AppModalSelectOption: React.FC<AppModalSelectOptionProps> = ({ children, ...props }) => (
  <option
    style={{ 
      backgroundColor: '#ffffff',
      color: '#000000'
    }}
    {...props}
  >
    {children}
  </option>
)

export {
  AppModal,
  AppModalTrigger,
  AppModalContent,
  AppModalClose,
  AppModalField,
  AppModalActions,
  AppModalInput,
  AppModalTextarea,
  AppModalButton,
  AppModalSelect,
  AppModalSelectOption
}