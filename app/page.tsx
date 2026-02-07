'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && session) {
      router.push('/dashboard');
    }
  }, [mounted, session, router]);

  const handleConnectGmail = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  // Show simple loading until client is ready
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl text-slate-800">SubScanner</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 transition">
              How it Works
            </a>
            <a href="#privacy" className="text-slate-600 hover:text-blue-600 transition">
              Privacy
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="max-w-6xl mx-auto px-4 pt-20 pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Find Hidden{' '}
              <span className="text-blue-600">Subscriptions</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 leading-relaxed">
              Scan your Gmail to discover forgotten subscriptions you&apos;re still paying for.
              Stop wasting money on services you don&apos;t use.
            </p>

            <button
              onClick={handleConnectGmail}
              className="inline-flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:shadow-lg"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Connect Gmail
            </button>

            <p className="mt-4 text-sm text-slate-500 flex items-center justify-center gap-2">
              <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Read-only access. We never store your emails.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">$240</div>
              <div className="text-slate-600">Average yearly savings</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">12</div>
              <div className="text-slate-600">Subscriptions found on average</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">2 min</div>
              <div className="text-slate-600">Scan completion time</div>
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section id="how-it-works" className="bg-white py-20 border-y border-slate-100">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              How It Works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔗</span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">1. Connect Gmail</h3>
                <p className="text-slate-600">
                  Securely connect your Gmail with read-only OAuth access.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">🔍</span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">2. AI Scans Emails</h3>
                <p className="text-slate-600">
                  Our AI analyzes your emails to find recurring charges.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">💡</span>
                </div>
                <h3 className="font-semibold text-lg text-slate-900 mb-2">3. Review & Save</h3>
                <p className="text-slate-600">
                  See all subscriptions with costs and renewal dates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section id="privacy" className="py-20">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
              Your Privacy Matters
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-1">✓ Read-Only Access</h3>
                <p className="text-slate-600 text-sm">
                  We only request permission to read emails, never modify.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-1">✓ No Email Storage</h3>
                <p className="text-slate-600 text-sm">
                  We never store full email content.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-1">✓ Disconnect Anytime</h3>
                <p className="text-slate-600 text-sm">
                  Revoke access instantly from Google settings.
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
                <h3 className="font-semibold text-slate-900 mb-1">✓ Encrypted Tokens</h3>
                <p className="text-slate-600 text-sm">
                  OAuth tokens are encrypted and expire automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Find Your Hidden Subscriptions?
            </h2>
            <p className="text-blue-100 mb-8 text-lg">
              Join thousands who&apos;ve discovered forgotten subscriptions and saved money.
            </p>
            <button
              onClick={handleConnectGmail}
              className="inline-flex items-center gap-3 bg-white hover:bg-slate-50 text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-all hover:shadow-lg"
            >
              Get Started Free
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl text-white">SubScanner</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} SubScanner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
