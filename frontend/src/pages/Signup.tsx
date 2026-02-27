import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useActor } from "../hooks/useActor";
import { useRegisterUserProfile } from "../hooks/useQueries";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG, detectDeviceType } from "../lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertCircle, CheckCircle2, Wallet, User, Phone, Mail } from "lucide-react";
import PhoneVerification from "../components/PhoneVerification";
import EmailVerification from "../components/EmailVerification";

type Step = "phone" | "details" | "email" | "done";

export default function Signup() {
  const navigate = useNavigate();
  const { actor } = useActor();
  const registerMutation = useRegisterUserProfile();

  const [step, setStep] = useState<Step>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneVerified = (phone: string) => {
    setPhoneNumber(phone);
    setStep("details");
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password) {
      setError("Please enter a password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setStep("email");
  };

  const handleEmailVerified = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      if (!actor) {
        setError("Connecting to service... Please wait a moment and try again.");
        setIsSubmitting(false);
        return;
      }

      const name = displayName.trim() || email.split("@")[0];
      const deviceType = detectDeviceType();

      await registerMutation.mutateAsync({
        displayName: name,
        phoneNumber: phoneNumber || "",
        identityAnchor: BigInt(0),
        email: email.trim(),
        password: password,
        deviceType,
      });

      // Set session storage
      sessionStorage.setItem("emailAuth", JSON.stringify({ email: email.trim(), loggedIn: true }));
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("userSession", JSON.stringify({ email: email.trim(), displayName: name }));
      sessionStorage.setItem("currentUserEmail", email.trim());

      setStep("done");

      // Navigate after short delay to show success
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    } catch (err) {
      if (isCanisterStoppedError(err)) {
        setError(SERVICE_UNAVAILABLE_MSG);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg || "Registration failed. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepNumber = { phone: 1, details: 2, email: 3, done: 4 };
  const currentStep = stepNumber[step];

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background to-muted/30">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Wallet className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-1">Join NigeriaPay today</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  currentStep > s
                    ? "bg-primary text-primary-foreground"
                    : currentStep === s
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > s ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 h-0.5 transition-colors ${
                    currentStep > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="shadow-card">
          {/* Step 1: Phone Verification */}
          {step === "phone" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <CardTitle>Verify Phone Number</CardTitle>
                </div>
                <CardDescription>
                  Enter your Nigerian phone number to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhoneVerification onVerified={handlePhoneVerified} />
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  Don't have a Nigerian number?{" "}
                  <button
                    onClick={() => {
                      setPhoneNumber("");
                      setStep("details");
                    }}
                    className="text-primary hover:underline"
                  >
                    Skip this step
                  </button>
                </p>
              </CardContent>
            </>
          )}

          {/* Step 2: Personal Details */}
          {step === "details" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle>Personal Details</CardTitle>
                </div>
                <CardDescription>
                  Fill in your account information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDetailsSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="displayName">Full Name</Label>
                    <Input
                      id="displayName"
                      placeholder="John Doe"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupEmail">Email Address</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signupPassword">Password</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Continue to Email Verification
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep("phone")}
                    className="w-full text-sm text-muted-foreground hover:text-foreground text-center"
                  >
                    ← Back
                  </button>
                </form>
              </CardContent>
            </>
          )}

          {/* Step 3: Email Verification */}
          {step === "email" && (
            <>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <CardTitle>Verify Email</CardTitle>
                </div>
                <CardDescription>
                  We'll send a verification code to {email}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {isSubmitting && (
                  <div className="flex items-center justify-center gap-2 py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Creating your account...</span>
                  </div>
                )}
                {!isSubmitting && (
                  <EmailVerification
                    email={email}
                    onVerified={handleEmailVerified}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="w-full text-sm text-muted-foreground hover:text-foreground text-center mt-4"
                  disabled={isSubmitting}
                >
                  ← Back
                </button>
              </CardContent>
            </>
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <>
              <CardHeader>
                <CardTitle className="text-center">Account Created! 🎉</CardTitle>
                <CardDescription className="text-center">
                  Welcome to NigeriaPay! Redirecting to your dashboard...
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4 py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-primary" />
                </div>
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </CardContent>
            </>
          )}
        </Card>

        {step !== "done" && (
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
