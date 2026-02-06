'use client';

import { useState } from 'react';
import { Subscription, CATEGORY_ICONS } from '@/types/subscription';
import { calculateMonthlyCost } from '@/lib/claude';

interface SubscriptionCardProps {
  subscription: Subscription;
  onViewDetails?: (subscription: Subscription) => void;
}

export default function SubscriptionCard({
  subscription,
  onViewDetails,
}: SubscriptionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const monthlyCost = calculateMonthlyCost(subscription.cost || 0, subscription.frequency);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getActivityIndicator = () => {
    if (!subscription.lastEmailDate) return null;

    const lastDate = new Date(subscription.lastEmailDate);
    const now = new Date();
    const daysSince = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-success-600 bg-success-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse"></span>
          Active
        </span>
      );
    } else if (daysSince <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>
          Recent
        </span>
      );
    } else if (daysSince <= 90) {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-warning-600 bg-warning-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-warning-500 rounded-full"></span>
          Inactive
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-xs text-danger-600 bg-danger-50 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 bg-danger-500 rounded-full"></span>
          Forgotten?
        </span>
      );
    }
  };

  const getFrequencyLabel = () => {
    switch (subscription.frequency) {
      case 'weekly':
        return '/week';
      case 'monthly':
        return '/month';
      case 'quarterly':
        return '/quarter';
      case 'annual':
        return '/year';
      case 'one-time':
        return ' (one-time)';
      default:
        return '';
    }
  };

  return (
    <div className="subscription-card bg-white rounded-xl border border-slate-200 p-4 hover:border-primary-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Service Icon */}
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">
              {CATEGORY_ICONS[subscription.category] || '📦'}
            </span>
          </div>

          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">
                {subscription.serviceName}
              </h3>
              {getActivityIndicator()}
            </div>

            <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
              <span className="truncate">{subscription.senderDomain}</span>
              {subscription.emailCount > 1 && (
                <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                  {subscription.emailCount} emails
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Cost */}
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-lg text-slate-900">
            {subscription.cost
              ? formatCurrency(subscription.cost, subscription.currency)
              : 'Unknown'}
            <span className="text-sm font-normal text-slate-500">
              {getFrequencyLabel()}
            </span>
          </div>
          {subscription.frequency !== 'monthly' && subscription.cost && (
            <div className="text-xs text-slate-500">
              {formatCurrency(monthlyCost, subscription.currency)}/mo
            </div>
          )}
        </div>
      </div>

      {/* Expandable Details */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {subscription.renewalDate && (
              <div>
                <span className="text-slate-500">Renews:</span>{' '}
                <span className="text-slate-700 font-medium">
                  {formatDate(subscription.renewalDate)}
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Last email:</span>{' '}
              <span className="text-slate-700 font-medium">
                {formatDate(subscription.lastEmailDate)}
              </span>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-primary-600 hover:text-primary-700 font-medium text-sm flex items-center gap-1"
          >
            {expanded ? 'Less' : 'More'}
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500 block">Category</span>
                  <span className="text-slate-700 capitalize">
                    {subscription.category}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Confidence</span>
                  <span className="text-slate-700">
                    {Math.round(subscription.confidence * 100)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Billing</span>
                  <span className="text-slate-700 capitalize">
                    {subscription.frequency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Currency</span>
                  <span className="text-slate-700">{subscription.currency}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={`https://www.google.com/search?q=cancel+${encodeURIComponent(
                  subscription.serviceName
                )}+subscription`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-lg transition"
              >
                How to Cancel
              </a>
              <a
                href={`https://${subscription.senderDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-center px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition"
              >
                Visit Site
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
