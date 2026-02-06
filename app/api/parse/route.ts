import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { createGmailClient, getEmailContent, extractDomain, getServiceFromDomain } from '@/lib/gmail';
import { parseSubscriptionEmail, calculateMonthlyCost } from '@/lib/claude';
import { Subscription } from '@/types/subscription';

export const maxDuration = 120; // Allow up to 2 minutes for parsing

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in with Google' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { emailIds } = body as { emailIds: string[] };

    if (!emailIds || !Array.isArray(emailIds)) {
      return NextResponse.json(
        { error: 'emailIds array required' },
        { status: 400 }
      );
    }

    const client = createGmailClient(session.accessToken);

    // Process emails and parse subscriptions
    const subscriptions: Subscription[] = [];
    const processedDomains = new Map<string, Subscription>();
    let processed = 0;

    // Process in batches
    const batchSize = 5;

    for (let i = 0; i < emailIds.length; i += batchSize) {
      const batch = emailIds.slice(i, i + batchSize);

      const batchPromises = batch.map(async (emailId) => {
        try {
          const emailContent = await getEmailContent(client, emailId);
          if (!emailContent) return null;

          const domain = extractDomain(emailContent.from);

          // Check if we already have a subscription from this domain
          if (processedDomains.has(domain)) {
            // Update email count for existing subscription
            const existing = processedDomains.get(domain)!;
            existing.emailCount += 1;

            // Update last email date if this one is more recent
            const existingDate = new Date(existing.lastEmailDate);
            const currentDate = new Date(emailContent.date);
            if (currentDate > existingDate) {
              existing.lastEmailDate = emailContent.date;
            }

            return null; // Already processed this service
          }

          // Check if it's a known service first
          const knownService = getServiceFromDomain(domain);

          // Parse with Claude AI
          const parsed = await parseSubscriptionEmail(emailContent, domain);

          if (parsed && parsed.isSubscription) {
            const subscription: Subscription = {
              id: `sub_${domain}_${Date.now()}`,
              serviceName: knownService?.name || parsed.serviceName,
              cost: parsed.cost || 0,
              currency: parsed.currency,
              frequency: parsed.frequency,
              renewalDate: parsed.renewalDate,
              senderDomain: domain,
              category: (knownService?.category || parsed.category) as Subscription['category'],
              lastEmailDate: emailContent.date,
              emailCount: 1,
              confidence: parsed.confidence,
              status: 'active',
            };

            processedDomains.set(domain, subscription);
            return subscription;
          }

          return null;
        } catch (error) {
          console.error(`Error processing email ${emailId}:`, error);
          return null;
        }
      });

      const results = await Promise.all(batchPromises);

      for (const result of results) {
        if (result) {
          subscriptions.push(result);
        }
      }

      processed += batch.length;

      // Small delay between batches
      if (i + batchSize < emailIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Calculate totals
    let totalMonthly = 0;
    let totalAnnual = 0;

    for (const sub of subscriptions) {
      if (sub.cost && sub.cost > 0) {
        const monthly = calculateMonthlyCost(sub.cost, sub.frequency);
        totalMonthly += monthly;
        totalAnnual += monthly * 12;
      }
    }

    // Sort by cost (highest first)
    subscriptions.sort((a, b) => {
      const costA = calculateMonthlyCost(a.cost || 0, a.frequency);
      const costB = calculateMonthlyCost(b.cost || 0, b.frequency);
      return costB - costA;
    });

    return NextResponse.json({
      success: true,
      subscriptions,
      totalMonthly: Math.round(totalMonthly * 100) / 100,
      totalAnnual: Math.round(totalAnnual * 100) / 100,
      processedCount: processed,
    });
  } catch (error) {
    console.error('Parse error:', error);

    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return NextResponse.json(
          { error: 'Session expired. Please sign in again.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to parse subscriptions. Please try again.' },
      { status: 500 }
    );
  }
}
