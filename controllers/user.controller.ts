import { Request, Response } from "express";
import pool from "../database/db";
import bcrypt from "bcryptjs";
import cloudinary, { uploadToCloudinary } from "../utils/cloudinary";

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

    // Validation...
    if (!name || !email || !password || !cnic || !contact || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    if (!/^\d{11}$/.test(contact)) {
      res.status(400).json({ message: "Contact must be exactly 11 digits" });
      return;
    }

    let imageUrl: string | null = null;

    if (req.file) {
      const file = req.file;

      if (!file.mimetype.startsWith("image/")) {
        res.status(400).json({ message: "File must be an image" });
        return;
      }

      if (file.size > 4 * 1024 * 1024) {
        res.status(400).json({ message: "Image size must be less than 5MB" });
        return;
      }

      try {
        const result = await uploadToCloudinary(file.buffer, "oms_users");
        imageUrl = result.secure_url;
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        res.status(500).json({ message: "Image upload failed" });
        return;
      }
    }

    console.log("BODY:", req.body);
    console.log("FILE:", req.file);

    // 🔍 CHECK DUPLICATES BEFORE INSERT
    const [existing]: any = await pool.query(
      `SELECT id FROM login 
   WHERE LOWER(email) = LOWER(?) 
   OR contact = ? 
   OR cnic = ?`,
      [email, contact, cnic],
    );

    if (existing.length > 0) {
      const duplicates: string[] = [];

      const emails = existing.some(
        (u: any) => u.email?.toLowerCase() === email.toLowerCase(),
      );
      const phones = existing.some((u: any) => u.contact === contact);
      const cnics = existing.some((u: any) => u.cnic === cnic);

      if (emails) duplicates.push("Email");
      if (phones) duplicates.push("Phone");
      if (cnics) duplicates.push("CNIC");

      res.status(400).json({
        message: `${duplicates.join(" and ")} already exists!`,
      });
      return;
    }

    // Continue with database insertion...
    const query = `
      INSERT INTO login (name, email, password, contact, cnic, address, date, role, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      email.toLowerCase(),
      await bcrypt.hash(password, 10),
      contact,
      cnic,
      address || null,
      date || formattedDate,
      role,
      imageUrl,
    ];

    await pool.query(query, values);
    res.status(201).json({
      message: "User added successfully",
      image: imageUrl,
    });
  } catch (error) {
    console.error("Detailed Error adding user:", error);
    res.status(500).json({
      message: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.id;
    let { name, email, contact, cnic, address, role } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const [userRows]: any = await pool.query(
      "SELECT * FROM login WHERE id = ?",
      [userId],
    );
    if (userRows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
    if (email) email = email.toLowerCase();

    // Check for duplicates (excluding current user)
    // 🔍 CHECK DUPLICATES (SAFE VERSION)
    const [existingUsers]: any = await pool.query(
      `SELECT id, email, contact, cnic FROM login 
   WHERE id != ?`,
      [userId],
    );

    const duplicates: string[] = [];

    const emailTaken = existingUsers.some(
      (u: any) => email && u.email?.toLowerCase() === email.toLowerCase(),
    );

    const phoneTaken = existingUsers.some(
      (u: any) => contact && u.contact === contact,
    );

    const cnicTaken = existingUsers.some((u: any) => cnic && u.cnic === cnic);

    if (emailTaken) duplicates.push("Email");
    if (phoneTaken) duplicates.push("Phone");
    if (cnicTaken) duplicates.push("CNIC");

    if (duplicates.length > 0) {
      res.status(400).json({
        message: `${duplicates.join(" and ")} already exists!`,
      });
      return;
    }

    const updates: any = { name, email, contact, cnic, address, role };

    // Handle Image Update
    if (req.file) {
      const file = req.file as any;
      const result = await uploadToCloudinary(file.buffer, "oms_users");
      updates.image = result.secure_url;
    }

    // Clean undefined fields so they aren't part of the SQL query
    Object.keys(updates).forEach(
      (key) => updates[key] === undefined && delete updates[key],
    );

    const keys = Object.keys(updates);
    if (keys.length === 0) {
      res.status(400).json({ message: "No fields provided for update" });
      return;
    }

    // Build query dynamically without trailing comma issues
    const query = `UPDATE login SET ${keys.map((key) => `\`${key}\` = ?`).join(", ")} WHERE id = ?`;
    const values = [...Object.values(updates), userId];

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
