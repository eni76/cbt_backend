// db.js
import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST, // Supabase host
  port: process.env.DB_PORT, // Default PostgreSQL port (5432)
  user: process.env.DB_USERNAME, // Supabase username
  password: process.env.DB_PASSWORD, // Supabase password
  database: process.env.DB_DATABASE, // Supabase database
  ssl: { rejectUnauthorized: false }, // Needed for Supabase
});

// Test connection once
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Database connected successfully via Session Pooler");
    client.release(); // release back to pool
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
  }
})();

export default pool;