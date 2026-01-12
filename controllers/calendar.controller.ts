import { Request, Response } from "express";
import pool from "../database/db";
import { AuthenticatedRequest } from "../middleware/middleware";


export const getAllCalendarSessions = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM calendarsession ORDER BY id ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching calendar sessions" });
  }
};


export const addCalendarSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { year, month, calendarStatus } = req.body;

    const now = new Date();
    const currentYear = now.getFullYear().toString();
    const currentMonth = now.toLocaleString("default", { month: "long" });

    if (year !== currentYear || month !== currentMonth) {
      res.status(400).json({
        message: "Only current month calendar session can be added",
      });
      return;
    }

    const [existing] = await pool.query(
      "SELECT id FROM calendarsession WHERE year = ? AND month = ?",
      [currentYear, currentMonth]
    );

    if ((existing as any[]).length > 0) {
      res.status(409).json({
        message: "Current month calendar session already exists",
      });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO calendarsession (year, month, calendarStatus) VALUES (?, ?, ?)",
      [year, month, calendarStatus]
    );

    res.status(201).json({
      message: "Calendar session added",
      id: (result as any).insertId,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding calendar session" });
    return;
  }
};


