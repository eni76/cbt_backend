// config/prisma.js
import pkg from '../generated/prisma/index.js'; // ← must point to index.js
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
export default prisma;
