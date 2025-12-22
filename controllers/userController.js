// userController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pool from "../dase.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// ============================
// REGISTER SCHOOL
// ============================

export const registerSchool = async (req, res) => {
  const client = await pool.connect(); // get a client from the pool
  try {
    const {
      email,
      password,
      confirmpassword,
      name,
      description,
      phone,
      address,
    } = req.body;

    // 1️⃣ Validate required fields
    for (const [key, val] of Object.entries(req.body)) {
      if (!val) return res.status(400).json({ message: `${key} is required!` });
    }

    // 2️⃣ Password validation
    const passwordRegex = /^[A-Z](?=.*[\W_])/;
    if (!passwordRegex.test(password))
      return res.status(400).json({
        message:
          "Password must start with a capital letter and contain at least one special character.",
      });

    if (password !== confirmpassword)
      return res.status(400).json({ message: "Passwords do not match!" });

    // 3️⃣ Handle image upload (optional)
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(
        req.file.buffer,
        "image",
        "school_images"
      );
    }

    // 4️⃣ Check if email already exists
    const { rows: existingRows } = await client.query(
      "SELECT 1 FROM school WHERE email = $1",
      [email]
    );
    if (existingRows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 5️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Insert new school
    const insertQuery = `
      INSERT INTO school (email, password, name, image, description, phone, address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, name, image, description, phone, address
    `;
    const { rows } = await client.query(insertQuery, [
      email,
      hashedPassword,
      name,
      imageUrl,
      description,
      phone,
      address,
    ]);

    res.status(201).json({
      success: true,
      message: "School registered successfully.",
      data: rows[0],
    });
  } catch (err) {
    console.error("Register school error:", err);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release(); // release client back to pool
  }
};

// ============================
// LOGIN
// ============================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM school WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d",
    });

    // Send token via HTTP-only cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
    });

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: false, // disable secure on localhost
      sameSite: "Lax",
      expires: new Date(Date.now() + 2 * 60 * 60 * 1000),
    });
    // Send user info separately
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      message: "Login successful",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// GET USER BY ID
// ============================
export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM school WHERE id=$1", [id]);
    const user = result.rows[0];

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// GET ALL USERS
// ============================
export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM school");
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// DELETE USER
// ============================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM school WHERE id=$1", [id]);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// RECOVER ACCOUNT
// ============================
export const recoverAccount = async (req, res) => {
  try {
    const { email } = req.body;

    const result = await pool.query("SELECT * FROM school WHERE email=$1", [
      email,
    ]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: "User not found" });

    const recoveryToken = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE school SET recovery_token=$1 WHERE id=$2", [
      recoveryToken,
      user.id,
    ]);

    const recoverLink = `${CLIENT_URL}/recover/${recoveryToken}`;
    await transporter.sendMail({
      from: `"CBT System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Recover Your Account",
      html: `<p>Hi ${user.name},</p>
             <p>Click here to reset your password:</p>
             <a href="${recoverLink}">Reset Password</a>`,
    });

    res.status(200).json({ message: "Recovery email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================
// RESET PASSWORD
// ============================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6)
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });

    const result = await pool.query(
      "SELECT * FROM school WHERE recovery_token=$1",
      [token]
    );
    const user = result.rows[0];

    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired recovery token" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE school SET password=$1, recovery_token=NULL WHERE id=$2",
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
