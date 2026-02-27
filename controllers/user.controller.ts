import { Request, Response } from "express";
import pool from "../database/db";
import bcrypt from "bcryptjs";
import cloudinary from "cloudinary";

const formattedDate = new Date().toLocaleDateString("sv-SE");

// Cloudinary config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

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

    const hashedPassword = await bcrypt.hash(password, 10);

    let imagePath: string | null = null;

    // Upload image to Cloudinary
    if (req.files && req.files.image) {
      const file = req.files.image as any;

      const result = await cloudinary.v2.uploader.upload(
        file.tempFilePath || file.data,
        {
          folder: "oms_users",
        },
      );

      imagePath = result.secure_url;
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

    const updates: any = { name, email, contact, cnic, address, date, role };

    // Upload new image
    if (req.files && req.files.image) {
      const file = req.files.image as any;

      const result = await cloudinary.v2.uploader.upload(
        file.tempFilePath || file.data,
        {
          folder: "oms_users",
        },
      );

      // Delete old image from Cloudinary
      if (user[0].image) {
        const publicId = user[0].image
          .split("/")
          .pop()
          ?.split(".")[0];

        if (publicId) {
          await cloudinary.v2.uploader.destroy(`oms_users/${publicId}`);
        }
      }

      updates.image = result.secure_url;
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
    await pool.query(query, [id]);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};