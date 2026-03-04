import { Request, Response } from "express";
import pool from "../database/db";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";

const formattedDate = new Date().toLocaleDateString("sv-SE");

export const getAllUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [rows]: any = await pool.query("SELECT * FROM login");
    res.json({ users: rows });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Database query failed" });
  }
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
  try {
    let { name, email, password, contact, cnic, address, date, role } =
      req.body;

    if (!name || !email || !password || !cnic || !contact || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    name = name.charAt(0).toUpperCase() + name.slice(1);
    email = email.toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (!/^\d{11}$/.test(contact)) {
      res.status(400).json({ message: "Contact must be exactly 11 digits" });
      return;
    }

    if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
      res
        .status(400)
        .json({ message: "CNIC must be in format 12345-6789012-3" });
      return;
    }

    if (password.length < 8 || password.length > 20) {
      res
        .status(400)
        .json({ message: "Password must be between 8 and 20 characters" });
      return;
    }

    const [existingUsers]: any = await pool.query(
      `SELECT * FROM login 
       WHERE LOWER(email) = LOWER(?) 
          OR contact = ? 
          OR cnic = ?`,
      [email, contact, cnic],
    );

    const duplicates: string[] = [];

    if (
      existingUsers.some(
        (u: any) => u.email.toLowerCase() === email.toLowerCase(),
      )
    )
      duplicates.push("Email");

    if (existingUsers.some((u: any) => u.contact === contact))
      duplicates.push("Phone");

    if (existingUsers.some((u: any) => u.cnic === cnic))
      duplicates.push("CNIC");

    if (duplicates.length > 0) {
      const message =
        duplicates.length === 1
          ? `${duplicates[0]} already exists!`
          : `${duplicates.join(" and ")} already exist!`;
      res.status(400).json({ message });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle image upload
    let imagePath: string | null = null;

    if (req.files && req.files.image) {
      const file = req.files.image as any;

      const uploadDir = path.join(__dirname, "../../uploads");

      // Create uploads folder if not exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Create unique filename
      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(uploadDir, fileName);

      // Move file
      await file.mv(uploadPath);

      // Save relative path in DB
      imagePath = `uploads/${fileName}`;
    }

    const query = `
      INSERT INTO login (name, email, password, contact, cnic, address, date, role, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      email,
      hashedPassword,
      contact,
      cnic,
      address,
      formattedDate,
      role,
      imagePath,
    ];

    const [result]: any = await pool.query(query, values);

    res.status(201).json({
      message: "User added successfully",
      userId: result.insertId,
      name,
      email,
      role,
      contact,
      address,
      cnic,
      date,
      image: imagePath,
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.id;
    let { name, email, contact, cnic, address, date, role, password } =
      req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const [user]: any = await pool.query("SELECT * FROM login WHERE id = ?", [
      userId,
    ]);

    if (user.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
    if (email) email = email.toLowerCase();

    const [existingUsers]: any = await pool.query(
      `SELECT * FROM login 
       WHERE id != ?
         AND (LOWER(email) = LOWER(?) 
              OR contact = ? 
              OR cnic = ?)`,
      [userId, email, contact, cnic],
    );

    const duplicates: string[] = [];

    if (
      existingUsers.some(
        (u: any) => u.email.toLowerCase() === email?.toLowerCase(),
      )
    )
      duplicates.push("Email");

    if (existingUsers.some((u: any) => u.contact === contact))
      duplicates.push("Phone");

    if (existingUsers.some((u: any) => u.cnic === cnic))
      duplicates.push("CNIC");

    if (duplicates.length > 0) {
      const message =
        duplicates.length === 1
          ? `${duplicates[0]} already exists!`
          : `${duplicates.join(" and ")} already exist!`;
      res.status(400).json({ message });
      return;
    }

    const updates: any = { name, email, contact, cnic, address, date, role };

    // Handle image upload
    // Handle image upload
    if (req.files && req.files.image) {
      const file = req.files.image as any;

      const uploadDir = path.join(__dirname, "../../uploads");

      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.name}`;
      const uploadPath = path.join(uploadDir, fileName);

      await file.mv(uploadPath);

      // Delete old image if exists
      if (user[0].image) {
        const oldImagePath = path.join(__dirname, "../../", user[0].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      updates.image = `uploads/${fileName}`;
    }

    if (password) {
      if (password.length < 8 || password.length > 20) {
        res
          .status(400)
          .json({ message: "Password must be between 8 and 20 characters" });
        return;
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    let query = "UPDATE login SET ";
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        query += `\`${key}\` = ?${
          index < Object.keys(updates).length - 1 ? "," : ""
        } `;
        values.push(value);
      }
    });

    query += " WHERE id = ?";
    values.push(userId);

    await pool.query(query, values);

    res.status(200).json({
      message: "User updated successfully",
      userId,
      updatedFields: updates,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = "UPDATE login SET loginStatus = 'N' WHERE id = ?";
    const [result]: any = await pool.query(query, [id]);

    const [getActiveUsers]: any = await pool.query(
      "SELECT * FROM login WHERE loginStatus = 'Y'",
    );

    if (result.affectedRows > 0) {
      res.json({ message: "User deleted successfully", users: getActiveUsers });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
