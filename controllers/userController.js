import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { uploadToCloudinary } from "../utils/uploadToCloudinary";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// Email transporter (using SMTP for example)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true if 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const registerSchool = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      confirmpassword,
      description,
      phone,
      address,
    } = req.body;

    // check for missing fields
    const reqObject = req.body;

    for (let [key, val] of Object.entries(reqObject)) {
      if (!val) {
        return res.status(400).json({ message: `${key} is required!` });
      }
    }

    // Password validation
    const passwordRegex = /^[A-Z](?=.*[\W_])/;
    if (!passwordRegex.test(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong password format!" });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ message: "Passwords do not match!" });
    }

    // Check if image exist
    let imageUrl;
    if (req.file) {
      imageUrl = await uploadToCloudinary(
        req.file.buffer,
        "image",
        "user_images"
      );
    }

    // Check if school exists
    const existingschool = await prisma.school.findUnique({ where: { email } });
    if (existingschool)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

        // Send verification email
    // Create verification token
      // const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });

    // Save school to DB
    const newschool = await prisma.school.create({
      data: {
        email,
        name,
        password: hashedPassword,
        image: imageUrl || null,
        description,
        phone,
        address,
      },
    });



    res.status(201).json({
      message: "User registered. Check your email to verify your account.",
      data: newschool,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid verification token" });

    await prisma.user.update({
      where: { id: user.id },
      data: { verified: true, verificationToken: null },
    });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.verified)
      return res
        .status(401)
        .json({ message: "Please verify your email first" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: Number(id) } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const recoverAccount = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate recovery token
    const recoveryToken = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { recoveryToken },
    });

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

// Reset password controller
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params; // recovery token from the link
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Find user with matching recovery token
    const user = await prisma.user.findFirst({
      where: { recoveryToken: token },
    });
    if (!user)
      return res
        .status(400)
        .json({ message: "Invalid or expired recovery token" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear recovery token
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, recoveryToken: null },
    });

    res.status(200).json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
