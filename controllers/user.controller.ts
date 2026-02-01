import { Request, Response } from "express";
import pool from "../database/db";
import bcrypt from 'bcryptjs';

const formattedDate = new Date().toLocaleDateString("sv-SE");


export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
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
    let { name, email, password, contact, cnic, address, date, role } = req.body;

    if (!name || !email || !password || !cnic || !role) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    name = name.charAt(0).toUpperCase() + name.slice(1);
    email = email.toLowerCase();

    if (!email.endsWith("@gmail.com")) {
      res.status(400).json({ message: "Email must end with @gmail.com" });
      return;
    }

    if (!/^\d{11}$/.test(contact)) {
      res.status(400).json({ message: "Contact must be exactly 11 digits" });
      return;
    }

    if (!/^\d{5}-\d{7}-\d{1}$/.test(cnic)) {
      res.status(400).json({ message: "CNIC must be 13 digits in format 12345-6789012-3" });
      return;
    }

    if (password.length < 5) {
      res.status(400).json({ message: "Password must be at least 5 characters" });
      return;
    }

    const [existingUser]: any = await pool.query(
      "SELECT * FROM login WHERE LOWER(email) = LOWER(?)",
      [email]
    );

    if (existingUser.length > 0) {
      res.status(400).json({ message: "User already exists!" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO login (name, email, password, contact, cnic, address, date, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [name, email, hashedPassword, contact, cnic, address, formattedDate, role];

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
    });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    let { name, email, contact, cnic, address, date, role, password } = req.body;

    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    const [user]: any = await pool.query("SELECT * FROM login WHERE id = ?", [userId]);
    if (user.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
    if (email) email = email.toLowerCase();

    const updates: any = { name, email, contact, cnic, address, date, role };
    if (password) {
      if (password.length < 5) {
        res.status(400).json({ message: "Password must be at least 5 characters" });
        return;
      }
      updates.password = await bcrypt.hash(password, 10);
    }

    let query = "UPDATE login SET ";
    const values: any[] = [];
    Object.entries(updates).forEach(([key, value], index) => {
      if (value !== undefined) {
        query += `\`${key}\` = ?${index < Object.keys(updates).length - 1 ? "," : ""} `;
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
      "SELECT * FROM login WHERE loginStatus = 'Y'"
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
