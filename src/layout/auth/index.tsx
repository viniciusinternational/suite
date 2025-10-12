import { useAuthStore } from '@/store';
import { Navigate, Outlet } from 'react-router-dom';

export default function AuthLayout() {

  // user if authenticated
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  const currentYear = new Date().getFullYear();

  const handleLogoError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error('Failed to load ViniSuite logo:', e);
    // Fallback to text if image fails to load
    e.currentTarget.style.display = 'none';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Abstract Background Design */}
      <div className="absolute inset-0 -z-10">
        {/* Large logo watermark */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-[0.12]">
          <img 
            src="https://www.viniciusint.com/logo.png" 
            alt="ViniSuite Logo Watermark" 
            className="w-96 h-96 object-contain"
            onError={handleLogoError}
          />
        </div>
        
        {/* Floating geometric shapes with logo-inspired elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary/30 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-secondary/35 rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-accent/30 rounded-full blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-1/3 w-20 h-20 bg-primary/35 rounded-full blur-lg animate-pulse" style={{animationDelay: '0.5s'}}></div>
        
        {/* Logo-inspired decorative elements */}
        <div className="absolute top-1/3 left-1/4 w-16 h-16 bg-primary/25 rounded-lg rotate-45 blur-sm"></div>
        <div className="absolute bottom-1/3 right-1/4 w-12 h-12 bg-secondary/30 rounded-lg -rotate-45 blur-sm"></div>
        
        {/* Additional floating elements for more visual impact */}
        <div className="absolute top-1/4 right-1/3 w-28 h-28 bg-accent/25 rounded-full blur-lg animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute bottom-1/4 left-1/3 w-36 h-36 bg-primary/28 rounded-full blur-xl animate-pulse" style={{animationDelay: '0.8s'}}></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        
        {/* Gradient overlay - reduced opacity for more background visibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/70 to-background/65"></div>
      </div>

      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 z-10">
        <div className="inline-flex items-center gap-2">
          <img 
            src="https://www.viniciusint.com/logo.png" 
            alt="ViniSuite Logo" 
            className="w-8 h-8"
            onError={handleLogoError}
          />
          <h1 className="text-lg font-bold text-foreground">ViniSuite</h1>
        </div>
      </div>

      <div className="w-full max-w-md">
        {/* Auth Form Container */}
        <div className="bg-card rounded-2xl shadow-xl border">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            © {currentYear} ViniSuite. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
