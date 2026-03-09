import { Request, Response } from "express";
import pool from "../database/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\d{11}$/;
const cnicRegex = /^\d{13}$/;

const formatName = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

export const getSytemUsers = async (req: Request, res: Response) => {
  try {
    const [users]: any = await pool.query(
      `
      SELECT 
        id,
        name,
        phone,
        cnic,
        email,
        role,
        status,
        created_at,
        updated_at
      FROM system_users
      ORDER BY id ASC
      `,
    );

    res.json({ users });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  try {
    const [roles]: any = await pool.query("SELECT DISTINCT role FROM system_users");
    res.json({ roles: roles.map((r: any) => r.role) });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

export const addSystemUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    let { name, cnic, phone, email, password, role, status } = req.body;

    if (!name || !email || !password || !role) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    name = formatName(name.trim());
    email = email.toLowerCase().trim();

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (phone && !phoneRegex.test(phone)) {
      res.status(400).json({ message: "Phone must be exactly 11 digits" });
      return;
    }

    if (cnic && !cnicRegex.test(cnic)) {
      res.status(400).json({ message: "CNIC must be exactly 13 digits" });
      return;
    }

    if (password.length < 8 || password.length > 20) {
      res.status(400).json({ message: "Password must be between 8 and 20 characters" });
      return;
    }

    const [existingUsers]: any = await pool.query(
      `SELECT email, phone, cnic FROM system_users
       WHERE LOWER(email) = LOWER(?) 
          OR phone = ? 
          OR cnic = ?`,
      [email, phone || null, cnic || null],
    );

    if (existingUsers.length > 0) {
      const duplicates: string[] = [];
      if (existingUsers.some((u: any) => u.email.toLowerCase() === email)) duplicates.push("Email");
      if (phone && existingUsers.some((u: any) => u.phone === phone)) duplicates.push("Phone");
      if (cnic && existingUsers.some((u: any) => u.cnic === cnic)) duplicates.push("CNIC");

      res.status(400).json({ 
        message: `${duplicates.join(" and ")} already ${duplicates.length > 1 ? 'exist' : 'exists'}!` 
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO system_users (name, cnic, phone, email, password, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        cnic || null,
        phone || null,
        email,
        hashedPassword,
        role,
        status || "Active",
      ],
    );

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error("Add System User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSystemUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    let { name, cnic, phone, email, role, status, password } = req.body;

    if (!id) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const [existing]: any = await pool.query(
      `SELECT id FROM system_users 
       WHERE (LOWER(email) = LOWER(?) OR phone = ? OR cnic = ?) AND id != ?`,
      [email, phone || null, cnic || null, id],
    );

    if (existing.length > 0) {
      res.status(400).json({ message: "Email, Phone, or CNIC already in use by another user" });
      return;
    }

    let query = `UPDATE system_users SET name=?, cnic=?, phone=?, email=?, role=?, status=?`;
    const values: any[] = [name, cnic || null, phone || null, email, role, status || "Active"];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += `, password=?`;
      values.push(hashedPassword);
    }

    query += ` WHERE id=?`;
    values.push(id);

    const [result]: any = await pool.query(query, values);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update System User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [result]: any = await pool.query("DELETE FROM system_users WHERE id=?", [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const systemUserLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // 1. Check if user exists in system_users table
    const [users]: any = await pool.query(
      "SELECT * FROM system_users WHERE LOWER(email) = LOWER(?)",
      [email.trim()]
    );

    if (users.length === 0) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const user = users[0];

    // 2. Check account status
    if (user.status !== "Active") {
      res.status(403).json({ 
        message: "Your account is inactive. Please contact the administrator." 
      });
      return;
    }

    // 3. Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      "your_secret_key", 
      { expiresIn: "1d" }
    );

    res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        cnic: user.cnic,
        status: user.status
      }
    });

  } catch (error) {
    console.error("System User Login Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};