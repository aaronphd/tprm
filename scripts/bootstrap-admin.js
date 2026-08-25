// Idempotent admin-account bootstrap for a fresh self-hosted instance.
// Run automatically on container start (see docker-entrypoint.sh) and
// available locally via `npm run create-admin`. Reads ADMIN_EMAIL /
// ADMIN_PASSWORD / ADMIN_NAME from the environment; does nothing if
// ADMIN_EMAIL / ADMIN_PASSWORD aren't set, or if that email already exists.

const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("node:crypto");

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin bootstrap.");
    return;
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`Admin user ${email} already exists — skipping.`);
      return;
    }
    await prisma.user.create({
      data: {
        email,
        passwordHash: hashPassword(password),
        name: process.env.ADMIN_NAME?.trim() || null,
      },
    });
    console.log(`Created admin user ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
