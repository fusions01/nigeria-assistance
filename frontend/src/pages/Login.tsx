import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useActor } from "../hooks/useActor";
import { useLoginWithEmail, useRecordLoginByEmail } from "../hooks/useQueries";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG, detectDeviceType } from "../lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, Mail, Phone, Wallet } from "lucide-react";
import PhoneVerification from "../components/PhoneVerification";

export default function Login() {
  const navigate = useNavigate();
  const { actor } = useActor();

  // Email/password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const loginWithEmailMutation = useLoginWithEmail();
  const recordLoginByEmailMutation = useRecordLoginByEmail();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailLoading(true);

    try {
      if (!actor) {
        setEmailError("Connecting to service... Please wait a moment and try again.");
        setEmailLoading(false);
        return;
      }

      const profile = await loginWithEmailMutation.mutateAsync({ email, password });

      if (!profile) {
        setEmailError("Invalid email or password. Please check your credentials and try again.");
        setEmailLoading(false);
        return;
      }

      // Set session storage keys
      sessionStorage.setItem("emailAuth", JSON.stringify({ email, loggedIn: true }));
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userSession", JSON.stringify({ email, displayName: profile.displayName }));
      sessionStorage.setItem("currentUserEmail", email);

      // Record login in background (don't block navigation)
      try {
        await recordLoginByEmailMutation.mutateAsync({
          email,
          deviceType: detectDeviceType(),
        });
      } catch {
        // Non-critical, ignore
      }

      navigate({ to: "/dashboard" });
    } catch (err) {
      if (isCanisterStoppedError(err)) {
        setEmailError(SERVICE_UNAVAILABLE_MSG);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("password")) {
          setEmailError("Invalid email or password.");
        } else {
          setEmailError(SERVICE_UNAVAILABLE_MSG);
        }
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePhoneLoginSuccess = () => {
    sessionStorage.setItem("isLoggedIn", "true");
    sessionStorage.setItem("userSession", JSON.stringify({ phoneLogin: true }));
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your NigeriaPay account</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>Choose your preferred login method</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone OTP
                </TabsTrigger>
              </TabsList>

              {/* Email/Password Tab */}
              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  {emailError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{emailError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={emailLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={emailLoading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={emailLoading || !email || !password}
                  >
                    {emailLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Phone OTP Tab */}
              <TabsContent value="phone">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter your Nigerian phone number to receive a one-time password.
                  </p>
                  <PhoneVerification onVerified={handlePhoneLoginSuccess} />
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
