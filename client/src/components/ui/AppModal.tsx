import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const AppModal = DialogPrimitive.Root

const AppModalTrigger = DialogPrimitive.Trigger

const AppModalPortal = DialogPrimitive.Portal

const AppModalClose = DialogPrimitive.Close

interface AppModalContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title?: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'
}

const AppModalContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AppModalContentProps
>(({ className, children, title, description, maxWidth = 'lg', ...props }, ref) => {
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
    <AppModalPortal>
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-xl shadow-2xl",
          maxWidthClasses[maxWidth],
          className
        )}
        style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #f1f5f9',
          padding: '0'
        }}
        {...props}
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
        
        <div 
          className="p-6 pt-4" 
          style={{ backgroundColor: '#f8fafc' }}
        >
          {children}
        </div>

        <DialogPrimitive.Close 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          style={{ 
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            padding: '8px'
          }}
        >
          <X className="h-4 w-4" style={{ color: '#000000' }} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </AppModalPortal>
  )
})
AppModalContent.displayName = DialogPrimitive.Content.displayName

interface AppModalFieldProps {
  label: string
  required?: boolean
  children: React.ReactNode
}

const AppModalField: React.FC<AppModalFieldProps> = ({ label, required = false, children }) => (
  <div className="space-y-2">
    <label 
      className="text-sm font-bold block" 
      style={{ color: '#000000' }}
    >
      {label}{required && ' *'}
    </label>
    {children}
  </div>
)

interface AppModalActionsProps {
  children: React.ReactNode
  align?: 'left' | 'center' | 'right'
}

const AppModalActions: React.FC<AppModalActionsProps> = ({ children, align = 'right' }) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center', 
    right: 'justify-end'
  }

  return (
    <div className={cn("flex space-x-2 pt-4", alignClasses[align])}>
      {children}
    </div>
  )
}

// Pre-styled form elements for consistent styling
const AppModalInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500", className)}
    style={{ 
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '2px solid #e2e8f0'
    }}
    {...props}
  />
))
AppModalInput.displayName = "AppModalInput"

const AppModalTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn("w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 resize-vertical", className)}
    style={{ 
      backgroundColor: '#ffffff',
      color: '#000000',
      border: '2px solid #e2e8f0'
    }}
    {...props}
  />
))
AppModalTextarea.displayName = "AppModalTextarea"

interface AppModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
}

const AppModalButton = React.forwardRef<HTMLButtonElement, AppModalButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const styles = {
      primary: {
        backgroundColor: '#e11d48',
        color: '#ffffff',
        border: 'none'
      },
      secondary: {
        backgroundColor: '#6b7280',
        color: '#ffffff', 
        border: 'none'
      },
      outline: {
        backgroundColor: '#ffffff',
        color: '#000000',
        border: '2px solid #e2e8f0'
      }
    }

    return (
      <button
        ref={ref}
        className={cn("px-4 py-2 rounded-md font-medium transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-rose-500", className)}
        style={styles[variant]}
        {...props}
      >
        {children}
      </button>
    )
  }
)
AppModalButton.displayName = "AppModalButton"

export {
  AppModal,
  AppModalTrigger,
  AppModalContent,
  AppModalClose,
  AppModalField,
  AppModalActions,
  AppModalInput,
  AppModalTextarea,
  AppModalButton
}