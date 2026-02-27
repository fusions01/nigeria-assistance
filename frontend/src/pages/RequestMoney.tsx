import { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useRequestMoney, useGetBankList } from "../hooks/useQueries";
import { isCanisterStoppedError, SERVICE_UNAVAILABLE_MSG } from "../lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, CheckCircle2, ArrowDownCircle } from "lucide-react";

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

/**
 * Extract the authenticated user's email from sessionStorage.
 * Checks `emailAuth` (plain string or JSON) and `userSession` (JSON object).
 */
function getSessionEmail(): string {
  try {
    const emailAuth = sessionStorage.getItem("emailAuth");
    if (emailAuth && emailAuth !== "null" && emailAuth !== "") {
      try {
        const parsed = JSON.parse(emailAuth);
        if (typeof parsed === "string" && parsed.includes("@")) return parsed;
        if (parsed && typeof parsed === "object" && parsed.email) return parsed.email;
      } catch {
        if (emailAuth.includes("@")) return emailAuth;
      }
    }

    const userSession = sessionStorage.getItem("userSession");
    if (userSession && userSession !== "null" && userSession !== "") {
      try {
        const parsed = JSON.parse(userSession);
        if (parsed && typeof parsed === "object" && parsed.email) return parsed.email;
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
  return "";
}

const NIGERIAN_BANKS = [
  "Access Bank",
  "GTBank",
  "First Bank",
  "Zenith Bank",
  "UBA",
  "Fidelity Bank",
  "Sterling Bank",
  "Polaris Bank",
  "Wema Bank",
  "Stanbic IBTC",
  "Kuda Bank",
  "Providus Bank",
  "Unity Bank",
  "Keystone Bank",
  "Heritage Bank",
  "SunTrust Bank",
  "Globacom",
  "Ecobank Nigeria",
  "Jaiz Bank",
  "Globus Bank",
  "Opay",
  "PalmPay",
  "Moniepoint",
  "Carbon",
  "VFD Microfinance Bank",
  "Rubies Bank",
  "Sparkle Bank",
  "FCMB",
  "Union Bank",
  "Citibank Nigeria",
];

export default function RequestMoney() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const requestMoneyMutation = useRequestMoney();
  const { data: bankList } = useGetBankList();

  const [sessionAuth] = useState(isSessionAuthenticated);
  const isAuthenticated = !!identity || sessionAuth;

  const [reason, setReason] = useState("");
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const banks = bankList && bankList.length > 0 ? bankList : NIGERIAN_BANKS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reason.trim()) {
      setError("Please enter a reason for your request.");
      return;
    }
    if (!bank) {
      setError("Please select your bank.");
      return;
    }
    if (!accountNumber || accountNumber.length !== 10 || !/^\d+$/.test(accountNumber)) {
      setError("Please enter a valid 10-digit account number.");
      return;
    }
    if (!accountName.trim()) {
      setError("Please enter the account holder name.");
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get the user's email from sessionStorage for email/phone OTP sessions.
      // For Internet Identity sessions, this will be empty and the backend
      // will use the caller's II principal directly.
      const email = getSessionEmail();

      await requestMoneyMutation.mutateAsync({
        reason: reason.trim(),
        bank,
        accountNumber,
        accountName: accountName.trim(),
        amountNeeded: BigInt(Math.round(Number(amount))),
        email,
      });

      setSuccess(true);
      // Reset form
      setReason("");
      setBank("");
      setAccountNumber("");
      setAccountName("");
      setAmount("");
    } catch (err) {
      if (isCanisterStoppedError(err)) {
        setError(SERVICE_UNAVAILABLE_MSG);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("No profile found for the provided email")) {
          setError("Your session could not be verified. Please log out and log in again.");
        } else if (msg.includes("no authenticated principal and no email")) {
          setError("You must be logged in to submit a request. Please log in and try again.");
        } else {
          setError(msg || "Failed to submit request. Please try again.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center shadow-card">
          <CardContent className="py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your money request has been submitted successfully. Our team will review and process it shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setSuccess(false)}>
                <ArrowDownCircle className="w-4 h-4 mr-2" />
                Submit Another Request
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Request Money</h1>
        <p className="text-muted-foreground mt-1">
          Fill in your bank details and the amount you need
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownCircle className="w-5 h-5 text-primary" />
            Money Request Form
          </CardTitle>
          <CardDescription>
            All fields are required. Your request will be reviewed by our team.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason / Purpose</Label>
              <Textarea
                id="reason"
                placeholder="Describe why you need this money (e.g., medical emergency, school fees, business capital...)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Bank */}
            <div className="space-y-2">
              <Label htmlFor="bank">Bank</Label>
              <Select value={bank} onValueChange={setBank} disabled={isSubmitting}>
                <SelectTrigger id="bank">
                  <SelectValue placeholder="Select your bank" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number (10 digits)</Label>
              <Input
                id="accountNumber"
                type="text"
                inputMode="numeric"
                placeholder="0123456789"
                value={accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setAccountNumber(val);
                }}
                maxLength={10}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-muted-foreground">
                {accountNumber.length}/10 digits
              </p>
            </div>

            {/* Account Holder Name */}
            <div className="space-y-2">
              <Label htmlFor="accountName">Account Holder Name</Label>
              <Input
                id="accountName"
                type="text"
                placeholder="Enter the account holder's full name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount Needed (NGN)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                  ₦
                </span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="1"
                  step="1"
                  className="pl-8"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Request...
                </>
              ) : (
                <>
                  <ArrowDownCircle className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
