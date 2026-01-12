import { Request, Response } from "express";
import pool from "../database/db";
import moment from "moment-timezone";

export const getAttendance = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");

    const [rows]: any = await pool.query(
      "SELECT * FROM attendance WHERE userId = ? AND date = ?",
      [userId, today]
    );

    if (!rows.length) {
      res.json(null);
      return;
    }

    rows[0].date = moment
      .tz(rows[0].date, "Asia/Karachi")
      .format("YYYY-MM-DD");

    res.json(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};


// export const markAttendance = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const userId = req.params.id;
//     const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
//     const currentTime = moment.tz("Asia/Karachi").format("HH:mm:ss");

//     const [rows]: any = await pool.query(
//       "SELECT * FROM attendance WHERE userId = ? AND date = ?",
//       [userId, today]
//     );

//     if (!rows.length) {
//       await pool.query(
//         "INSERT INTO attendance (userId, clockIn, date) VALUES (?, ?, ?)",
//         [userId, currentTime, today]
//       );
//       res.json({ message: "Clock In successful" });
//       return;
//     }

//     const record = rows[0];

//     if (record.clockOut) {
//       res.status(400).json({ message: "Attendance already completed" });
//       return;
//     }

//     const clockIn = moment.tz(record.clockIn, "HH:mm:ss", "Asia/Karachi");
//     const clockOut = moment.tz(currentTime, "HH:mm:ss", "Asia/Karachi");

//     const diff = moment
//       .utc(clockOut.diff(clockIn))
//       .format("HH:mm:ss");

//     await pool.query(
//       "UPDATE attendance SET clockOut = ?, workingHours = ? WHERE id = ?",
//       [currentTime, diff, record.id]
//     );

//     res.json({ message: "Clock Out successful" });
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };


export const markAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    const today = moment.tz("Asia/Karachi").format("YYYY-MM-DD");
    const currentTime = moment.tz("Asia/Karachi").format("HH:mm:ss");

    // 🔹 STEP 1: Check if today is Holiday
    const [holidayRows]: any = await pool.query(
      `SELECT * FROM holidays WHERE date = ? AND holidayStatus = 'Y'`,
      [today]
    );

    if (holidayRows.length) {
      // Check if attendance already exists
      const [attendanceRows]: any = await pool.query(
        "SELECT * FROM attendance WHERE userId = ? AND date = ?",
        [userId, today]
      );

      if (!attendanceRows.length) {
        await pool.query(
          `INSERT INTO attendance (userId, date, attendanceStatus, status)
           VALUES (?, ?, 'Holiday', 'Y')`,
          [userId, today]
        );
      }

      res.status(200).json({ message: "Today is a Holiday 🎉" });
      return;
    }

    // 🔹 STEP 2: Normal Attendance Logic
    const [rows]: any = await pool.query(
      "SELECT * FROM attendance WHERE userId = ? AND date = ?",
      [userId, today]
    );

    if (!rows.length) {
      await pool.query(
        "INSERT INTO attendance (userId, clockIn, date, attendanceStatus, status) VALUES (?, ?, ?, 'Present', 'Y')",
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

    const diff = moment.utc(clockOut.diff(clockIn)).format("HH:mm:ss");

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

