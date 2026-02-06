'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Subscription,
  ScanProgress as ScanProgressType,
  SubscriptionCategory,
  CATEGORY_LABELS,
} from '@/types/subscription';
import ScanProgress from '@/components/ScanProgress';
import SummaryCard from '@/components/SummaryCard';
import CategoryGroup from '@/components/CategoryGroup';
import SubscriptionCard from '@/components/SubscriptionCard';

type ViewMode = 'category' | 'list';
type SortMode = 'cost' | 'date' | 'name';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [progress, setProgress] = useState<ScanProgressType>({
    status: 'idle',
    totalEmails: 0,
    processedEmails: 0,
    foundSubscriptions: 0,
  });

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalAnnual, setTotalAnnual] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('category');
  const [sortMode, setSortMode] = useState<SortMode>('cost');
  const [filterCategory, setFilterCategory] = useState<SubscriptionCategory | 'all'>('all');
  const [scanComplete, setScanComplete] = useState(false);

  const startScan = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      // Step 1: Search for emails
      setProgress({
        status: 'searching',
        totalEmails: 0,
        processedEmails: 0,
        foundSubscriptions: 0,
      });

      const scanResponse = await fetch('/api/scan');
      const scanData = await scanResponse.json();

      if (!scanResponse.ok) {
        throw new Error(scanData.error || 'Failed to scan emails');
      }

      const emailIds: string[] = scanData.emailIds;

      if (emailIds.length === 0) {
        setProgress({
          status: 'complete',
          totalEmails: 0,
          processedEmails: 0,
          foundSubscriptions: 0,
        });
        setScanComplete(true);
        return;
      }

      // Step 2: Parse emails with AI
      setProgress({
        status: 'parsing',
        totalEmails: emailIds.length,
        processedEmails: 0,
        foundSubscriptions: 0,
      });

      // Process in batches to show progress
      const batchSize = 20;
      const allSubscriptions: Subscription[] = [];

      for (let i = 0; i < emailIds.length; i += batchSize) {
        const batch = emailIds.slice(i, i + batchSize);

        const parseResponse = await fetch('/api/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailIds: batch }),
        });

        const parseData = await parseResponse.json();

        if (parseResponse.ok && parseData.subscriptions) {
          allSubscriptions.push(...parseData.subscriptions);
        }

        setProgress({
          status: 'parsing',
          totalEmails: emailIds.length,
          processedEmails: Math.min(i + batchSize, emailIds.length),
          foundSubscriptions: allSubscriptions.length,
        });
      }

      // Deduplicate subscriptions by service name
      const uniqueSubscriptions = deduplicateSubscriptions(allSubscriptions);

      // Calculate totals
      let monthly = 0;
      let annual = 0;

      for (const sub of uniqueSubscriptions) {
        const cost = sub.cost || 0;
        switch (sub.frequency) {
          case 'weekly':
            monthly += cost * 4.33;
            break;
          case 'monthly':
            monthly += cost;
            break;
          case 'quarterly':
            monthly += cost / 3;
            break;
          case 'annual':
            monthly += cost / 12;
            break;
          default:
            monthly += cost;
        }
      }

      annual = monthly * 12;

      setSubscriptions(uniqueSubscriptions);
      setTotalMonthly(Math.round(monthly * 100) / 100);
      setTotalAnnual(Math.round(annual * 100) / 100);

      setProgress({
        status: 'complete',
        totalEmails: emailIds.length,
        processedEmails: emailIds.length,
        foundSubscriptions: uniqueSubscriptions.length,
      });

      setScanComplete(true);
    } catch (error) {
      console.error('Scan error:', error);
      setProgress({
        status: 'error',
        totalEmails: 0,
        processedEmails: 0,
        foundSubscriptions: 0,
        error: error instanceof Error ? error.message : 'Failed to scan emails',
      });
    }
  }, [session?.accessToken]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Start scan when session is available
  useEffect(() => {
    if (session?.accessToken && progress.status === 'idle') {
      startScan();
    }
  }, [session?.accessToken, progress.status, startScan]);

  const deduplicateSubscriptions = (subs: Subscription[]): Subscription[] => {
    const serviceMap = new Map<string, Subscription>();

    for (const sub of subs) {
      const key = sub.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existing = serviceMap.get(key);

      if (!existing) {
        serviceMap.set(key, sub);
      } else if (sub.confidence > existing.confidence) {
        sub.emailCount += existing.emailCount;
        serviceMap.set(key, sub);
      } else {
        existing.emailCount += sub.emailCount;
      }
    }

    return Array.from(serviceMap.values());
  };

  const getFilteredSubscriptions = (): Subscription[] => {
    let filtered = subscriptions;

    if (filterCategory !== 'all') {
      filtered = filtered.filter((s) => s.category === filterCategory);
    }

    // Sort
    switch (sortMode) {
      case 'cost':
        filtered = [...filtered].sort((a, b) => (b.cost || 0) - (a.cost || 0));
        break;
      case 'date':
        filtered = [...filtered].sort(
          (a, b) =>
            new Date(b.lastEmailDate).getTime() -
            new Date(a.lastEmailDate).getTime()
        );
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) =>
          a.serviceName.localeCompare(b.serviceName)
        );
        break;
    }

    return filtered;
  };

  const getGroupedSubscriptions = (): Map<SubscriptionCategory, Subscription[]> => {
    const filtered = getFilteredSubscriptions();
    const grouped = new Map<SubscriptionCategory, Subscription[]>();

    for (const sub of filtered) {
      const existing = grouped.get(sub.category) || [];
      existing.push(sub);
      grouped.set(sub.category, existing);
    }

    return grouped;
  };

  const getCategoryOptions = (): SubscriptionCategory[] => {
    const categories = new Set<SubscriptionCategory>();
    for (const sub of subscriptions) {
      categories.add(sub.category);
    }
    return Array.from(categories);
  };

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Loading...</h2>
          <p className="text-slate-500">Checking your session</p>
        </div>
      </div>
    );
  }

  // Show loading while waiting for access token
  if (status === 'authenticated' && !session?.accessToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Connecting to Gmail...</h2>
          <p className="text-slate-500">Setting up secure access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <span className="font-bold text-xl text-slate-800">SubScanner</span>
          </div>

          <div className="flex items-center gap-4">
            {session?.user?.email && (
              <span className="text-sm text-slate-500 hidden md:block">
                {session.user.email}
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-slate-600 hover:text-slate-800 font-medium"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Scanning State */}
        {!scanComplete && (
          <div className="py-20">
            <ScanProgress progress={progress} />
          </div>
        )}

        {/* Results */}
        {scanComplete && (
          <>
            {/* Summary */}
            <div className="mb-8">
              <SummaryCard
                totalMonthly={totalMonthly}
                totalAnnual={totalAnnual}
                subscriptionCount={subscriptions.length}
              />
            </div>

            {/* No Subscriptions Found */}
            {subscriptions.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <span className="text-6xl mb-4 block">🎉</span>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  No Subscriptions Found
                </h2>
                <p className="text-slate-600 mb-6">
                  We couldn&apos;t find any subscription-related emails in the last 12
                  months. Either you&apos;re subscription-free or the emails are in a
                  different account.
                </p>
                <button
                  onClick={() => {
                    setScanComplete(false);
                    setProgress({ status: 'idle', totalEmails: 0, processedEmails: 0, foundSubscriptions: 0 });
                  }}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition"
                >
                  Scan Again
                </button>
              </div>
            )}

            {/* Subscriptions List */}
            {subscriptions.length > 0 && (
              <>
                {/* Controls */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setViewMode('category')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        viewMode === 'category'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      By Category
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        viewMode === 'list'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      List View
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Category Filter */}
                    <select
                      value={filterCategory}
                      onChange={(e) =>
                        setFilterCategory(e.target.value as SubscriptionCategory | 'all')
                      }
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white"
                    >
                      <option value="all">All Categories</option>
                      {getCategoryOptions().map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </option>
                      ))}
                    </select>

                    {/* Sort */}
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value as SortMode)}
                      className="px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 bg-white"
                    >
                      <option value="cost">Sort by Cost</option>
                      <option value="date">Sort by Date</option>
                      <option value="name">Sort by Name</option>
                    </select>

                    {/* Rescan Button */}
                    <button
                      onClick={() => {
                        setScanComplete(false);
                        setSubscriptions([]);
                        setProgress({ status: 'idle', totalEmails: 0, processedEmails: 0, foundSubscriptions: 0 });
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-white text-slate-600 hover:bg-slate-50 border border-slate-200 transition"
                    >
                      Rescan
                    </button>
                  </div>
                </div>

                {/* Category View */}
                {viewMode === 'category' && (
                  <div className="space-y-6">
                    {Array.from(getGroupedSubscriptions().entries()).map(
                      ([category, subs]) => (
                        <CategoryGroup
                          key={category}
                          category={category}
                          subscriptions={subs}
                        />
                      )
                    )}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="space-y-4">
                    {getFilteredSubscriptions().map((subscription) => (
                      <SubscriptionCard
                        key={subscription.id}
                        subscription={subscription}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 mt-12 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-slate-500">
          <p className="mb-2">
            Your email data is processed securely and never stored permanently.
          </p>
          <p>
            <a href="/" className="text-primary-600 hover:underline">
              Disconnect Gmail
            </a>{' '}
            access at any time from your{' '}
            <a
              href="https://myaccount.google.com/permissions"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              Google Account Settings
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
