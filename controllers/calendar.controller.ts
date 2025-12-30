import { Request, Response } from "express";
import pool from "../database/db";

export const getAllCalendarSessions = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query("SELECT * FROM calendarsession ORDER BY id ASC");
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching calendar sessions" });
  }
};

export const addCalendarSession = async (req: Request, res: Response) => {
  try {
    const { year, month, calendarStatus } = req.body;
    const [result] = await pool.query(
      "INSERT INTO calendarsession (year, month, calendarStatus) VALUES (?, ?, ?)",
      [year, month, calendarStatus]
    );
    res.status(201).json({ message: "Calendar session added", id: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding calendar session" });
  }
};

