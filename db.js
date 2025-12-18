import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

export const prisma = new PrismaClient({
  adapter: process.env.DATABASE_URL, // same as in prisma.config.js
});
