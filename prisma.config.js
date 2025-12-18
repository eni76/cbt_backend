import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // In Prisma 7 the connection URL belongs *only* here
    url: env("DATABASE_URL"),
  },
});
