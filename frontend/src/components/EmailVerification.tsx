import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, AlertCircle, Info, ShieldCheck } from 'lucide-react';

interface EmailVerificationProps {
  /** Pre-filled email (read-only). When provided the email field is hidden and the component skips straight to code entry. */
  email?: string;
  onVerified: (email: string, password: string) => void;
  isLoading?: boolean;
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function EmailVerification({ email: prefillEmail, onVerified, isLoading }: EmailVerificationProps) {
  // If a prefilled email is provided we skip the form step and go straight to code
  const hasPrefill = !!prefillEmail;

  const [step, setStep] = useState<'form' | 'code'>(hasPrefill ? 'code' : 'form');
  const [email, setEmail] = useState(prefillEmail ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatedCode, setGeneratedCode] = useState(() => hasPrefill ? generateCode() : '');
  const [otpDigits, setOtpDigits] = useState('');
  const [codeExpiry, setCodeExpiry] = useState(() => hasPrefill ? Date.now() + 5 * 60 * 1000 : 0);
  const [error, setError] = useState('');

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const handleSendCode = () => {
    setError('');
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const code = generateCode();
    setGeneratedCode(code);
    setCodeExpiry(Date.now() + 5 * 60 * 1000);
    setOtpDigits('');
    setStep('code');
  };

  const handleVerifyClick = () => {
    setError('');

    const enteredCode = otpDigits.trim();

    if (enteredCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    if (Date.now() > codeExpiry) {
      setError('Code has expired. Please go back and try again.');
      return;
    }
    if (enteredCode !== generatedCode) {
      setError('Invalid code. Please check and try again.');
      setOtpDigits('');
      return;
    }

    // Code is correct — call the parent callback
    onVerified(email, password);
  };

  return (
    <div className="space-y-4">
      {step === 'form' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ev-email">
              <Mail className="inline w-4 h-4 mr-1" />
              Email Address
            </Label>
            <Input
              id="ev-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              readOnly={hasPrefill}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-password">Password</Label>
            <div className="relative">
              <Input
                id="ev-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ev-confirm">Confirm Password</Label>
            <div className="relative">
              <Input
                id="ev-confirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSendCode} className="w-full">
            Send Verification Code
          </Button>
        </>
      )}

      {step === 'code' && (
        <>
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <span className="font-medium">Your email verification code:</span>{' '}
              <span className="font-mono text-lg font-bold text-primary tracking-widest">
                {generatedCode}
              </span>
              <br />
              <span className="text-xs text-muted-foreground">
                (In production, this would be sent to {email})
              </span>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Enter the 6-digit code</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpDigits}
                onChange={(value) => setOtpDigits(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            {!hasPrefill && (
              <Button
                variant="outline"
                onClick={() => { setStep('form'); setOtpDigits(''); setError(''); }}
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleVerifyClick}
              disabled={isLoading || otpDigits.length !== 6}
              className="flex-1"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                'Verify & Complete'
              )}
            </Button>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3" />
            <span>Code expires in 5 minutes</span>
          </div>
        </>
      )}
    </div>
  );
}
