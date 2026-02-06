'use client';

import { useState } from 'react';
import {
  Subscription,
  SubscriptionCategory,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
} from '@/types/subscription';
import { calculateMonthlyCost } from '@/lib/claude';
import SubscriptionCard from './SubscriptionCard';

interface CategoryGroupProps {
  category: SubscriptionCategory;
  subscriptions: Subscription[];
}

export default function CategoryGroup({
  category,
  subscriptions,
}: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const totalMonthly = subscriptions.reduce((sum, sub) => {
    return sum + calculateMonthlyCost(sub.cost || 0, sub.frequency);
  }, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Category Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">
              {CATEGORY_LABELS[category]}
            </h3>
            <p className="text-sm text-slate-500">
              {subscriptions.length} subscription{subscriptions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="font-bold text-lg text-slate-900">
              {formatCurrency(totalMonthly)}
              <span className="text-sm font-normal text-slate-500">/mo</span>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Subscription Cards */}
      {isExpanded && (
        <div className="px-6 pb-4 space-y-3">
          {subscriptions.map((subscription) => (
            <SubscriptionCard key={subscription.id} subscription={subscription} />
          ))}
        </div>
      )}
    </div>
  );
}
