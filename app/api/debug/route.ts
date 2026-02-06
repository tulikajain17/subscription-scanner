import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    return NextResponse.json({
      authenticated: !!session,
      hasAccessToken: !!session?.accessToken,
      user: session?.user?.email || null,
      tokenPreview: session?.accessToken
        ? `${session.accessToken.substring(0, 20)}...`
        : null,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
