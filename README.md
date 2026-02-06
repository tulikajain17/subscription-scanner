# Subscription Scanner

A web app that scans your Gmail to find hidden subscriptions and recurring charges, helping you save money by identifying forgotten services.

## Features

- **Gmail OAuth Integration**: Secure read-only access to your emails
- **AI-Powered Parsing**: Uses Claude AI to extract subscription details from emails
- **Smart Categorization**: Automatically groups subscriptions by category (Streaming, Software, Fitness, etc.)
- **Activity Indicators**: See which subscriptions are actively used vs. forgotten
- **Cost Summary**: View total monthly and annual spending at a glance
- **Privacy-First**: No email content is stored - only extracted subscription data

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: NextAuth.js with Google OAuth
- **Email API**: Gmail API (read-only)
- **AI**: Claude API (Anthropic)
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google Cloud Console account (for OAuth credentials)
- Anthropic API key (for Claude)

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/subscription-scanner.git
   cd subscription-scanner
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Google OAuth**

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Gmail API
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy the Client ID and Client Secret

4. **Get Anthropic API Key**

   - Go to [Anthropic Console](https://console.anthropic.com/)
   - Create an API key

5. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your credentials:

   ```
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ANTHROPIC_API_KEY=your_anthropic_api_key
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   ```

   Generate NEXTAUTH_SECRET with:
   ```bash
   openssl rand -base64 32
   ```

6. **Run the development server**

   ```bash
   npm run dev
   ```

7. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
subscription-scanner/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # OAuth handlers
│   │   ├── scan/route.ts                # Gmail search endpoint
│   │   └── parse/route.ts               # AI parsing endpoint
│   ├── dashboard/page.tsx               # Results dashboard
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout
│   ├── page.tsx                         # Landing page
│   └── providers.tsx                    # Session provider
├── components/
│   ├── CategoryGroup.tsx                # Category grouping component
│   ├── ScanProgress.tsx                 # Scanning progress indicator
│   ├── SubscriptionCard.tsx             # Individual subscription card
│   └── SummaryCard.tsx                  # Cost summary component
├── lib/
│   ├── claude.ts                        # Claude API helpers
│   └── gmail.ts                         # Gmail API helpers
├── types/
│   ├── next-auth.d.ts                   # NextAuth type extensions
│   └── subscription.ts                  # Subscription types
├── .env.example                         # Environment template
├── next.config.js                       # Next.js configuration
├── package.json                         # Dependencies
├── tailwind.config.ts                   # Tailwind configuration
└── tsconfig.json                        # TypeScript configuration
```

## How It Works

1. **Authentication**: User connects their Gmail account via OAuth 2.0 with read-only scope
2. **Email Search**: The app searches Gmail for subscription-related emails using multiple queries
3. **AI Parsing**: Each relevant email is sent to Claude AI to extract subscription details
4. **Deduplication**: Multiple emails from the same service are merged into one subscription
5. **Display**: Results are shown grouped by category with cost totals

## API Routes

### GET /api/scan
Searches Gmail for subscription-related emails and returns email IDs.

### POST /api/parse
Takes email IDs and uses Claude AI to extract subscription details.

## Security & Privacy

- **Read-Only Access**: Only requests Gmail read permission, never write access
- **No Email Storage**: Full email content is never stored
- **Session-Based**: OAuth tokens are encrypted and session-bound
- **Easy Disconnect**: Users can revoke access anytime from Google settings

## Subscription Categories

- Streaming & Entertainment
- Software & Apps
- Fitness & Health
- News & Media
- Gaming
- Productivity
- Cloud & Storage
- Food & Delivery
- Shopping & Retail
- Finance & Banking
- Education & Learning
- Other

## Known Services

The app recognizes 50+ common subscription services including:
- Netflix, Spotify, Hulu, Disney+, HBO Max
- Adobe, Microsoft, Google, Apple
- Dropbox, Notion, Slack, Zoom
- Planet Fitness, Peloton, Headspace
- NY Times, Medium, Substack
- And many more...

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.

## Disclaimer

This app is for personal use to help identify subscriptions. Always verify subscription details before taking action. The AI parsing may occasionally make errors - review results carefully.
