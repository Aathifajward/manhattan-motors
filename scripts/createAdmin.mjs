import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/createAdmin.mjs <email> <password>");
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

const admin = await prisma.adminUser.upsert({
  where: { email },
  update: { passwordHash },
  create: { email, passwordHash, role: "owner" },
});

console.log("Admin user ready:", admin.email);
await prisma.$disconnect();
