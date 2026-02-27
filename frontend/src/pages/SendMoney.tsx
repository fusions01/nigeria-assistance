import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useTransferMoney } from '../hooks/useQueries';
import BankAccountLookup from '../components/BankAccountLookup';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Banknote,
  Info,
} from 'lucide-react';
import { formatNGN } from '../lib/utils';

const MAX_AMOUNT = 5_000_000; // 5 million NGN

export default function SendMoney() {
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const transferMoney = useTransferMoney();

  const [confirmedAccount, setConfirmedAccount] = useState<{
    bank: string;
    accountNumber: string;
    accountName: string;
  } | null>(null);

  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [amountError, setAmountError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!identity) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground">Please sign in to send money.</p>
      </div>
    );
  }

  const handleAmountChange = (val: string) => {
    const cleaned = val.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
    const num = parseFloat(cleaned);
    if (cleaned && (isNaN(num) || num <= 0)) {
      setAmountError('Amount must be a positive number');
    } else if (num > MAX_AMOUNT) {
      setAmountError(`Maximum transfer amount is ${formatNGN(MAX_AMOUNT)}`);
    } else {
      setAmountError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedAccount) return;

    const num = parseFloat(amount);
    if (!amount || isNaN(num) || num <= 0) {
      setAmountError('Please enter a valid amount');
      return;
    }
    if (num > MAX_AMOUNT) {
      setAmountError(`Maximum transfer amount is ${formatNGN(MAX_AMOUNT)}`);
      return;
    }

    try {
      await transferMoney.mutateAsync({
        recipientAccountNumber: confirmedAccount.accountNumber,
        recipientBank: confirmedAccount.bank,
        recipientAccountName: confirmedAccount.accountName,
        amount: BigInt(Math.round(num * 100)), // store in kobo
        narration: narration.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate({ to: '/transactions' }), 2500);
    } catch (err: any) {
      console.error('Transfer failed:', err);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Transfer Successful!</h2>
        <p className="text-muted-foreground mb-2">
          {formatNGN(parseFloat(amount))} sent to{' '}
          <span className="font-medium text-foreground">{confirmedAccount?.accountName}</span>
        </p>
        <p className="text-sm text-muted-foreground">Redirecting to transaction history...</p>
      </div>
    );
  }

  const canSubmit = !!confirmedAccount && !!amount && !amountError && !transferMoney.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/dashboard' })}
          className="rounded-xl"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Send Money</h1>
          <p className="text-sm text-muted-foreground">Transfer funds to any Nigerian bank account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Bank Account Lookup */}
        <Card className="border-border shadow-card">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">1</div>
              <CardTitle className="text-base">Recipient Details</CardTitle>
            </div>
            <CardDescription>Select bank and enter account number to verify recipient</CardDescription>
          </CardHeader>
          <CardContent>
            <BankAccountLookup
              onVerified={(bank, accountNumber, accountName) => {
                setConfirmedAccount({ bank, accountNumber, accountName });
              }}
            />
          </CardContent>
        </Card>

        {/* Step 2: Amount & Narration */}
        <Card className={`border-border shadow-card transition-opacity ${!confirmedAccount ? 'opacity-50 pointer-events-none' : ''}`}>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center ${confirmedAccount ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2</div>
              <CardTitle className="text-base">Transfer Details</CardTitle>
            </div>
            <CardDescription>Enter the amount and optional narration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (NGN)</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₦</span>
                <Input
                  id="amount"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-7 font-mono text-lg"
                  disabled={!confirmedAccount}
                />
              </div>
              {amountError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {amountError}
                </p>
              )}
              {amount && !amountError && parseFloat(amount) > 0 && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {formatNGN(parseFloat(amount))}
                </p>
              )}
              <p className="text-xs text-muted-foreground">Maximum: {formatNGN(MAX_AMOUNT)}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="narration">Narration (Optional)</Label>
              <Textarea
                id="narration"
                placeholder="e.g. Rent payment, School fees..."
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                rows={2}
                maxLength={100}
                disabled={!confirmedAccount}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">{narration.length}/100</p>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        {confirmedAccount && amount && !amountError && parseFloat(amount) > 0 && (
          <Card className="border-primary/20 bg-primary/5 shadow-card animate-fade-in">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                Transfer Summary
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To</span>
                  <span className="font-medium">{confirmedAccount.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span>{confirmedAccount.bank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account</span>
                  <span className="font-mono">{confirmedAccount.accountNumber}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>Amount</span>
                  <span className="text-primary">{formatNGN(parseFloat(amount))}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {transferMoney.isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Transfer failed. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-green h-12 text-base font-semibold"
        >
          {transferMoney.isPending ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Processing Transfer...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Send {amount && !amountError && parseFloat(amount) > 0 ? formatNGN(parseFloat(amount)) : 'Money'}
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}
