import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetTransactionHistory } from "../hooks/useQueries";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG, formatTimestamp, formatNGN } from "../lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle, History, CheckCircle2, XCircle, Clock, ArrowDownCircle } from "lucide-react";

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

export default function TransactionHistory() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const [sessionAuth] = useState(isSessionAuthenticated);

  const isAuthenticated = !!identity || sessionAuth;
  const userPrincipal = identity?.getPrincipal().toString();

  const {
    data: transactions,
    isLoading,
    error,
  } = useGetTransactionHistory(userPrincipal);

  if (!isAuthenticated) {
    navigate({ to: "/login" });
    return null;
  }

  const errorMessage = error
    ? isCanisterStoppedError(error)
      ? SERVICE_UNAVAILABLE_MSG
      : (error as Error).message || "Failed to load transactions"
    : null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground mt-1">Your past transactions</p>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            Transactions
          </CardTitle>
          <CardDescription>All your money transfers</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !userPrincipal ? (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Internet Identity required</p>
              <p className="text-sm mt-1">
                Transaction history is available for Internet Identity users.
              </p>
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{tx.narration || "Transfer"}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        To: {tx.recipientAccountName} • {tx.recipientBank} • {tx.recipientAccountNumber}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimestamp(tx.timestamp)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-bold text-foreground text-lg">
                        {formatNGN(Number(tx.amount))}
                      </span>
                      {getStatusBadge(tx.status as string)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Your transaction history will appear here</p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/request-money">
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Request Money
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
