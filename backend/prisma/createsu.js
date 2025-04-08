/*
 * Complete this script so that it is able to add a superuser to the database
 * Usage example: 
 *   node prisma/createsu.js clive123 clive.su@mail.utoronto.ca SuperUser123!
 */
'use strict';

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Create a Prisma client instance
const prisma = new PrismaClient();

// Get command line arguments
const args = process.argv.slice(2);

// Validate the command line arguments
if (args.length !== 3) {
  console.error('Usage: node prisma/createsu.js <utorid> <email> <password>');
  process.exit(1);
}

const [utorid, email, password] = args;

// Validate utorid
if (!/^[a-zA-Z0-9]{8}$/.test(utorid)) {
  console.error('Error: utorid must be 8 alphanumeric characters');
  process.exit(1);
}

// Validate email
if (!/^[a-zA-Z0-9._%+-]+@mail\.utoronto\.ca$/.test(email)) {
  console.error('Error: email must be a valid University of Toronto email');
  process.exit(1);
}

// Validate password
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
if (!passwordRegex.test(password)) {
  console.error('Error: password must be 8-20 characters with at least one uppercase letter, one lowercase letter, one number, and one special character');
  process.exit(1);
}

async function createSuperUser() {
  try {
    // Check if user with the same utorid or email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { utorid },
          { email }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.utorid === utorid) {
        console.error(`Error: User with utorid ${utorid} already exists`);
      } else {
        console.error(`Error: User with email ${email} already exists`);
      }
      process.exit(1);
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the superuser
    const superuser = await prisma.user.create({
      data: {
        utorid,
        email,
        password: hashedPassword,
        name: `Superuser ${utorid}`,
        role: 'superuser',
        verified: true,    // Set verified flag to true
        isActive: true,    // Activate the account
        points: 0
      }
    });

    console.log(`Superuser created successfully:
  ID: ${superuser.id}
  UTORid: ${superuser.utorid}
  Email: ${superuser.email}
  Role: ${superuser.role}
  Verified: ${superuser.verified}`);

  } catch (error) {
    console.error('Error creating superuser:', error);
    process.exit(1);
  } finally {
    // Disconnect from the Prisma client
    await prisma.$disconnect();
  }
}

// Execute the function
createSuperUser();