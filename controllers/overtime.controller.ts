import { Request, Response } from "express";
import pool from "../database/db";

// Helper function
const validateOvertime = (time: string) => {
  const regex = /^(\d{1,2}):([0-5]?\d):([0-5]?\d)$/;
  const match = time.match(regex);

  if (!match) return false;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  if (hours < 0 || hours > 24) return false;
  if (minutes < 0 || minutes > 59) return false;
  if (seconds < 0 || seconds > 59) return false;

  if (hours === 0 && minutes === 0 && seconds === 0) return false;

  return true;
};

export const getAllOvertime = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        o.id,
        o.employee_id,
        u.name,
        o.date,
        o.time AS totalTime,
          o.description,

        o.approval_status AS approvalStatus
      FROM overtime o
      JOIN login u ON u.id = o.employee_id
      ORDER BY o.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch overtime" });
  }
};

export const getMyOvertime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [rows]: any = await pool.query(
      `
      SELECT 
        o.id,
        o.employee_id,
        u.name,
        o.date,
        o.time AS totalTime,
          o.description,

        o.approval_status AS approvalStatus
      FROM overtime o
      JOIN login u ON u.id = o.employee_id
      WHERE o.employee_id = ?
      ORDER BY o.id DESC
    `,
      [userId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch overtime" });
  }
};

export const createOvertime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = (req as any).user;
    const { date, time, description, employee_id } = req.body;

    const empId = user.role === "admin" ? employee_id : user.id;

    const [existing]: any = await pool.query(
      `SELECT id FROM overtime WHERE employee_id = ? AND date = ?`,
      [empId, date],
    );

    if (existing.length > 0) {
      res
        .status(400)
        .json({ message: "Overtime already exists for this date." });
      return;
    }

    if (!validateOvertime(time)) {
      res.status(400).json({
        message:
          "Invalid overtime! Hours 0-24, Minutes/Seconds 0-59, cannot be 00:00:00",
      });
      return;
    }

    await pool.query(
      `
      INSERT INTO overtime (employee_id, date, time, description)
      VALUES (?, ?, ?, ?)
    `,
      [empId, date, time, description],
    );

    res.status(201).json({ message: "Overtime added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add overtime" });
  }
};

export const updateOvertime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { employeeId, date, time, description, status } = req.body;

    const [existing]: any = await pool.query(
      `SELECT id FROM overtime WHERE employee_id = ? AND date = ? AND id != ?`,
      [employeeId, date, id],
    );

    if (existing.length > 0) {
      res
        .status(400)
        .json({ message: "Another record already exists for this date." });
      return;
    }

    if (!validateOvertime(time)) {
      res.status(400).json({
        message:
          "Invalid overtime! Hours 0-24, Minutes/Seconds 0-59, cannot be 00:00:00",
      });
      return;
    }

    await pool.query(
      `
      UPDATE overtime
      SET employee_id = ?, date = ?, time = ?, description = ?, approval_status = ?
      WHERE id = ?
    `,
      [employeeId, date, time, description, status, id],
    );

    res.json({ message: "Overtime updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update overtime" });
  }
};

export const deleteOvertime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM overtime WHERE id = ?`, [id]);

    res.json({ message: "Overtime deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete overtime" });
  }
};
