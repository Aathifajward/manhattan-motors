import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query: string): Promise<string> =>
  new Promise((resolve) => rl.question(query, resolve));

async function main() {
  const defaultEmail = "aathif57@gmail.com";
  let email = process.env.ADMIN_EMAIL;
  
  if (!email && process.stdin.isTTY) {
    const input = await askQuestion(`Enter admin email (default: ${defaultEmail}): `);
    email = input || defaultEmail;
  } else {
    email = email || defaultEmail;
  }
  
  let password = process.env.ADMIN_PASSWORD;
  if (!password && process.stdin.isTTY) {
    const input = await askQuestion("Enter admin password: ");
    password = input;
  }
  
  if (!password) {
    console.error("Error: password is required. Set ADMIN_PASSWORD env var or run in TTY.");
    process.exit(1);
  }

  rl.close();

  console.log(`Creating/updating admin user: ${email}...`);
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email },
    update: { passwordHash, role: "owner" },
    create: {
      email,
      passwordHash,
      role: "owner",
    },
  });

  console.log(`Admin user ${admin.email} created/updated successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    rl.close();
  });
