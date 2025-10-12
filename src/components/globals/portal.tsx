import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface EmailPortalProps {
  children: React.ReactNode
  isOpen: boolean
  className?: string
}

export function EmailPortal({
  children,
  isOpen,
  className,
}: EmailPortalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  React.useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when email portal is open
      document.body.style.overflow = 'hidden'
    } else {
      // Restore body scroll when email portal is closed
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])


  if (!mounted || !isOpen) {
    return null
  }


  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 to-slate-100",
        className
      )}
    >
      <div className="h-full overflow-hidden bg-gradient-to-br from-white to-slate-50">
        {children}
      </div>
    </div>,
    document.body
  )
}
