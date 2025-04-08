const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper function to generate random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random number within a range
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function seedUsers() {
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('Password123!', salt);

  const users = [
    // Superuser
    {
      utorid: 'admin001',
      name: 'System Administrator',
      email: 'admin@utoronto.ca',
      password: defaultPassword,
      role: 'superuser',
      verified: true,
      isActive: true,
      points: 500,
      birthday: '1990-01-01'
    },
    // Manager
    {
      utorid: 'manager001',
      name: 'Jane Manager',
      email: 'jane.manager@utoronto.ca',
      password: defaultPassword,
      role: 'manager',
      verified: true,
      isActive: true,
      points: 250,
      birthday: '1988-05-15'
    },
    // Cashier
    {
      utorid: 'cashier001',
      name: 'Bob Cashier',
      email: 'bob.cashier@utoronto.ca',
      password: defaultPassword,
      role: 'cashier',
      verified: true,
      isActive: true,
      points: 100,
      birthday: '1995-07-20'
    },
    // Regular Users
    {
      utorid: 'student001',
      name: 'Alice Student',
      email: 'alice.student@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      isActive: true,
      points: 75,
      birthday: '2000-03-10'
    },
    {
      utorid: 'student002',
      name: 'Charlie Brown',
      email: 'charlie.brown@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      isActive: true,
      points: 150,
      birthday: '1999-11-05'
    },
    {
      utorid: 'student003',
      name: 'Emma Wilson',
      email: 'emma.wilson@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: false,
      isActive: true,
      points: 25,
      birthday: '2001-06-15'
    },
    {
      utorid: 'student004',
      name: 'David Lee',
      email: 'david.lee@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      isActive: true,
      points: 200,
      birthday: '1998-09-25'
    },
    {
      utorid: 'student005',
      name: 'Sarah Kim',
      email: 'sarah.kim@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      isActive: true,
      points: 300,
      birthday: '2002-02-14'
    },
    {
      utorid: 'student006',
      name: 'Michael Chen',
      email: 'michael.chen@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      isActive: true,
      points: 50,
      birthday: '2000-12-01'
    },
    {
      utorid: 'student007',
      name: 'Olivia Park',
      email: 'olivia.park@utoronto.ca',
      password: defaultPassword,
      role: 'regular',
      verified: true,
      isActive: true,
      points: 175,
      birthday: '1999-07-07'
    }
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.create({
      data: userData
    });
    createdUsers.push(user);
  }

  return createdUsers;
}

async function seedEvents() {
  const events = [
    {
      name: 'Hackathon 2025',
      description: 'Annual university hackathon',
      location: 'BA Building',
      startTime: new Date('2025-02-15T09:00:00Z'),
      endTime: new Date('2025-02-16T17:00:00Z'),
      capacity: 100,
      points: 500,
      pointsRemain: 500,
      published: true
    },
    {
      name: 'Research Symposium',
      description: 'Undergraduate research presentations',
      location: 'Sanford Fleming Building',
      startTime: new Date('2025-03-20T10:00:00Z'),
      endTime: new Date('2025-03-20T16:00:00Z'),
      capacity: 50,
      points: 300,
      pointsRemain: 300,
      published: true
    },
    {
      name: 'Cultural Night',
      description: 'Multicultural student event',
      location: 'Student Center',
      startTime: new Date('2025-04-05T18:00:00Z'),
      endTime: new Date('2025-04-05T22:00:00Z'),
      capacity: 200,
      points: 400,
      pointsRemain: 400,
      published: true
    },
    {
      name: 'Sustainability Workshop',
      description: 'Environmental awareness session',
      location: 'Earth Sciences Building',
      startTime: new Date('2025-05-10T14:00:00Z'),
      endTime: new Date('2025-05-10T16:00:00Z'),
      capacity: null,
      points: 250,
      pointsRemain: 250,
      published: true
    },
    {
      name: 'Mental Health Seminar',
      description: 'Student wellness initiative',
      location: 'Medical Sciences Building',
      startTime: new Date('2025-06-15T13:00:00Z'),
      endTime: new Date('2025-06-15T15:00:00Z'),
      capacity: 75,
      points: 200,
      pointsRemain: 200,
      published: true
    }
  ];

  const createdEvents = [];
  for (const eventData of events) {
    const event = await prisma.event.create({
      data: eventData
    });
    createdEvents.push(event);
  }

  return createdEvents;
}

