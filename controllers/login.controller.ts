import { Request, Response } from "express";
import pool from "../database/db";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const saltRounds = 10;

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const HARD_ADMIN_EMAIL = "oms@technicmentors.com";
    const HARD_ADMIN_PASSWORD = "12345678";
    const HARD_ADMIN_NAME = "OMS";
    const HARD_ADMIN_CONTACT = "123456789101";
    const HARD_ADMIN_CNIC = "12345-6789101-1";
    const HARD_ADMIN_USERID = "52";

    if (email === HARD_ADMIN_EMAIL) {
      const isMatch = password === HARD_ADMIN_PASSWORD;
      if (!isMatch) {
        res
          .status(400)
          .json({ status: 400, message: "Invalid email or password" });
        return;
      }

      const token = jwt.sign(
        { email: HARD_ADMIN_EMAIL, role: "admin", id: 0 },
        "your_secret_key",
        { expiresIn: "1d" },
      );

      res.json({
        status: 200,
        token,
        userId: HARD_ADMIN_USERID,
        name: HARD_ADMIN_NAME,
        email: HARD_ADMIN_EMAIL,
        role: "admin",
        contact: HARD_ADMIN_CONTACT,
        cnic: HARD_ADMIN_CNIC,
        date: new Date().toISOString().split("T")[0],
        image: "",
      });
      return;
    }

    const [users]: any = await pool.query(
      "SELECT * FROM login WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      res
        .status(400)
        .json({ status: 400, message: "Invalid email or password" });
      return;
    }

    const user = users[0];

    if (user.loginStatus === "N") {
      res.status(403).json({
        status: 403,
        message: "Your account is withdrawn. Contact admin to reactivate.",
      });
      return;
    }

    let storedPassword = user.password;
    if (!storedPassword.startsWith("$2b$")) {
      const hashedPassword = await bcrypt.hash(storedPassword, saltRounds);
      await pool.query("UPDATE login SET password = ? WHERE email = ?", [
        hashedPassword,
        email,
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

    const token = jwt.sign(
      { email: user.email, role: user.role, id: user.id },
      "your_secret_key",
      { expiresIn: "1d" },
    );

    res.json({
      status: 200,
      message: "Login successful",
      token,
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      contact: user.contact,
      cnic: user.cnic,
      date: user.date,
      image: user.image,
    });
  } catch (error) {
    console.error("Login Error:", error);
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
