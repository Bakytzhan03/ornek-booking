import { SessionOptions } from 'iron-session';

export interface SessionData {
  userId: string;
  email: string;
  businessId: string;
  role: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_production_use',
  cookieName: 'ornek_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export const defaultSession: SessionData = {
  userId: '',
  email: '',
  businessId: '',
  role: '',
  isLoggedIn: false,
};
