'use client';

interface SummaryCardProps {
  totalMonthly: number;
  totalAnnual: number;
  subscriptionCount: number;
  currency?: string;
}

export default function SummaryCard({
  totalMonthly,
  totalAnnual,
  subscriptionCount,
  currency = 'USD',
}: SummaryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
      <h2 className="text-lg font-medium text-primary-100 mb-4">
        Your Subscription Summary
      </h2>

      <div className="grid grid-cols-3 gap-4">
        {/* Monthly Total */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-primary-200 text-sm mb-1">Monthly</div>
          <div className="text-2xl font-bold">{formatCurrency(totalMonthly)}</div>
        </div>

        {/* Annual Total */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-primary-200 text-sm mb-1">Annual</div>
          <div className="text-2xl font-bold">{formatCurrency(totalAnnual)}</div>
        </div>

        {/* Count */}
        <div className="bg-white/10 rounded-xl p-4">
          <div className="text-primary-200 text-sm mb-1">Active</div>
          <div className="text-2xl font-bold">
            {subscriptionCount}
            <span className="text-sm font-normal text-primary-200 ml-1">
              subs
            </span>
          </div>
        </div>
      </div>

      {/* Potential Savings */}
      {totalMonthly > 50 && (
        <div className="mt-4 bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-primary-200 text-sm">Potential Annual Savings</div>
              <div className="text-lg font-semibold">
                Cancel unused subscriptions to save up to{' '}
                <span className="text-success-300">
                  {formatCurrency(totalAnnual * 0.3)}
                </span>
              </div>
            </div>
            <span className="text-4xl">💡</span>
          </div>
        </div>
      )}
    </div>
  );
}
