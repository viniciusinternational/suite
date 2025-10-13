import { useEffect, useState, useRef, useCallback } from "react";
// removed unused UserManager import
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, RefreshCw, Home, LogOut } from "lucide-react";
import type { UserRole, BackendUser, User } from "@/types";
import { ApiController } from "../../../axios";
import { BASE_URL_API } from "../../../config";

// Props not used; component is self-contained

const Callback = () => {
    const navigate = useNavigate();
    const { zitadel, isAuthenticated, setAuthenticated, setUser, user, setToken, setRole } = useAuthStore();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasProcessed = useRef(false);
    const apiController = new ApiController(BASE_URL_API,{});

  const getFirstRole = (profile: any): string => {
      const rolesClaim = profile["urn:zitadel:iam:org:project:roles"];
      if (Array.isArray(rolesClaim) && rolesClaim.length > 0) {
          const firstEntry = rolesClaim[0];
          if (firstEntry && typeof firstEntry === "object") {
              const firstKey = Object.keys(firstEntry)[0];
              if (firstKey) return firstKey;
          }
      }
      return "employee";
  };

  const normalizeBackendUser = useCallback(
    (backend: BackendUser, role: UserRole, emailVerified?: boolean): User => {
        console.log("backend", backend);
      const firstName = backend.firstName || "";
      const lastName = backend.lastName || "";
      const otherNames = backend.otherNames || "";
      const fullName = [firstName, otherNames, lastName].filter(Boolean).join(" ").trim();
      const nowIso = new Date().toISOString();

      return {
        id: backend._id || backend._id || "",
            // name: fullName || `${firstName} ${lastName}`.trim() || "Unknown User",
        firstName,
        lastName,
        fullName: fullName || `${firstName} ${lastName}`.trim() || "Unknown User",
        phone: backend.phone || "",
        dob: backend.dob ? String(backend.dob) : "",
        gender: backend.gender || "",
        email: backend.email || "",
        mailAddresses: backend.mailAddresses || [],
        role,
        emailVerified,
        avatar: backend.avatar || "",
        isActive: backend.isActive ?? true,
        createdAt: backend.createdAt || nowIso,
        updatedAt: backend.updatedAt || nowIso,
      };
    },
    []
  );

    const transformOidcUser = useCallback((oidcProfile: any) => {
        const role = getFirstRole(oidcProfile);
        return {
            id: oidcProfile.sub || oidcProfile.id || "",
            fullName: oidcProfile.name || [oidcProfile.given_name, oidcProfile.family_name].filter(Boolean).join(' ') || "Unknown User",
            email: oidcProfile.email || "",
            role,
            emailVerified: oidcProfile.email_verified || false,
        } as any;
    }, []);

    const handleAuthentication = useCallback(async () => {
        if (hasProcessed.current || !zitadel?.userManager) {
            if (!zitadel?.userManager) {
                setError("Authentication service not initialized");
                setIsLoading(false);
            }
            return;
        }

        hasProcessed.current = true;
        setIsLoading(true);
        setError(null);

        try {
            const userobj = await zitadel.userManager.signinRedirectCallback();
            console.log("userobj", userobj);
            if (!userobj) throw new Error("No user information received from authentication provider");
            const backendUser = await apiController.get<BackendUser>(`/zitadel/users/init?userId=${userobj.profile.sub}&email=${userobj.profile.email}`);
            if (userobj) {
                const transformedUser = transformOidcUser(userobj.profile);
                const normalized: User = normalizeBackendUser(backendUser, transformedUser.role as UserRole, transformedUser.emailVerified);
                setRole(normalized.role as unknown as UserRole);
                setAuthenticated(true);
                setUser(normalized);
                setToken(userobj.access_token, userobj.refresh_token || "");

                setTimeout(() => {
                    // window.location.href = "/";
                    navigate("/", { replace: true });
                }, 2000);
            } else {
                throw new Error("No user information received from authentication provider");
            }
        } catch (error: any) {
            try {
                const existingUser = await zitadel?.userManager.getUser();
                if (existingUser) {
                    const backendUser = await apiController.get<BackendUser>(`/zitadel/users/init?userId=${existingUser.profile.sub}&email=${existingUser.profile.email}`);
                    const transformedUser = transformOidcUser(existingUser.profile);
                    const normalized: User = normalizeBackendUser(backendUser, transformedUser.role as UserRole, transformedUser.emailVerified);
                    setAuthenticated(true);
                    setUser(normalized);
                    setRole(normalized.role as unknown as UserRole);

                    setTimeout(() => {
                        navigate("/", { replace: true });
                    }, 1500);
                } else {
                    setError("Authentication failed. Please try again.");
                    setAuthenticated(false);
                }
            } catch (secondError: any) {
                console.error('secondError', secondError);
                setError("Authentication failed. Please try again.");
                setAuthenticated(false);
            }
        } finally {
            setIsLoading(false);
        }
    }, [zitadel, transformOidcUser, setAuthenticated, setUser, setToken, navigate]);

    useEffect(() => {
        if (isAuthenticated === true && user) {
            navigate("/", { replace: true });
            return;
        }

        if (isAuthenticated !== true && zitadel && !hasProcessed.current) {
            handleAuthentication();
        }
    }, [isAuthenticated, zitadel, user, navigate, handleAuthentication]);

    const handleRetry = () => {
        setError(null);
        setIsLoading(true);
        navigate("/login", { replace: true });
    };

    const handleGoHome = () => {
        navigate("/", { replace: true });
    };

    if (isLoading) {
        return (
            <Card className="shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                        Completing Authentication
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        Please wait while we verify your credentials...
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-destructive" />
                    </div>
                    <CardTitle className="text-xl font-semibold text-destructive">
                        Authentication Failed
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        {error}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={handleRetry}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleGoHome}
                            className="flex items-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Go Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isAuthenticated === true && user) {
        return (
            <Card className="shadow-lg">
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-xl font-semibold">
                        Welcome, {user.fullName}!
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                        Authentication successful. Redirecting to dashboard...
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <Alert className="text-left">
                        <AlertDescription>
                            <div className="space-y-1">
                                <div className="font-semibold">Profile Information:</div>
                                <div className="text-sm">Name: {user.fullName}</div>
                                <div className="text-sm">Email: {user.email}</div>
                                <div className="text-sm">
                                    Email Verified: {user.emailVerified ? "Yes" : "No"}
                                </div>
                                {user.role && user.role.length > 0 && (
                                    <div className="text-sm">Role: {user.role}</div>
                                )}
                            </div>
                        </AlertDescription>
                    </Alert>

                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={handleGoHome}
                            className="flex items-center gap-2"
                        >
                            <Home className="h-4 w-4" />
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                zitadel?.signout();
                            }}
                            className="flex items-center gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Log out
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Fallback loading state
    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <CardTitle className="text-xl font-semibold">
                    Processing...
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Please wait while we complete your authentication.
                </CardDescription>
            </CardHeader>
        </Card>
    );
};

export default Callback;