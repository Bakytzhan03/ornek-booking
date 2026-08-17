import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData, defaultSession } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);

    // Clear session
    session.userId = defaultSession.userId;
    session.email = defaultSession.email;
    session.businessId = defaultSession.businessId;
    session.role = defaultSession.role;
    session.isLoggedIn = defaultSession.isLoggedIn;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
