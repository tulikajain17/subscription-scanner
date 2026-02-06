import { google, gmail_v1 } from 'googleapis';
import { EmailSummary } from '@/types/subscription';

// Search queries to find subscription-related emails
export const SUBSCRIPTION_QUERIES = [
  'subject:(subscription OR renewal OR payment OR receipt OR invoice OR billing)',
  'subject:(your order OR order confirmation OR purchase)',
  'from:(netflix OR spotify OR adobe OR apple OR amazon OR google OR microsoft)',
  'from:(hulu OR disney OR hbo OR paramount OR peacock)',
  'from:(dropbox OR notion OR slack OR zoom OR figma OR canva)',
  'from:(gym OR fitness OR peloton OR classpass)',
  'from:(nytimes OR wsj OR medium OR substack)',
  '("recurring charge" OR "billed monthly" OR "auto-renew" OR "subscription renewal")',
  '("monthly subscription" OR "annual subscription" OR "yearly subscription")',
  '("payment received" OR "payment successful" OR "charge of")',
];

// Common subscription services for better detection
export const KNOWN_SERVICES: Record<string, { name: string; category: string }> = {
  'netflix.com': { name: 'Netflix', category: 'streaming' },
  'spotify.com': { name: 'Spotify', category: 'streaming' },
  'apple.com': { name: 'Apple', category: 'software' },
  'amazon.com': { name: 'Amazon', category: 'shopping' },
  'hulu.com': { name: 'Hulu', category: 'streaming' },
  'disneyplus.com': { name: 'Disney+', category: 'streaming' },
  'hbomax.com': { name: 'HBO Max', category: 'streaming' },
  'max.com': { name: 'Max', category: 'streaming' },
  'paramountplus.com': { name: 'Paramount+', category: 'streaming' },
  'peacocktv.com': { name: 'Peacock', category: 'streaming' },
  'youtube.com': { name: 'YouTube Premium', category: 'streaming' },
  'adobe.com': { name: 'Adobe', category: 'software' },
  'microsoft.com': { name: 'Microsoft', category: 'software' },
  'google.com': { name: 'Google', category: 'software' },
  'dropbox.com': { name: 'Dropbox', category: 'cloud' },
  'notion.so': { name: 'Notion', category: 'productivity' },
  'slack.com': { name: 'Slack', category: 'productivity' },
  'zoom.us': { name: 'Zoom', category: 'productivity' },
  'figma.com': { name: 'Figma', category: 'software' },
  'canva.com': { name: 'Canva', category: 'software' },
  'github.com': { name: 'GitHub', category: 'software' },
  'linkedin.com': { name: 'LinkedIn Premium', category: 'productivity' },
  'openai.com': { name: 'OpenAI', category: 'software' },
  'anthropic.com': { name: 'Anthropic', category: 'software' },
  'grammarly.com': { name: 'Grammarly', category: 'productivity' },
  'evernote.com': { name: 'Evernote', category: 'productivity' },
  'todoist.com': { name: 'Todoist', category: 'productivity' },
  'nytimes.com': { name: 'NY Times', category: 'news' },
  'wsj.com': { name: 'Wall Street Journal', category: 'news' },
  'washingtonpost.com': { name: 'Washington Post', category: 'news' },
  'medium.com': { name: 'Medium', category: 'news' },
  'substack.com': { name: 'Substack', category: 'news' },
  'planetfitness.com': { name: 'Planet Fitness', category: 'fitness' },
  'equinox.com': { name: 'Equinox', category: 'fitness' },
  'onepeloton.com': { name: 'Peloton', category: 'fitness' },
  'classpass.com': { name: 'ClassPass', category: 'fitness' },
  'headspace.com': { name: 'Headspace', category: 'fitness' },
  'calm.com': { name: 'Calm', category: 'fitness' },
  'doordash.com': { name: 'DoorDash', category: 'food' },
  'ubereats.com': { name: 'Uber Eats', category: 'food' },
  'grubhub.com': { name: 'Grubhub', category: 'food' },
  'instacart.com': { name: 'Instacart', category: 'food' },
  'playstation.com': { name: 'PlayStation', category: 'gaming' },
  'xbox.com': { name: 'Xbox', category: 'gaming' },
  'nintendo.com': { name: 'Nintendo', category: 'gaming' },
  'ea.com': { name: 'EA', category: 'gaming' },
  'steam.com': { name: 'Steam', category: 'gaming' },
  'steampowered.com': { name: 'Steam', category: 'gaming' },
  'coursera.org': { name: 'Coursera', category: 'education' },
  'udemy.com': { name: 'Udemy', category: 'education' },
  'skillshare.com': { name: 'Skillshare', category: 'education' },
  'masterclass.com': { name: 'MasterClass', category: 'education' },
  'duolingo.com': { name: 'Duolingo', category: 'education' },
};

