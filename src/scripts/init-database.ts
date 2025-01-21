import { prisma } from '../services/prisma.service';

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');

    // You can add any seed data here if needed
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error initializing database:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main(); 