import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSaveProfile, useRecordLogin } from '../hooks/useQueries';
import { detectDeviceType } from '../lib/utils';
import PhoneVerification from './PhoneVerification';
import EmailVerification from './EmailVerification';
import { CheckCircle, User, Phone, Mail } from 'lucide-react';

interface ProfileSetupModalProps {
  open: boolean;
  onComplete: () => void;
}

type Step = 'phone' | 'name' | 'email' | 'done';

export default function ProfileSetupModal({ open, onComplete }: ProfileSetupModalProps) {
  const [step, setStep] = useState<Step>('phone');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [nameError, setNameError] = useState('');

  const saveProfile = useSaveProfile();
  const recordLogin = useRecordLogin();

  const handlePhoneVerified = (phone: string) => {
    setVerifiedPhone(phone);
    setStep('name');
  };

  const handleNameNext = () => {
    if (!displayName.trim()) {
      setNameError('Please enter your name');
      return;
    }
    setNameError('');
    setStep('email');
  };

  const handleEmailVerified = async (email: string, password: string) => {
    try {
      await saveProfile.mutateAsync({
        displayName: displayName.trim(),
        phoneNumber: verifiedPhone,
        identityAnchor: 0n,
        email,
        password,
        emailVerified: true,
      });

      const deviceType = detectDeviceType();
      try {
        await recordLogin.mutateAsync(deviceType);
      } catch {
        // non-critical
      }

      setStep('done');
      setTimeout(() => {
        onComplete();
      }, 1500);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const stepIndex = step === 'phone' ? 0 : step === 'name' ? 1 : step === 'email' ? 2 : 3;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {step === 'phone' && 'Verify Your Phone'}
            {step === 'name' && 'Your Name'}
            {step === 'email' && 'Set Up Email & Password'}
            {step === 'done' && 'All Set!'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {step === 'phone' && 'Enter your Nigerian phone number to get started'}
            {step === 'name' && 'What should we call you?'}
            {step === 'email' && 'Create your login credentials'}
            {step === 'done' && 'Your account has been created successfully'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[
            { icon: Phone, label: 'Phone' },
            { icon: User, label: 'Name' },
            { icon: Mail, label: 'Email' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              <div className={`flex flex-col items-center gap-1`}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    i < stepIndex
                      ? 'bg-primary text-primary-foreground'
                      : i === stepIndex
                        ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i < stepIndex ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              {i < 2 && (
                <div
                  className={`h-0.5 w-8 mb-4 transition-colors ${i < stepIndex ? 'bg-primary' : 'bg-muted'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="mt-2">
          {step === 'phone' && (
            <PhoneVerification onVerified={handlePhoneVerified} />
          )}

          {step === 'name' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Full Name</Label>
                <Input
                  id="displayName"
                  placeholder="e.g. Adebayo Okafor"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameNext()}
                  autoFocus
                />
                {nameError && <p className="text-sm text-destructive">{nameError}</p>}
              </div>
              <Button onClick={handleNameNext} className="w-full">
                Continue
              </Button>
            </div>
          )}

          {step === 'email' && (
            <EmailVerification
              onVerified={handleEmailVerified}
              isLoading={saveProfile.isPending}
            />
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <p className="text-center text-muted-foreground">
                Welcome, <strong>{displayName}</strong>! Your account is ready.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
