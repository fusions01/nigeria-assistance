import React from 'react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Smartphone,
  Building2,
  Lock,
} from 'lucide-react';

const SUPPORTED_BANKS = [
  'Access Bank', 'GTBank', 'First Bank', 'Zenith Bank', 'UBA',
  'Fidelity Bank', 'Kuda Bank', 'Stanbic IBTC', 'Wema Bank', 'Polaris Bank',
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Shield className="h-4 w-4" />
            Nigeria's Trusted Payment Platform
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground leading-tight">
            Request Money
            <span className="text-primary block">Instantly & Securely</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            NigeriaPay makes it easy to request funds directly to your Nigerian bank account.
            Fast, secure, and reliable transfers across all major banks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" asChild>
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">
                Log In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Why Choose NigeriaPay?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Fast Requests</h3>
                <p className="text-sm text-muted-foreground">
                  Submit money requests in seconds. Our streamlined process gets your request to the right people instantly.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">Secure & Verified</h3>
                <p className="text-sm text-muted-foreground">
                  Bank account verification powered by Paystack ensures your funds go to the right account every time.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">All Nigerian Banks</h3>
                <p className="text-sm text-muted-foreground">
                  Supports all major Nigerian banks including GTBank, Access Bank, First Bank, Kuda, and more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Smartphone,
                title: 'Sign Up',
                desc: 'Create your account with phone verification and email confirmation.',
              },
              {
                step: '2',
                icon: Building2,
                title: 'Add Bank Details',
                desc: 'Verify your Nigerian bank account number for secure transfers.',
              },
              {
                step: '3',
                icon: CheckCircle,
                title: 'Request Funds',
                desc: 'Submit your money request and get notified when it\'s fulfilled.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center space-y-3">
                <div className="relative inline-block">
                  <div className="h-14 w-14 rounded-full bg-primary flex items-center justify-center mx-auto">
                    <Icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex items-center justify-center">
                    {step}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Banks */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-foreground mb-8">Supported Banks</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {SUPPORTED_BANKS.map((bank) => (
              <span
                key={bank}
                className="px-4 py-2 bg-muted rounded-full text-sm text-muted-foreground font-medium"
              >
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-primary-foreground/80">
            Join thousands of Nigerians using NigeriaPay for fast, secure money requests.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/signup">
              Create Free Account
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-8 px-4 bg-muted/50 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border rounded-lg px-4 py-2 hover:bg-background"
          >
            <Lock className="h-4 w-4" />
            Admin Login
          </Link>
        </div>
      </section>
    </div>
  );
}
