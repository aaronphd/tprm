import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { iso27001 } from "./data/iso27001";
import { iso42001 } from "./data/iso42001";
import { soc2 } from "./data/soc2";
import type { FrameworkSeed } from "./data/types";

const prisma = new PrismaClient();

async function seedFramework(fw: FrameworkSeed) {
  const framework = await prisma.framework.upsert({
    where: { slug: fw.slug },
    update: { name: fw.name, version: fw.version, description: fw.description },
    create: {
      slug: fw.slug,
      name: fw.name,
      version: fw.version,
      description: fw.description,
    },
  });

  let domainSort = 0;
  let controlCount = 0;
  for (const d of fw.domains) {
    domainSort += 1;
    const domain = await prisma.domain.upsert({
      where: { frameworkId_code: { frameworkId: framework.id, code: d.code } },
      update: { title: d.title, sortOrder: domainSort },
      create: {
        frameworkId: framework.id,
        code: d.code,
        title: d.title,
        sortOrder: domainSort,
      },
    });

    let controlSort = 0;
    for (const c of d.controls) {
      controlSort += 1;
      controlCount += 1;
      await prisma.control.upsert({
        where: { domainId_code: { domainId: domain.id, code: c.code } },
        update: { title: c.title, description: c.description, sortOrder: controlSort },
        create: {
          domainId: domain.id,
          code: c.code,
          title: c.title,
          description: c.description,
          sortOrder: controlSort,
        },
      });
    }
  }

  console.log(`  ${fw.name}: ${fw.domains.length} domains, ${controlCount} controls`);
}

async function seedAdminUser() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`  Admin user already exists: ${email}`);
    return;
  }

  const password = process.env.SEED_ADMIN_PASSWORD ?? Math.random().toString(36).slice(2, 12);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name: "Admin", email, passwordHash },
  });

  console.log(`  Created admin user: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`  Generated password (save this, it will not be shown again): ${password}`);
  }
}

async function main() {
  console.log("Seeding frameworks...");
  await seedFramework(iso27001);
  await seedFramework(iso42001);
  await seedFramework(soc2);

  console.log("Seeding admin user...");
  await seedAdminUser();

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
