'use client';

import { signIn } from 'next-auth/react';

export default function LandingPage() {
  const handleConnectGmail = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl text-gray-800">SubScanner</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Find Hidden <span className="text-blue-600">Subscriptions</span>
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Scan your Gmail to discover forgotten subscriptions you&apos;re still paying for.
        </p>

        <button
          onClick={handleConnectGmail}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold"
        >
          Connect Gmail
        </button>

        <p className="mt-4 text-sm text-gray-500">
          ✓ Read-only access. We never store your emails.
        </p>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600">$240</div>
            <div className="text-gray-600">Avg yearly savings</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600">12</div>
            <div className="text-gray-600">Subscriptions found</div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-3xl font-bold text-blue-600">2 min</div>
            <div className="text-gray-600">Scan time</div>
          </div>
        </div>

        {/* How it works */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="font-semibold mb-2">1. Connect Gmail</h3>
              <p className="text-gray-600 text-sm">Secure read-only OAuth access</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-semibold mb-2">2. AI Scans</h3>
              <p className="text-gray-600 text-sm">Find recurring charges</p>
            </div>
            <div>
              <div className="text-4xl mb-4">💡</div>
              <h3 className="font-semibold mb-2">3. Review & Save</h3>
              <p className="text-gray-600 text-sm">See all subscriptions</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p>© 2026 SubScanner</p>
        </div>
      </footer>
    </div>
  );
}
