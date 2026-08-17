import { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { sessionOptions, SessionData } from './session';

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

export async function requireAuth() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.businessId) {
    throw new Error('Unauthorized');
  }

  return {
    userId: session.userId,
    email: session.email,
    businessId: session.businessId,
    role: session.role,
  };
}

export function getBusinessIdFromHeaders(request: NextRequest): string {
  const businessId = request.headers.get('x-business-id');
  if (!businessId) {
    throw new Error('Business ID not found in session');
  }
  return businessId;
}
