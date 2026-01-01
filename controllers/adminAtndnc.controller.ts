import { Request, Response } from "express";
import pool from "../database/db";
import moment from "moment-timezone";

export const getAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Karachi",
    });

    const [rows]: any = await pool.query(
      "SELECT * FROM attendance WHERE userId = ? AND date = ?",
      [userId, today]
    );

    if (!rows.length) {
      res.json(null);
      return;
    }

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const markAttendance = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
    const currentTime = moment.tz("Asia/Karachi").format("HH:mm:ss");

    const [rows]: any = await pool.query(
      "SELECT * FROM attendance WHERE userId = ? AND date = ?",
      [userId, today]
    );

    if (!rows.length) {
      await pool.query(
        "INSERT INTO attendance (userId, clockIn, date) VALUES (?, ?, ?)",
        [userId, currentTime, today]
      );
      res.json({ message: "Clock In successful" });
      return;
    }

    const record = rows[0];

    if (record.clockOut) {
      res.status(400).json({ message: "Attendance already completed" });
      return;
    }

    const clockIn = moment.tz(record.clockIn, "HH:mm:ss", "Asia/Karachi");
    const clockOut = moment.tz(currentTime, "HH:mm:ss", "Asia/Karachi");

    const diff = moment
      .utc(clockOut.diff(clockIn))
      .format("HH:mm:ss");

    await pool.query(
      "UPDATE attendance SET clockOut = ?, workingHours = ? WHERE id = ?",
      [currentTime, diff, record.id]
    );

    res.json({ message: "Clock Out successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

