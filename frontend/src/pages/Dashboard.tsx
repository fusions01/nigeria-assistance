import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetUserMoneyRequests } from "../hooks/useQueries";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG, formatTimestamp, formatNGN } from "../lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  ArrowDownCircle,
  History,
  User,
  Clock,
  CheckCircle2,
  Wallet,
  TrendingUp,
} from "lucide-react";

function getSessionInfo() {
  try {
    const emailAuth = sessionStorage.getItem("emailAuth");
    const isLoggedIn = sessionStorage.getItem("isLoggedIn");
    const userSession = sessionStorage.getItem("userSession");

    if (emailAuth && emailAuth !== "null" && emailAuth !== "") {
      try {
        const parsed = JSON.parse(emailAuth);
        return { loggedIn: true, email: parsed.email || "" };
      } catch {
        return { loggedIn: true, email: "" };
      }
    }
    if (isLoggedIn === "true") return { loggedIn: true, email: "" };
    if (userSession && userSession !== "null" && userSession !== "") {
      try {
        const parsed = JSON.parse(userSession);
        return { loggedIn: true, email: parsed.email || "" };
      } catch {
        return { loggedIn: true, email: "" };
      }
    }
    return { loggedIn: false, email: "" };
  } catch {
    return { loggedIn: false, email: "" };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [sessionInfo] = useState(getSessionInfo);

  const isAuthenticated = !!identity || sessionInfo.loggedIn;

  // Get user principal for queries
  const userPrincipal = identity?.getPrincipal().toString();

  const {
    data: moneyRequests,
    isLoading: requestsLoading,
    error: requestsError,
  } = useGetUserMoneyRequests(userPrincipal);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  const displayName = (() => {
    try {
      const session = sessionStorage.getItem("userSession");
      if (session) {
        const parsed = JSON.parse(session);
        return parsed.displayName || parsed.email || "User";
      }
    } catch {
      // ignore
    }
    return identity ? "User" : "User";
  })();

  const errorMessage = requestsError
    ? isCanisterStoppedError(requestsError)
      ? SERVICE_UNAVAILABLE_MSG
      : (requestsError as Error).message || "Failed to load requests"
    : null;

  const pendingCount = moneyRequests?.filter((r) => r.status === "pending").length ?? 0;
  const fulfilledCount = moneyRequests?.filter((r) => r.status === "fulfilled").length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {displayName}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage your money requests and transactions
        </p>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Quick action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Link to="/request-money">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20 hover:border-primary/50 group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ArrowDownCircle className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Request Money</p>
                <p className="text-sm text-muted-foreground">Submit a new request</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/transactions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-secondary/50 flex items-center justify-center group-hover:bg-secondary transition-colors">
                <History className="w-6 h-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Transaction History</p>
                <p className="text-sm text-muted-foreground">View past transactions</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-12 h-12 rounded-xl bg-accent/50 flex items-center justify-center group-hover:bg-accent transition-colors">
                <User className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">My Profile</p>
                <p className="text-sm text-muted-foreground">View your details</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">
                  {requestsLoading ? <Skeleton className="h-8 w-12" /> : (moneyRequests?.length ?? 0)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-primary opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {requestsLoading ? <Skeleton className="h-8 w-12" /> : pendingCount}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fulfilled</p>
                <p className="text-2xl font-bold text-foreground">
                  {requestsLoading ? <Skeleton className="h-8 w-12" /> : fulfilledCount}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Money Requests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>My Money Requests</CardTitle>
              <CardDescription>Your submitted requests and their statuses</CardDescription>
            </div>
            <Button asChild size="sm">
              <Link to="/request-money">
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                New Request
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !userPrincipal ? (
            <div className="text-center py-8 text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Connect with Internet Identity to view requests</p>
              <p className="text-sm mt-1">
                Email/password users: your requests are linked to your Internet Identity principal.
              </p>
            </div>
          ) : moneyRequests && moneyRequests.length > 0 ? (
            <div className="space-y-3">
              {moneyRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{request.reason}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.bank} • {request.accountNumber} • {formatTimestamp(request.timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <span className="font-semibold text-foreground">
                      {formatNGN(Number(request.amountNeeded))}
                    </span>
                    <Badge
                      variant={request.status === "fulfilled" ? "default" : "secondary"}
                      className={
                        request.status === "fulfilled"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }
                    >
                      {request.status === "fulfilled" ? (
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {request.status === "fulfilled" ? "Fulfilled" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowDownCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No money requests yet</p>
              <p className="text-sm mt-1">Submit your first request to get started</p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/request-money">Request Money</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
