import { Request, Response } from "express";
import pool from "../database/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const CLOUDINARY_BASE_URL =
  "https://res.cloudinary.com/dnzo0rrk5/image/upload/v1773908483/oms_users/user_1775044832575_729.jpg";

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/128/924/924874.png";

const saltRounds = 10;
const SECRET_KEY = "your_secret_key";

// ================= LOGIN =================
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        status: 400,
        message: "Email and password are required",
      });
      return;
    }

    const lowerEmail = email.toLowerCase().trim();

    // CHECK LOGIN TABLE
    let [users]: any = await pool.query("SELECT * FROM login WHERE email = ?", [
      lowerEmail,
    ]);

    let tableSource = "login";

    // CHECK SYSTEM_USERS TABLE
    if (users.length === 0) {
      [users] = await pool.query(
        "SELECT * FROM system_users WHERE LOWER(email) = ?",
        [lowerEmail],
      );
      tableSource = "system_users";
    }

    if (users.length === 0) {
      res.status(400).json({
        status: 400,
        message: "Invalid email or password",
      });
      return;
    }

    const user = users[0];

    // PASSWORD CHECK
    let storedPassword = user.password;

    if (tableSource === "login" && !storedPassword.startsWith("$2b$")) {
      const hashedPassword = await bcrypt.hash(storedPassword, saltRounds);

      await pool.query("UPDATE login SET password = ? WHERE email = ?", [
        hashedPassword,
        lowerEmail,
      ]);

      storedPassword = hashedPassword;
    }

    const isMatch = await bcrypt.compare(password, storedPassword);

    if (!isMatch) {
      res.status(400).json({
        status: 400,
        message: "Invalid email or password",
      });
      return;
    }

    // FETCH PERMISSIONS
    let allowedModules: string[] = [];
    const roleIdToUse = user.roleId;

    if (roleIdToUse) {
      const [permissions]: any = await pool.query(
        `SELECT m.moduleName 
         FROM access_control ac 
         JOIN modules m ON ac.moduleId = m.id 
         WHERE ac.roleId = ? AND ac.status = 1`,
        [roleIdToUse],
      );

      allowedModules = permissions.map((p: any) => p.moduleName);
    }

    // TOKEN
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        source: tableSource,
      },
      SECRET_KEY,
      { expiresIn: "1d" },
    );

    let finalImage = DEFAULT_AVATAR;

    if (user.role?.toLowerCase() === "admin") {
      finalImage = CLOUDINARY_BASE_URL;
    } else if (tableSource === "login") {
      finalImage = user.image ? user.image : DEFAULT_AVATAR;
    } else if (tableSource === "system_users") {
      finalImage = DEFAULT_AVATAR;
    }

    // RESPONSE
    res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleId: user.roleId,
      permissions: allowedModules,
      contact: tableSource === "login" ? user.contact : user.phone,
      cnic: user.cnic,
      date: user.date || user.created_at,
      image: finalImage,
      source: tableSource,
    });
  } catch (error) {
    console.error("Multi-Table Login Error:", error);

    res.status(500).json({
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// ================= CHANGE PASSWORD =================
export const changePassword = async (
  req: Request<any>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        message: "Both old and new passwords are required",
      });
      return;
    }

    if (oldPassword === newPassword) {
      res.status(400).json({
        message: "New password cannot be the same as old password",
      });
      return;
    }

    // CHECK LOGIN TABLE
    let [users]: any = await pool.query("SELECT * FROM login WHERE id = ?", [
      id,
    ]);

    let tableSource = "login";

    // CHECK SYSTEM USERS
    if (!users.length) {
      [users] = await pool.query("SELECT * FROM system_users WHERE id = ?", [
        id,
      ]);
      tableSource = "system_users";
    }

    if (!users.length) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = users[0];

    // VERIFY OLD PASSWORD
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      res.status(400).json({
        message: "Old password is incorrect",
      });
      return;
    }

    // HASH NEW PASSWORD
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // UPDATE PASSWORD
    if (tableSource === "login") {
      await pool.query("UPDATE login SET password = ? WHERE id = ?", [
        hashedPassword,
        id,
      ]);
    } else {
      await pool.query("UPDATE system_users SET password = ? WHERE id = ?", [
        hashedPassword,
        id,
      ]);
    }

    res.status(200).json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Error changing password:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

// ================= CONFIRM PASSWORD =================
export const confirmPassword = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      res.status(400).json({
        message: "Password and Confirm Password are required",
      });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({
        message: "Password and Confirm Password do not match",
      });
      return;
    }

    const [users]: any = await pool.query("SELECT id FROM login WHERE id = ?", [
      id,
    ]);

    if (!users.length) {
      res.status(404).json({
        message: "User not found",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await pool.query("UPDATE login SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);

    res.status(200).json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Change Password Error:", error);

    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
