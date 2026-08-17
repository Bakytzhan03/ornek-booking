import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createUser(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'BUSINESS_OWNER' | 'STAFF' | 'MANAGER';
}) {
  const hashedPassword = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
    },
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      ownedBusinesses: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
      staffProfiles: {
        take: 1,
        include: {
          business: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  // Determine businessId based on role
  let businessId = '';
  if (user.role === 'BUSINESS_OWNER' && user.ownedBusinesses.length > 0) {
    businessId = user.ownedBusinesses[0].id;
  } else if ((user.role === 'STAFF' || user.role === 'MANAGER') && user.staffProfiles.length > 0) {
    businessId = user.staffProfiles[0].businessId;
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    businessId,
  };
}
