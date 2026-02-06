import Anthropic from '@anthropic-ai/sdk';
import { Subscription, SubscriptionCategory, BillingFrequency } from '@/types/subscription';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ParsedSubscription {
  serviceName: string;
  cost: number | null;
  currency: string;
  frequency: BillingFrequency;
  renewalDate: string | null;
  senderDomain: string;
  category: SubscriptionCategory;
  confidence: number;
  isSubscription: boolean;
}

export async function parseSubscriptionEmail(
  emailContent: {
    subject: string;
    from: string;
    body: string;
    date: string;
  },
  senderDomain: string
): Promise<ParsedSubscription | null> {
  const prompt = `Analyze this email and determine if it's related to a subscription service. Extract subscription details if applicable.

Email Subject: ${emailContent.subject}
Email From: ${emailContent.from}
Email Date: ${emailContent.date}
Email Body (truncated):
${emailContent.body}

Instructions:
1. Determine if this email is about a subscription, recurring payment, or membership
2. If it IS a subscription-related email, extract the following:
   - Service/company name
   - Cost amount (as a number, or null if not found)
   - Currency (USD, EUR, GBP, etc. - default to USD if unclear)
   - Billing frequency (monthly, annual, weekly, quarterly, one-time, or unknown)
   - Renewal/next charge date (in ISO format YYYY-MM-DD, or null if not found)
   - Category (one of: streaming, software, fitness, news, gaming, productivity, cloud, food, shopping, finance, education, other)
3. Rate your confidence (0.0 to 1.0) that this is a genuine subscription

Return ONLY a valid JSON object with no additional text:
{
  "isSubscription": boolean,
  "serviceName": string,
  "cost": number | null,
  "currency": string,
  "frequency": "monthly" | "annual" | "weekly" | "quarterly" | "one-time" | "unknown",
  "renewalDate": string | null,
  "category": string,
  "confidence": number
}

If this is NOT a subscription-related email, return:
{
  "isSubscription": false,
  "serviceName": "",
  "cost": null,
  "currency": "USD",
  "frequency": "unknown",
  "renewalDate": null,
  "category": "other",
  "confidence": 0
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', content.text);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      serviceName: parsed.serviceName || 'Unknown Service',
      cost: parsed.cost,
      currency: parsed.currency || 'USD',
      frequency: parsed.frequency || 'unknown',
      renewalDate: parsed.renewalDate,
      senderDomain,
      category: parsed.category || 'other',
      confidence: parsed.confidence || 0.5,
      isSubscription: parsed.isSubscription || false,
    };
  } catch (error) {
    console.error('Error parsing subscription email:', error);
    return null;
  }
}

export async function batchParseEmails(
  emails: Array<{
    id: string;
    subject: string;
    from: string;
    body: string;
    date: string;
    senderDomain: string;
  }>
): Promise<Map<string, ParsedSubscription>> {
  const results = new Map<string, ParsedSubscription>();

  // Process emails in batches to avoid rate limits
  const batchSize = 5;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const promises = batch.map(async (email) => {
      const result = await parseSubscriptionEmail(
        {
          subject: email.subject,
          from: email.from,
          body: email.body,
          date: email.date,
        },
        email.senderDomain
      );
      return { id: email.id, result };
    });

    const batchResults = await Promise.all(promises);

    for (const { id, result } of batchResults) {
      if (result && result.isSubscription) {
        results.set(id, result);
      }
    }

    // Small delay between batches to respect rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}

export function deduplicateSubscriptions(
  subscriptions: Subscription[]
): Subscription[] {
  const serviceMap = new Map<string, Subscription>();

  for (const sub of subscriptions) {
    const key = sub.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const existing = serviceMap.get(key);

    if (!existing) {
      serviceMap.set(key, sub);
    } else {
      // Keep the one with higher confidence or more recent date
      if (sub.confidence > existing.confidence) {
        // Merge email counts
        sub.emailCount += existing.emailCount;
        serviceMap.set(key, sub);
      } else {
        existing.emailCount += sub.emailCount;
      }
    }
  }

  return Array.from(serviceMap.values());
}

export function calculateMonthlyCost(cost: number, frequency: BillingFrequency): number {
  switch (frequency) {
    case 'weekly':
      return cost * 4.33; // Average weeks per month
    case 'monthly':
      return cost;
    case 'quarterly':
      return cost / 3;
    case 'annual':
      return cost / 12;
    case 'one-time':
      return 0; // One-time payments don't contribute to monthly
    default:
      return cost; // Assume monthly if unknown
  }
}

export function calculateAnnualCost(cost: number, frequency: BillingFrequency): number {
  switch (frequency) {
    case 'weekly':
      return cost * 52;
    case 'monthly':
      return cost * 12;
    case 'quarterly':
      return cost * 4;
    case 'annual':
      return cost;
    case 'one-time':
      return cost;
    default:
      return cost * 12; // Assume monthly if unknown
  }
}