export interface GmailClient {
  gmail: gmail_v1.Gmail;
}

export function createGmailClient(accessToken: string): GmailClient {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: 'v1', auth });
  return { gmail };
}

export async function searchEmails(
  client: GmailClient,
  query: string,
  maxResults: number = 100
): Promise<string[]> {
  try {
    // Calculate date 12 months ago
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const afterDate = twelveMonthsAgo.toISOString().split('T')[0].replace(/-/g, '/');

    const fullQuery = `${query} after:${afterDate}`;

    const response = await client.gmail.users.messages.list({
      userId: 'me',
      q: fullQuery,
      maxResults,
    });

    return response.data.messages?.map((m) => m.id!) || [];
  } catch (error) {
    console.error('Error searching emails:', error);
    throw error;
  }
}

export async function getEmailDetails(
  client: GmailClient,
  messageId: string
): Promise<EmailSummary | null> {
  try {
    const response = await client.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const date = getHeader('Date');

    // Extract body content
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      for (const part of message.payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        } else if (part.mimeType === 'text/html' && part.body?.data && !body) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }

    // Truncate body to first 2000 chars for AI processing
    const truncatedBody = body.substring(0, 2000);

    return {
      id: messageId,
      subject,
      snippet: message.snippet || '',
      date,
      from,
    };
  } catch (error) {
    console.error('Error getting email details:', error);
    return null;
  }
}

export async function getEmailContent(
  client: GmailClient,
  messageId: string
): Promise<{ subject: string; from: string; body: string; date: string } | null> {
  try {
    const response = await client.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = response.data;
    const headers = message.payload?.headers || [];

    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || '';

    const subject = getHeader('Subject');
    const from = getHeader('From');
    const date = getHeader('Date');

    // Extract body content
    let body = '';
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
    } else if (message.payload?.parts) {
      const extractParts = (parts: gmail_v1.Schema$MessagePart[]): string => {
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return Buffer.from(part.body.data, 'base64').toString('utf-8');
          }
          if (part.parts) {
            const nested = extractParts(part.parts);
            if (nested) return nested;
          }
        }
        // Fall back to HTML if no plain text
        for (const part of parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
            // Basic HTML stripping
            return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
        return '';
      };
      body = extractParts(message.payload.parts);
    }

    // Truncate body for AI processing (keep relevant content)
    const truncatedBody = body.substring(0, 3000);

    return {
      subject,
      from,
      body: truncatedBody,
      date,
    };
  } catch (error) {
    console.error('Error getting email content:', error);
    return null;
  }
}

export function extractDomain(email: string): string {
  // Extract domain from email address like "Netflix <info@netflix.com>"
  const match = email.match(/@([a-zA-Z0-9.-]+)/);
  if (match) {
    return match[1].toLowerCase();
  }
  return '';
}

export function getServiceFromDomain(domain: string): { name: string; category: string } | null {
  // Check known services
  for (const [knownDomain, info] of Object.entries(KNOWN_SERVICES)) {
    if (domain.includes(knownDomain) || knownDomain.includes(domain)) {
      return info;
    }
  }
  return null;
}
