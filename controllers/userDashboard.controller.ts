import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const getUserDashboard = async (
  req: any,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) res.status(401).json({ message: "Unauthorized" });

    const [attendance] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        COUNT(*) AS workingDays,
        SUM(attendanceStatus = 'Present') AS presents,
        SUM(attendanceStatus IN ('Absent','Leave')) AS absents
      FROM attendance
      WHERE userId = ? AND status = 'Y'
      `,
      [userId]
    );

    const [todos] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalTodos FROM todo WHERE employee_id = ?`,
      [userId]
    );

    const [progress] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS totalProgress FROM progress WHERE employee_id = ?`,
      [userId]
    );

    const [holidays] = await pool.query<RowDataPacket[]>(
      `
      SELECT COUNT(*) AS holidays
      FROM holidays
      WHERE holidayStatus = 'Y'
        AND (
          (MONTH(fromDate) = MONTH(CURRENT_DATE()) AND YEAR(fromDate) = YEAR(CURRENT_DATE()))
          OR 
          (MONTH(toDate) = MONTH(CURRENT_DATE()) AND YEAR(toDate) = YEAR(CURRENT_DATE()))
        )
      `
    );

    res.json({
      workingDays: attendance[0].workingDays || 0,
      presents: attendance[0].presents || 0,
      absents: attendance[0].absents || 0,
      totalTodos: todos[0].totalTodos || 0,
      totalProgress: progress[0].totalProgress || 0,
      holidays: holidays[0]?.holidays || 0,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
};
