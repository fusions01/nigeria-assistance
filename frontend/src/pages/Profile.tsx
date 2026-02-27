import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG, formatTimestamp } from "../lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, User, Phone, Mail, Calendar, Smartphone, Shield } from "lucide-react";

function isSessionAuthenticated(): boolean {
  try {
    const emailAuth = sessionStorage.getItem("emailAuth");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const userSession = sessionStorage.getItem("userSession");
    if (emailAuth && emailAuth !== "null" && emailAuth !== "") return true;
    if (isLoggedIn === "true") return true;
    if (userSession && userSession !== "null" && userSession !== "") return true;
    return false;
  } catch {
    return false;
  }
}

export default function Profile() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [sessionAuth] = useState(isSessionAuthenticated);

  const isAuthenticated = !!identity || sessionAuth;

  const { data: profile, isLoading, error, isFetched } = useGetCallerUserProfile();

  if (!isAuthenticated) {
    navigate({ to: "/login" });
    return null;
  }

  const errorMessage = error
    ? isCanisterStoppedError(error)
      ? SERVICE_UNAVAILABLE_MSG
      : (error as Error).message || "Failed to load profile"
    : null;

  // Try to get display info from session if profile not loaded
  const sessionDisplayName = (() => {
    try {
      const session = sessionStorage.getItem("userSession");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.displayName || parsed.email || null;
      }
    } catch {
      // ignore
    }
    return null;
  })();

  const sessionEmail = (() => {
    try {
      return sessionStorage.getItem("currentUserEmail") || null;
    } catch {
      return null;
    }
  })();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-1">Your account information</p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : profile ? (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle>{profile.displayName || "User"}</CardTitle>
                <CardDescription>{profile.email || "No email on file"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Display Name */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <User className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Display Name</p>
                <p className="text-foreground font-medium">{profile.displayName || "—"}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Phone Number</p>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">{profile.phoneNumber || "—"}</p>
                  {profile.phoneNumber && (
                    <Badge
                      variant={profile.phoneVerified ? "default" : "secondary"}
                      className={profile.phoneVerified ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
                    >
                      {profile.phoneVerified ? "Verified" : "Unverified"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Email Address</p>
                <div className="flex items-center gap-2">
                  <p className="text-foreground font-medium">{profile.email || "—"}</p>
                  {profile.email && (
                    <Badge
                      variant={profile.emailVerified ? "default" : "secondary"}
                      className={profile.emailVerified ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}
                    >
                      {profile.emailVerified ? "Verified" : "Unverified"}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Registration Date */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Registration Date</p>
                <p className="text-foreground font-medium">{formatTimestamp(profile.registrationTimestamp)}</p>
              </div>
            </div>

            {/* Last Login */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Last Login</p>
                <p className="text-foreground font-medium">{formatTimestamp(profile.lastLoginTimestamp)}</p>
              </div>
            </div>

            {/* Device Type */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Smartphone className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Device Type</p>
                <p className="text-foreground font-medium capitalize">{profile.deviceType || "—"}</p>
              </div>
            </div>

            {/* Principal */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <Shield className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Principal ID</p>
                <p className="text-foreground font-mono text-xs break-all">{profile.principal || "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : isFetched && !profile ? (
        // Profile not found but session exists — show session info
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div>
                <CardTitle>{sessionDisplayName || "User"}</CardTitle>
                <CardDescription>{sessionEmail || "Logged in via session"}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {sessionEmail && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Email Address</p>
                  <p className="text-foreground font-medium">{sessionEmail}</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Full profile details will appear after your next login with Internet Identity.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
