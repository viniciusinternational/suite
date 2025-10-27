export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        {/* Spinning loader */}
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-4 border-primary/20 animate-spin border-t-primary" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-primary/60 animate-spin [animation-delay:-0.45s]" />
        </div>
        
        {/* Loading text */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">Loading...</p>
          <p className="text-xs text-muted-foreground mt-1">
            Please wait while we fetch your content
          </p>
        </div>
      </div>
      
      {/* Optional: Pulse effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-32 w-32 rounded-full bg-primary/5 animate-ping" />
        </div>
      </div>
    </div>
  )
}

