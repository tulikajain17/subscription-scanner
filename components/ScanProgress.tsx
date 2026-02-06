'use client';

import { ScanProgress as ScanProgressType } from '@/types/subscription';

interface ScanProgressProps {
  progress: ScanProgressType;
}

export default function ScanProgress({ progress }: ScanProgressProps) {
  const getStatusMessage = () => {
    switch (progress.status) {
      case 'idle':
        return 'Starting scan...';
      case 'authenticating':
        return 'Connecting to Gmail...';
      case 'searching':
        return 'Searching for subscription emails...';
      case 'fetching':
        return `Found ${progress.totalEmails} emails, fetching details...`;
      case 'parsing':
        return `Analyzing emails with AI... ${progress.processedEmails}/${progress.totalEmails}`;
      case 'complete':
        return 'Scan complete!';
      case 'error':
        return progress.error || 'An error occurred';
      default:
        return 'Preparing scan...';
    }
  };

  const getProgressPercentage = () => {
    if (progress.status === 'complete') return 100;
    if (progress.totalEmails === 0) return 0;
    return Math.round((progress.processedEmails / progress.totalEmails) * 100);
  };

  const isError = progress.status === 'error';
  const isComplete = progress.status === 'complete';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto">
      {/* Scanning Animation */}
      {!isComplete && !isError && (
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">📧</span>
          </div>
        </div>
      )}

      {/* Success Icon */}
      {isComplete && (
        <div className="w-24 h-24 mx-auto mb-6 bg-success-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-success-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}

      {/* Error Icon */}
      {isError && (
        <div className="w-24 h-24 mx-auto mb-6 bg-danger-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-danger-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      )}

      {/* Retry button for errors */}
      {isError && (
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition"
        >
          Try Again
        </button>
      )}

      {/* Status Message */}
      <h2
        className={`text-xl font-semibold text-center mb-2 ${
          isError ? 'text-danger-600' : 'text-slate-900'
        }`}
      >
        {getStatusMessage()}
      </h2>

      {/* Progress Bar */}
      {!isError && progress.status !== 'idle' && (
        <div className="mt-6">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete ? 'bg-success-500' : 'bg-primary-500'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-500">
            <span>
              {progress.processedEmails} of {progress.totalEmails} emails
            </span>
            <span>{getProgressPercentage()}%</span>
          </div>
        </div>
      )}

      {/* Found Subscriptions Counter */}
      {(progress.status === 'parsing' || progress.status === 'complete') &&
        progress.foundSubscriptions > 0 && (
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 bg-success-50 text-success-700 px-4 py-2 rounded-full">
              <span className="text-lg">🎯</span>
              <span className="font-medium">
                Found {progress.foundSubscriptions} subscription
                {progress.foundSubscriptions !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}

      {/* Current Service Being Processed */}
      {progress.currentService && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Processing: {progress.currentService}
        </p>
      )}
    </div>
  );
}
