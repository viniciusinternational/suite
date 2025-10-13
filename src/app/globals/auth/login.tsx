import { Shield, Loader2 } from "lucide-react";
import { useAuthStore } from "../../../store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

const Login = () => {
    const { zitadel } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSSOLogin = async () => {
        if (zitadel) {
            try {
                setIsLoading(true);
                setError(null);
                await zitadel?.authorize();      
            } catch (error) {
                setError("Authentication failed. Please try again.");
                console.error("Error during authorization:", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setError("Authentication service not available");
            console.error("Zitadel not initialized");
        }
    };

    return (
        <Card className="shadow-lg">
            <CardHeader className="text-center pb-4">
                <div className="mx-auto w-10 h-10 bg-primary rounded-lg flex items-center justify-center mb-3">
                    <Shield className="h-5 w-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-xl font-semibold">
                    Sign in to ViniSuite
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                    Access your project management workspace
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {error && (
                    <Alert variant="destructive" className="text-xs">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* SSO Button */}
                <Button 
                    onClick={handleSSOLogin}
                    className="w-full h-11"
                    disabled={!zitadel || isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Shield className="h-4 w-4 mr-2" />
                            Continue with SSO
                        </>
                    )}
                </Button>

                {!zitadel && !error && (
                    <Alert variant="destructive" className="text-xs">
                        <AlertDescription>
                            Authentication service not available
                        </AlertDescription>
                    </Alert>
                )}

                {/* Terms */}
                <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                        By signing in, you agree to our{" "}
                        <a href="#" className="text-primary hover:underline">
                            Terms
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-primary hover:underline">
                            Privacy
                        </a>
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};

export default Login;
