import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useGenerateOtp, useVerifyOtp } from '../hooks/useQueries';
import { Phone, ShieldCheck, AlertCircle, Info } from 'lucide-react';

interface PhoneVerificationProps {
  onVerified: (phoneNumber: string) => void;
}

export default function PhoneVerification({ onVerified }: PhoneVerificationProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');

  const generateOtp = useGenerateOtp();
  const verifyOtp = useVerifyOtp();

  const formatPhone = (value: string) => {
    let cleaned = value.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+') && !cleaned.startsWith('0')) {
      cleaned = '0' + cleaned;
    }
    return cleaned;
  };

  const isValidNigerianPhone = (phone: string) => {
    if (phone.length === 14 && phone.startsWith('+234')) return true;
    if (phone.length === 11 && phone.startsWith('0')) return true;
    return false;
  };

  const handleSendOtp = async () => {
    setError('');
    const formatted = formatPhone(phoneNumber);
    if (!isValidNigerianPhone(formatted)) {
      setError('Please enter a valid Nigerian phone number (e.g. 08012345678 or +2348012345678)');
      return;
    }

    try {
      const code = await generateOtp.mutateAsync(formatted);
      setGeneratedCode(code);
      setPhoneNumber(formatted);
      setStep('otp');
    } catch (err) {
      setError('Failed to generate OTP. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    try {
      const verified = await verifyOtp.mutateAsync({ phoneNumber, code: otpCode });
      if (verified) {
        onVerified(phoneNumber);
      } else {
        setError('Invalid or expired code. Please try again.');
        setOtpCode('');
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    }
  };

  return (
    <div className="space-y-4">
      {step === 'phone' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="inline w-4 h-4 mr-1" />
              Nigerian Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="08012345678 or +2348012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
            />
            <p className="text-xs text-muted-foreground">
              Enter your Nigerian mobile number to receive a verification code
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSendOtp}
            disabled={generateOtp.isPending || !phoneNumber}
            className="w-full"
          >
            {generateOtp.isPending ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </>
      )}

      {step === 'otp' && (
        <>
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              <span className="font-medium">Your verification code:</span>{' '}
              <span className="font-mono text-lg font-bold text-primary tracking-widest">
                {generatedCode}
              </span>
              <br />
              <span className="text-xs text-muted-foreground">
                (In production, this would be sent via SMS to {phoneNumber})
              </span>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label>Enter the 6-digit code</Label>
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
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
            <Button
              variant="outline"
              onClick={() => { setStep('phone'); setOtpCode(''); setError(''); }}
              className="flex-1"
            >
              Change Number
            </Button>
            <Button
              onClick={handleVerifyOtp}
              disabled={verifyOtp.isPending || otpCode.length !== 6}
              className="flex-1"
            >
              {verifyOtp.isPending ? 'Verifying...' : 'Verify'}
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