async function seedPromotions() {
  const promotions = [
    {
      name: 'Welcome Bonus',
      description: 'Extra points for new members',
      type: 'one-time',
      startTime: new Date('2025-01-01T00:00:00Z'),
      endTime: new Date('2025-12-31T23:59:59Z'),
      points: 50,
      isOneTime: true
    },
    {
      name: 'Summer Sale Boost',
      description: 'Earn extra points during summer',
      type: 'automatic',
      startTime: new Date('2025-06-01T00:00:00Z'),
      endTime: new Date('2025-08-31T23:59:59Z'),
      minSpending: 50,
      rate: 0.02,
      isOneTime: false
    },
    {
      name: 'Referral Bonus',
      description: 'Points for referring friends',
      type: 'one-time',
      startTime: new Date('2025-02-01T00:00:00Z'),
      endTime: new Date('2025-04-30T23:59:59Z'),
      points: 100,
      isOneTime: true
    },
    {
      name: 'Weekend Special',
      description: 'Extra points on weekend purchases',
      type: 'automatic',
      startTime: new Date('2025-01-01T00:00:00Z'),
      endTime: new Date('2025-12-31T23:59:59Z'),
      minSpending: 25,
      rate: 0.01,
      isOneTime: false
    },
    {
      name: 'Holiday Cashback',
      description: 'Bonus points during holiday season',
      type: 'automatic',
      startTime: new Date('2025-11-15T00:00:00Z'),
      endTime: new Date('2025-12-31T23:59:59Z'),
      minSpending: 100,
      points: 25,
      isOneTime: false
    }
  ];

  const createdPromotions = [];
  for (const promotionData of promotions) {
    const promotion = await prisma.promotion.create({
      data: promotionData
    });
    createdPromotions.push(promotion);
  }

  return createdPromotions;
}

async function seedTransactions(users, events, promotions) {
  const transactionTypes = ['purchase', 'redemption', 'adjustment', 'transfer', 'event'];
  const transactions = [];

  const createTransaction = async (type, user, additionalData = {}) => {
    const cashierOrManager = users.find(u => u.role === 'cashier' || u.role === 'manager');

    const baseTransaction = {
      user: { connect: { id: user.id } },
      type,
      createdBy: { connect: { id: cashierOrManager.id } },
      amount: 0,
      createdAt: randomDate(new Date(2024, 0, 1), new Date(2025, 11, 31))
    };

    switch (type) {
      case 'purchase':
        return prisma.transaction.create({
          data: {
            ...baseTransaction,
            type: 'purchase',
            amount: randomNumber(10, 100),
            spent: randomNumber(10, 100),
            suspicious: Math.random() < 0.1, // 10% chance of being suspicious
            appliedPromotions: {
              create: Math.random() < 0.5 ? [{
                promotion: { 
                  connect: { id: promotions[randomNumber(0, promotions.length - 1)].id } 
                }
              }] : []
            }
          }
        });

      case 'redemption':
        return prisma.transaction.create({
          data: {
            ...baseTransaction,
            type: 'redemption',
            amount: -randomNumber(50, 200),
            processed: Math.random() < 0.8, // 80% processed
            processedBy: { 
              connect: { id: users.find(u => u.role === 'cashier')?.id } 
            }
          }
        });

      case 'adjustment':
        return prisma.transaction.create({
          data: {
            ...baseTransaction,
            type: 'adjustment',
            amount: randomNumber(-50, 50),
            relatedId: transactions.length > 0 
              ? transactions[randomNumber(0, transactions.length - 1)].id 
              : undefined
          }
        });

      case 'transfer':
        const recipient = users[randomNumber(0, users.length - 1)];
        return prisma.transaction.create({
          data: {
            ...baseTransaction,
            type: 'transfer',
            amount: -randomNumber(10, 100),
            recipient: { connect: { id: recipient.id } },
            sender: { connect: { id: user.id } }
          }
        });

      case 'event':
        return prisma.transaction.create({
          data: {
            ...baseTransaction,
            type: 'event',
            amount: randomNumber(10, 50),
            event: { 
              connect: { id: events[randomNumber(0, events.length - 1)].id } 
            }
          }
        });
    }
  };

  // Create at least 2 transactions of each type
  for (const type of transactionTypes) {
    for (let i = 0; i < 6; i++) {
      const user = users[randomNumber(0, users.length - 1)];
      const transaction = await createTransaction(type, user);
      transactions.push(transaction);
    }
  }

  return transactions;
}

async function main() {
  // Clear existing data
  await prisma.transactionPromotion.deleteMany();
  await prisma.promotionUsage.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.eventGuest.deleteMany();
  await prisma.eventOrganizer.deleteMany();
  await prisma.event.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // Seed users first
  const users = await seedUsers();
  console.log(`Seeded ${users.length} users`);

  // Seed events
  const events = await seedEvents();
  console.log(`Seeded ${events.length} events`);

  // Seed promotions
  const promotions = await seedPromotions();
  console.log(`Seeded ${promotions.length} promotions`);

  // Seed transactions
  const transactions = await seedTransactions(users, events, promotions);
  console.log(`Seeded ${transactions.length} transactions`);

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
});