import { Request, Response } from "express";
import pool from "../database/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const saltRounds = 10;
const SECRET_KEY = "your_secret_key";

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res
        .status(400)
        .json({ status: 400, message: "Email and password are required" });
      return;
    }

    const lowerEmail = email.toLowerCase().trim();

    const HARD_ADMIN_EMAIL = "oms@technicmentors.com";
    const HARD_ADMIN_PASSWORD = "12345678";

    // HARD ADMIN LOGIN
    if (lowerEmail === HARD_ADMIN_EMAIL) {
      if (password !== HARD_ADMIN_PASSWORD) {
        res
          .status(400)
          .json({ status: 400, message: "Invalid email or password" });
        return;
      }

      const token = jwt.sign(
        { email: HARD_ADMIN_EMAIL, role: "admin", id: 0 },
        SECRET_KEY,
        { expiresIn: "1d" },
      );

      res.json({
        status: 200,
        message: "Login successful",
        token,
        userId: "52",
        name: "OMS",
        email: HARD_ADMIN_EMAIL,
        role: "admin",
        permissions: ["ALL"], // Hard admin ko full access
        contact: "123456789101",
        cnic: "12345-6789101-1",
        date: new Date().toISOString().split("T")[0],
        image: "",
        source: "hardcoded",
      });
      return;
    }

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
      res
        .status(400)
        .json({ status: 400, message: "Invalid email or password" });
      return;
    }

    const user = users[0];

    // ACCOUNT STATUS CHECK
    const isActive =
      tableSource === "login"
        ? user.loginStatus === "Y"
        : user.status === "Active";

    if (!isActive) {
      res.status(403).json({
        status: 403,
        message: "Your account is inactive. Please contact the administrator.",
      });
      return;
    }

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
      res
        .status(400)
        .json({ status: 400, message: "Invalid email or password" });
      return;
    }

    // FETCH PERMISSIONS BASED ON ROLE
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
      { id: user.id, email: user.email, role: user.role, source: tableSource },
      SECRET_KEY,
      { expiresIn: "1d" },
    );

    // SUCCESS RESPONSE
    res.status(200).json({
      status: 200,
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roleId: user.roleId,
      permissions: allowedModules, // MODULE PERMISSIONS
      contact: tableSource === "login" ? user.contact : user.phone,
      cnic: user.cnic,
      date: user.date || user.created_at,
      image: user.image || "",
      source: tableSource,
    });
  } catch (error) {
    console.error("Multi-Table Login Error:", error);
    res.status(500).json({ status: 500, message: "Internal Server Error" });
  }
};

export const changePassword = async (
  req: Request<any>,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res
        .status(400)
        .json({ message: "Both old and new passwords are required" });
      return;
    }

    const [users]: any = await pool.query("SELECT * FROM login WHERE id = ?", [
      id,
    ]);

    if (!users.length) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Old password is incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await pool.query("UPDATE login SET password = ? WHERE id = ?", [
      hashedPassword,
      id,
    ]);

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

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
      res.status(404).json({ message: "User not found" });
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
