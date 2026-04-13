import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "news_portal",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Categories ---
  const business = await prisma.category.upsert({
    where: { name: "Business" },
    update: {},
    create: { name: "Business", description: "Business news and updates" },
  });

  const sports = await prisma.category.upsert({
    where: { name: "Sports" },
    update: {},
    create: { name: "Sports", description: "Sports news and events" },
  });

  const technology = await prisma.category.upsert({
    where: { name: "Technology" },
    update: {},
    create: { name: "Technology", description: "Technology news and innovations" },
  });

  // --- Users ---
  const adminPassword = await bcrypt.hash("admin123", 10);
  const authorPassword = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@newsportal.com",
      password: adminPassword,
      role: "admin",
    },
  });

  const businessAuthor = await prisma.user.upsert({
    where: { username: "business_author" },
    update: {},
    create: {
      username: "business_author",
      email: "business@newsportal.com",
      password: authorPassword,
      role: "author",
    },
  });

  const sportsAuthor = await prisma.user.upsert({
    where: { username: "sports_author" },
    update: {},
    create: {
      username: "sports_author",
      email: "sports@newsportal.com",
      password: authorPassword,
      role: "author",
    },
  });

  const techAuthor = await prisma.user.upsert({
    where: { username: "tech_author" },
    update: {},
    create: {
      username: "tech_author",
      email: "tech@newsportal.com",
      password: authorPassword,
      role: "author",
    },
  });

  // --- Author-Category Assignments ---
  await prisma.authorCategory.upsert({
    where: {
      unique_author_category: {
        authorId: businessAuthor.id,
        categoryId: business.id,
      },
    },
    update: {},
    create: { authorId: businessAuthor.id, categoryId: business.id },
  });

  await prisma.authorCategory.upsert({
    where: {
      unique_author_category: {
        authorId: sportsAuthor.id,
        categoryId: sports.id,
      },
    },
    update: {},
    create: { authorId: sportsAuthor.id, categoryId: sports.id },
  });

  await prisma.authorCategory.upsert({
    where: {
      unique_author_category: {
        authorId: techAuthor.id,
        categoryId: technology.id,
      },
    },
    update: {},
    create: { authorId: techAuthor.id, categoryId: technology.id },
  });

  console.log("Seed completed successfully.");
  console.log({ admin, businessAuthor, sportsAuthor, techAuthor });
  console.log({ business, sports, technology });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
