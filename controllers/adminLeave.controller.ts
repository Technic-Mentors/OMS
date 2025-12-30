import { Request as ExpressRequest, Response } from "express";
import pool from "../database/db";
import { OkPacket, RowDataPacket } from "mysql2";

export interface RequestWithUser extends ExpressRequest {
  user?: {
    id: number;
    name?: string;
    role?: string;
  };
}

export const getUsersLeaves = async (req: RequestWithUser, res: Response) => {
  try {
    const search = (req.query.search as string) || "";

    const query = `
      SELECT 
        l.id,
        l.leaveSubject,
        l.leaveReason,
        l.date,
        l.leaveStatus,
        u.name
      FROM leaves l
      JOIN login u ON u.id = l.userId
      WHERE u.name LIKE ?
      ORDER BY l.id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [`%${search}%`]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getMyLeaves = async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.user.id;
    const search = (req.query.search as string) || "";

    const query = `
      SELECT 
        l.id,
        l.leaveSubject,
        l.leaveReason,
        l.date,
        l.leaveStatus,
        u.name
      FROM leaves l
      JOIN login u ON u.id = l.userId
      WHERE u.id = ? AND l.leaveSubject LIKE ?
      ORDER BY l.id ASC
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query, [
      userId,
      `%${search}%`,
    ]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getAllUsers = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, role FROM login"
    );
    res.json({ users: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addLeave = async (req: RequestWithUser, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { leaveSubject, date, leaveReason, employee_id } = req.body;

    if (!leaveSubject || !date || !leaveReason) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    let userId: number;

    if (req.user.role === "admin") {
      if (!employee_id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      userId = Number(employee_id);

      if (isNaN(userId) || userId <= 0) {
        return res.status(400).json({ message: "Invalid employee ID" });
      }
    } else {
      userId = req.user.id;
    }

    await pool.query(
      `INSERT INTO leaves 
        (userId, leaveSubject, date, leaveReason, leaveStatus)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, leaveSubject, date, leaveReason, "Pending"]
    );

    return res.status(201).json({ message: "Leave added successfully" });
  } catch (error) {
    console.error("Error adding leave:", error);
    if (!res.headersSent) {
      return res.status(500).json({ message: "Server error" });
    }
  }
};

export const updateLeave = async (
  req: RequestWithUser,
  res: Response
): Promise<void> => {
  try {
    const leaveId = req.params.id;
    const { leaveStatus, date, leaveSubject, leaveReason } = req.body;

    const query = `
      UPDATE leaves
      SET date = ?, leaveStatus = ?, leaveSubject = ?, leaveReason = ?
      WHERE id = ?
    `;

    const formattedDate = date ? date : null;

    await pool.query(query, [
      formattedDate,
      leaveStatus,
      leaveSubject,
      leaveReason,
      leaveId,
    ]);

    res.status(200).json({ message: "Leave updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
