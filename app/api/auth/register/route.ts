import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { sessionOptions, SessionData } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, businessName, businessCity, businessAddress } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !businessName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user and business in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'BUSINESS_OWNER',
        },
      });

      // Create business slug from name
      const slug = businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') + '-' + Date.now();

      // Create business
      const business = await tx.business.create({
        data: {
          name: businessName,
          slug,
          address: businessAddress || 'Not specified',
          city: businessCity || 'Not specified',
          country: 'Kazakhstan',
          timezone: 'Asia/Almaty',
          phone: '+7',
          email: email,
          ownerId: user.id,
        },
      });

      return { user, business };
    });

    // Create session
    const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
    session.userId = result.user.id;
    session.email = result.user.email;
    session.businessId = result.business.id;
    session.role = result.user.role;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      business: {
        id: result.business.id,
        name: result.business.name,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
