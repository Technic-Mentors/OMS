import { Request, Response } from "express";
import pool from "../database/db";
import moment from "moment-timezone";

export const getAttendance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.id;
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

    const [holidayRows]: any = await pool.query(
      `SELECT holiday FROM holidays 
       WHERE ? BETWEEN fromDate AND toDate AND holidayStatus = 'Y' LIMIT 1`,
      [today],
    );

    if (holidayRows.length > 0) {
      res.status(200).json({
        attendanceStatus: "Holiday",
        message: `Today is holiday: ${holidayRows[0].holiday}`,
      });
      return;
    }

    const [rows]: any = await pool.query(
      "SELECT * FROM attendance WHERE userId = ? AND date = ?",
      [userId, today],
    );

    if (!rows || rows.length === 0) {
      res.status(200).json({
        userId: userId,
        date: today,
        attendanceStatus: "Absent",
        message: "User has not clocked in today.",
      });
      return;
    }

    const record = rows[0];
    if (record && record.date) {
      record.date = moment.tz(record.date, "Asia/Karachi").format("YYYY-MM-DD");
    }

    res.status(200).json(record);
  } catch (error) {
    console.error("Get Attendance Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};

export const markAttendance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.params.id;
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
    const currentTime = moment.tz("Asia/Karachi").format("HH:mm:ss");

    const [holidayRows]: any = await pool.query(
      `SELECT holiday FROM holidays 
       WHERE ? BETWEEN fromDate AND toDate AND holidayStatus = 'Y' LIMIT 1`,
      [today],
    );

    if (holidayRows.length > 0) {
      res.status(400).json({
        message: `Today is a Holiday (${holidayRows[0].holiday}). Attendance cannot be marked.`,
      });
      return;
    }

    const [rules]: any = await pool.query(
      "SELECT * FROM attendance_rules LIMIT 1",
    );
    if (!rules.length) {
      res.status(500).json({ message: "Attendance rules not configured" });
      return;
    }
    const { lateTime, halfLeave } = rules[0];

    const [rows]: any = await pool.query(
      "SELECT * FROM attendance WHERE userId = ? AND date = ?",
      [userId, today],
    );

    if (!rows.length) {
      let attendanceStatus = currentTime <= lateTime ? "Present" : "Late";
      await pool.query(
        "INSERT INTO attendance (userId, clockIn, date, attendanceStatus, status) VALUES (?, ?, ?, ?, 'Y')",
        [userId, currentTime, today, attendanceStatus],
      );
      res
        .status(200)
        .json({ message: `Clock In successful as ${attendanceStatus}` });
      return;
    }

    const record = rows[0];
    if (record.clockOut) {
      res.status(400).json({ message: "Already clocked out" });
      return;
    }

    const clockInMoment = moment(record.clockIn, "HH:mm:ss");
    const clockOutMoment = moment(currentTime, "HH:mm:ss");

    
    const durationMinutes = clockOutMoment.diff(clockInMoment, "minutes");

    const durationMilliseconds = clockOutMoment.diff(clockInMoment);
    const diff = moment.utc(durationMilliseconds).format("HH:mm:ss");

    let finalStatus = record.attendanceStatus; 

    
    if (durationMinutes < 1) {
      finalStatus = "Absent";
    } else if (durationMinutes <= 120) {
      finalStatus = "Short Leave";
    } else if (currentTime < halfLeave) {
      finalStatus = "Present";
    }

    await pool.query(
      "UPDATE attendance SET clockOut = ?, workingHours = ?, attendanceStatus = ? WHERE id = ?",
      [currentTime, diff, finalStatus, record.id],
    );

    res.status(200).json({
      message: "Clock Out successful",
      status: finalStatus,
      duration: `${durationMinutes} mins`,
    });
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Internal server error" });
    }
  }
};
