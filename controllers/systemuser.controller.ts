import { Request, Response } from "express";
import pool from "../database/db";
import bcrypt from "bcryptjs";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formatName = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

// ================= GET USERS =================
export const getSytemUsers = async (req: Request, res: Response) => {
  try {
    const [users]: any = await pool.query(`
      SELECT 
        id,
        name,
        contact,
        cnic,
        email,
        roleId,
        role,
        status,
        created_at,
        updated_at
      FROM login
      WHERE LOWER(role) != 'user'
      ORDER BY id ASC
    `);

    res.json({ users });
  } catch (error) {
    console.error("Fetch Users Error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// ================= GET ROLES =================
export const getRoles = async (req: Request, res: Response) => {
  try {
    const [roles]: any = await pool.query("SELECT id, roleName FROM roles");
    res.json({ roles });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

// ================= ADD USER =================
export const addSystemUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    let { name, cnic, contact, email, password, roleId, role, status } =
      req.body;

    if (!name || !email || !password || !roleId || !role) {
      res.status(400).json({
        message: "Required fields (including Role) are missing",
      });
      return;
    }

    name = formatName(name.trim());
    email = email.toLowerCase().trim();

    if (!emailRegex.test(email)) {
      res.status(400).json({ message: "Invalid email format" });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ message: "Password too short" });
      return;
    }

    const [existingUsers]: any = await pool.query(
      `SELECT email FROM login WHERE LOWER(email) = LOWER(?)`,
      [email],
    );

    if (existingUsers.length > 0) {
      res.status(400).json({ message: "Email already exists!" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO login 
      (name, cnic, contact, email, password, roleId, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        cnic || null,
        contact || null,
        email,
        hashedPassword,
        roleId,
        role,
        status || "Active",
      ],
    );

    res.status(201).json({ message: "User added successfully" });
  } catch (error) {
    console.error("Add User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= UPDATE USER =================
export const updateSystemUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    let { name, cnic, contact, email, roleId, role, status, password } =
      req.body;

    let query = `UPDATE login SET name=?, cnic=?, contact=?, email=?, roleId=?, role=?, status=?`;

    const values: any[] = [
      name,
      cnic || null,
      contact || null,
      email,
      roleId,
      role,
      status || "Active",
    ];

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
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ================= DELETE USER =================
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.query("DELETE FROM login WHERE id=?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};
