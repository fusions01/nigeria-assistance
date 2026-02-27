import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2, AlertCircle, User } from 'lucide-react';
import { useGetBankAccountName, useGetBankList } from '../hooks/useQueries';

interface BankAccountLookupProps {
  onVerified: (bank: string, accountNumber: string, accountName: string) => void;
}

export default function BankAccountLookup({ onVerified }: BankAccountLookupProps) {
  const [selectedBank, setSelectedBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [verifiedName, setVerifiedName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const { data: bankList = [] } = useGetBankList();
  const { mutateAsync: getBankAccountName, isPending } = useGetBankAccountName();

  const canVerify =
    selectedBank.trim() !== '' &&
    accountNumber.trim().length === 10 &&
    /^\d{10}$/.test(accountNumber.trim());

  const handleVerify = async () => {
    setErrorMsg('');
    setVerifiedName('');
    setIsVerified(false);

    if (!selectedBank) {
      setErrorMsg('Please select a bank.');
      return;
    }
    if (!/^\d{10}$/.test(accountNumber.trim())) {
      setErrorMsg('Account number must be exactly 10 digits.');
      return;
    }

    try {
      const name = await getBankAccountName({
        email: '',
        bank: selectedBank,
        accountNumber: accountNumber.trim(),
      });

      if (name && name.trim().length > 0) {
        setVerifiedName(name.trim());
        setIsVerified(true);
      } else {
        setErrorMsg('Could not resolve account name. Please check the account number and bank.');
      }
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);

      // Provide user-friendly messages for common backend errors
      if (raw.toLowerCase().includes('unauthorized') || raw.toLowerCase().includes('only users')) {
        setErrorMsg(
          'Your session has expired or is not active. Please log out and log back in, then try again.',
        );
      } else if (raw.toLowerCase().includes('invalid account number')) {
        setErrorMsg('Invalid account number. Please enter a valid 10-digit NUBAN account number.');
      } else if (raw.toLowerCase().includes('bank not yet mapped')) {
        setErrorMsg(
          'The selected bank is not yet supported for automatic verification. ' +
          'Please contact support or try a different bank.',
        );
      } else if (
        raw.toLowerCase().includes('could not resolve') ||
        raw.toLowerCase().includes('account not found') ||
        raw.toLowerCase().includes('invalid account')
      ) {
        setErrorMsg(
          'Account not found. Please double-check the account number and selected bank.',
        );
      } else if (raw.toLowerCase().includes('paystack')) {
        setErrorMsg('Bank verification service is temporarily unavailable. Please try again later.');
      } else {
        setErrorMsg(raw || 'Verification failed. Please try again.');
      }
    }
  };

  const handleConfirm = () => {
    if (isVerified && verifiedName) {
      onVerified(selectedBank, accountNumber.trim(), verifiedName);
    }
  };

  const handleReset = () => {
    setSelectedBank('');
    setAccountNumber('');
    setVerifiedName('');
    setErrorMsg('');
    setIsVerified(false);
  };

  return (
    <div className="space-y-4">
      {/* Bank selector */}
      <div className="space-y-1.5">
        <Label htmlFor="bank-select">Bank</Label>
        <Select
          value={selectedBank}
          onValueChange={(val) => {
            setSelectedBank(val);
            setVerifiedName('');
            setErrorMsg('');
            setIsVerified(false);
          }}
          disabled={isVerified}
        >
          <SelectTrigger id="bank-select" className="w-full">
            <SelectValue placeholder="Select your bank" />
          </SelectTrigger>
          <SelectContent>
            {bankList.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Account number input */}
      <div className="space-y-1.5">
        <Label htmlFor="account-number">Account Number</Label>
        <Input
          id="account-number"
          type="text"
          inputMode="numeric"
          maxLength={10}
          placeholder="Enter 10-digit account number"
          value={accountNumber}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
            setAccountNumber(val);
            setVerifiedName('');
            setErrorMsg('');
            setIsVerified(false);
          }}
          disabled={isVerified}
          className="font-mono tracking-widest"
        />
        <p className="text-xs text-muted-foreground">
          {accountNumber.length}/10 digits
        </p>
      </div>

      {/* Error message */}
      {errorMsg && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Verified account name display */}
      {isVerified && verifiedName && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-xs text-muted-foreground">Account Holder Name</p>
                <p className="font-semibold text-green-700 dark:text-green-400 text-base">
                  {verifiedName}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Please confirm this is the correct account before proceeding.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {!isVerified ? (
          <Button
            type="button"
            onClick={handleVerify}
            disabled={isPending || !canVerify}
            className="flex-1"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              'Verify Account'
            )}
          </Button>
        ) : (
          <>
            <Button
              type="button"
              onClick={handleConfirm}
              className="flex-1"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm — {verifiedName}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
            >
              Change
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
