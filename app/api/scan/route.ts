import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import {
  createGmailClient,
  searchEmails,
  getEmailDetails,
  SUBSCRIPTION_QUERIES,
} from '@/lib/gmail';
import { EmailSummary } from '@/types/subscription';

export const maxDuration = 60; // Allow up to 60 seconds for scanning

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in with Google' },
        { status: 401 }
      );
    }

    const client = createGmailClient(session.accessToken);

    // Collect all unique email IDs from different search queries
    const emailIdSet = new Set<string>();
    const searchResults: { query: string; count: number }[] = [];

    for (const query of SUBSCRIPTION_QUERIES) {
      try {
        const ids = await searchEmails(client, query, 50);
        ids.forEach((id) => emailIdSet.add(id));
        searchResults.push({ query: query.substring(0, 50), count: ids.length });
      } catch (error) {
        console.error(`Error with query "${query}":`, error);
        // Continue with other queries even if one fails
      }
    }

    const emailIds = Array.from(emailIdSet);

    return NextResponse.json({
      success: true,
      emailIds,
      totalFound: emailIds.length,
      searchResults,
    });
  } catch (error) {
    console.error('Scan error:', error);

    // Handle specific Gmail API errors
    if (error instanceof Error) {
      if (error.message.includes('invalid_grant')) {
        return NextResponse.json(
          { error: 'Session expired. Please sign in again.' },
          { status: 401 }
        );
      }
      if (error.message.includes('Rate Limit')) {
        return NextResponse.json(
          { error: 'Gmail rate limit reached. Please try again in a few minutes.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to scan emails. Please try again.' },
      { status: 500 }
    );
  }
}

// POST endpoint to fetch details for specific email IDs
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

    // Fetch email details in batches
    const batchSize = 10;
    const emails: EmailSummary[] = [];

    for (let i = 0; i < emailIds.length; i += batchSize) {
      const batch = emailIds.slice(i, i + batchSize);

      const batchPromises = batch.map((id) => getEmailDetails(client, id));
      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result) {
          emails.push(result);
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + batchSize < emailIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
    });
  } catch (error) {
    console.error('Fetch emails error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch email details' },
      { status: 500 }
    );
  }
}
