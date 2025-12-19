// db.js
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Create pool with SSL options for Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Neon requires SSL
  },
});

// Test connection
try {
  const client = await pool.connect();
  console.log("Connected to PostgreSQL (Neon) ✅");
  client.release();
} catch (err) {
  console.error("PostgreSQL connection error ❌", err.stack);
}

// Helper function to run queries
export const query = (text, params) => pool.query(text, params);

export default pool;
