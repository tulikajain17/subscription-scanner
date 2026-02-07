'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ found: 0, processed: 0, total: 0 });
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const startScan = async () => {
    if (!session?.accessToken) {
      setError('No access token available');
      return;
    }

    setScanning(true);
    setError(null);

    try {
      // Search for emails
      setProgress({ found: 0, processed: 0, total: 0 });

      const scanRes = await fetch('/api/scan');
      const scanData = await scanRes.json();

      if (!scanRes.ok) {
        throw new Error(scanData.error || 'Failed to scan');
      }

      const emailIds = scanData.emailIds || [];
      setProgress({ found: 0, processed: 0, total: emailIds.length });

      if (emailIds.length === 0) {
        setResults([]);
        setScanning(false);
        return;
      }

      // Parse emails
      const parseRes = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailIds: emailIds.slice(0, 50) }),
      });

      const parseData = await parseRes.json();

      if (parseRes.ok && parseData.subscriptions) {
        setResults(parseData.subscriptions);
        setProgress({
          found: parseData.subscriptions.length,
          processed: emailIds.length,
          total: emailIds.length
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  // Wait for mount
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Loading session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Signed In</h1>
          <a href="/" className="text-blue-600 hover:underline">Go to Home</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl text-gray-800">SubScanner</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session?.user?.email}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Your Subscriptions</h1>

        {/* Start Scan Button */}
        {!scanning && results.length === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ready to scan your Gmail for subscriptions?
            </h2>
            <button
              onClick={startScan}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Start Scanning
            </button>
            {error && (
              <p className="mt-4 text-red-600">{error}</p>
            )}
          </div>
        )}

        {/* Scanning Progress */}
        {scanning && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Scanning...</h2>
            <p className="text-gray-600">
              Found {progress.found} subscriptions • Processed {progress.processed}/{progress.total} emails
            </p>
          </div>
        )}

        {/* Results */}
        {!scanning && results.length > 0 && (
          <div>
            <div className="bg-blue-600 text-white rounded-xl p-6 mb-6">
              <h2 className="text-lg font-medium mb-2">Summary</h2>
              <div className="text-3xl font-bold">{results.length} subscriptions found</div>
            </div>

            <div className="space-y-4">
              {results.map((sub, i) => (
                <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">{sub.serviceName}</h3>
                      <p className="text-sm text-gray-500">{sub.senderDomain}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {sub.cost ? `$${sub.cost}` : 'Unknown'}
                      </div>
                      <div className="text-sm text-gray-500">{sub.frequency}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => { setResults([]); setProgress({ found: 0, processed: 0, total: 0 }); }}
              className="mt-6 text-blue-600 hover:underline"
            >
              Scan Again
            </button>
          </div>
        )}

        {/* No results */}
        {!scanning && results.length === 0 && progress.total > 0 && (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Subscriptions Found</h2>
            <p className="text-gray-600">We scanned {progress.total} emails but didn&apos;t find any subscriptions.</p>
          </div>
        )}
      </main>
    </div>
  );
}
