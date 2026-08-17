import { afterAll } from 'vitest';
import { prisma } from '../lib/prisma';

// Cleanup after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
