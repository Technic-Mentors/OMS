import { Request, Response } from "express";
import pool from "../database/db";

interface AttendanceRule {
  id?: number;
  startTime: string;
  endTime: string;
  offDay: string;
  lateTime: string;
  halfLeave: string;
}

export const getAllConfigTime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM attendance_rules ORDER BY id ASC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const addConfigTime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { startTime, endTime, offDay, lateTime, halfLeave } =
      req.body as AttendanceRule;

    if (!startTime || !endTime || !offDay || !lateTime || !halfLeave) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (
      halfLeave < startTime ||
      (halfLeave > endTime && lateTime < startTime) ||
      lateTime > endTime
    ) {
      res.status(400).json({
        message: "Late and Half Leave Time must be within Office Hours",
      });
      return;
    }

    if (lateTime < startTime || lateTime > endTime) {
      res
        .status(400)
        .json({ message: "Late Time must be within Office Hours" });
      return;
    }

    if (halfLeave < startTime || halfLeave > endTime) {
      res
        .status(400)
        .json({ message: "Half Leave must be within Office Hours" });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO attendance_rules (startTime, endTime, offDay, lateTime, halfLeave) VALUES (?, ?, ?, ?, ?)",
      [startTime, endTime, offDay, lateTime, halfLeave],
    );

    res.status(201).json({
      message: "Attendance rule added successfully",
      id: (result as any).insertId,
    });
  } catch (error) {
    console.error("Insert Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateConfigTime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { startTime, endTime, offDay, lateTime, halfLeave } =
      req.body as AttendanceRule;

    if (!startTime || !endTime || !offDay || !lateTime || !halfLeave) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    if (
      halfLeave < startTime ||
      (halfLeave > endTime && lateTime < startTime) ||
      lateTime > endTime
    ) {
      res.status(400).json({
        message: "Late and Half Leave Time must be within Office Hours",
      });
      return;
    }

    if (lateTime < startTime || lateTime > endTime) {
      res
        .status(400)
        .json({ message: "Late Time must be within Office Hours" });
      return;
    }

    if (halfLeave < startTime || halfLeave > endTime) {
      res
        .status(400)
        .json({ message: "Half Leave must be within Office Hours" });
      return;
    }

    const [result] = await pool.query(
      `UPDATE attendance_rules 
       SET startTime = ?, endTime = ?, offDay = ?, lateTime = ?, halfLeave = ? 
       WHERE id = ?`,
      [startTime, endTime, offDay, lateTime, halfLeave, id],
    );

    res.json({ message: "Attendance rule updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteConfigTime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM attendance_rules WHERE id = ?", [id]);
    res.json({ message: "Attendance rule deleted" });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};
