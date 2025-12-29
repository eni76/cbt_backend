// userController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import pool from "../dase.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { generalMails } from "../config/email.js";
import e from "express";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

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
      RETURNING  id, email, name, image, description, phone, address
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

    const token = jwt.sign(
      { id: rows[0].id, email: rows[0].email },
      JWT_SECRET,
      {
        expiresIn: "10m",
      }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verifyemail/${token}`;

    const message = `<p>Hi <b>${name}</b>,</p>
    <p>Welcome to Cbt We're excited to have you on board.</p>
<a href="${verificationLink}" 
   style="
     display: inline-block;
     padding: 12px 24px;
     font-size: 16px;
     color: #ffffff;
     background-color: #007bff;
     text-decoration: none;
     border-radius: 6px;
     font-weight: bold;
   ">
   Verify Email
</a>
    <p>Your account has been successfully created with the following details:</p><br>
    <ul>
      <li><strong>Name:</strong> ${name}</li>
      <li><strong>Email:</strong> ${email}</li>
      <li><strong>Phone:</strong> ${phone}</li>
      <li><strong>Description:</strong> ${description}</li>
      <li><strong>Address:</strong> ${address}</li>
    </ul>`;

    // Send welcome email
    await generalMails(email, message);

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

    // Send verification email if not verified
    if (!user.verified) {
      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: "10m",
      });

      const verificationLink = `${process.env.FRONTEND_URL}/verifyemail/${token}`;

      const message = `<p>Hi <b>${user.name}</b>,</p>
    <p>The email ${user.email} has not been verified. Click on the link belkow to verify.</p>
<a href="${verificationLink}" 
   style="
     display: inline-block;
     padding: 12px 24px;
     font-size: 16px;
     color: #ffffff;
     background-color: #007bff;
     text-decoration: none;
     border-radius: 6px;
     font-weight: bold;
   ">
   Verify Email
</a>
   `;

      // Send welcome email
      await generalMails(email, message);

      return res.status(400).json({
        success: false,
        message: "Email not verified. Verification email sent.",
      });
    }

    res.status(200).json({
      success: true,
      token,
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

    const result = await pool.query("SELECT * FROM school WHERE email=$1", [email]);
    const user = result.rows[0];

    // Always respond the same way for security
    if (!user) {
      return res.status(200).json({
        message: "If this email exists, a recovery link has been sent",
      });
    }

    // Generate a JWT token that expires quickly (e.g., 10 minutes)
    const recoveryToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    const recoverLink = `${process.env.FRONTEND_URL}/verifyemail/${recoveryToken}`;

    await transporter.sendMail({
      from: `"CBT System" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Recover Your Account",
      html: `<p>Hi ${user.name},</p>
             <p>Click here to reset your password:</p>
             <a href="${recoverLink}">Reset Password</a>`,
    });

    const message = `<p>Hi <b>${user.name}</b>,</p>
    <p>Click the link below to reset your password:</p>
    <a href="${recoverLink}">Reset Password</a>`;

    generalMails(email, message, subject = "Recover Your Account");

    res.status(200).json({
      message: "If this email exists, a recovery link has been sent",
    });
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

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const userResult = await pool.query(
      `SELECT id, verified FROM school WHERE email = $1`,
      [decoded.email]
    );

    if (userResult.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification link",
      });
    }

    const user = userResult.rows[0];

    // Prevent re-verification
    if (user.verified) {
      return res.status(400).json({
        success: false,
        message: "Email already verified",
      });
    }

    // ✅ Update ONLY this user
    await pool.query(
      `
      UPDATE school
      SET verified = TRUE
      WHERE id = $1
      `,
      [user.id]
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    if (error.name === "TokenExpiredError") {
      return res.status(400).json({
        success: false,
        message: "Verification link has expired",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while verifying email",
    });
  }
};
