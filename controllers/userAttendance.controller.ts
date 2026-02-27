import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const toMySQLDate = (dateStr: string | null) => {
  if (!dateStr) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
const calculateWorkingHours = (clockIn: string, clockOut: string) => {
  if (!clockIn || !clockOut) return null;

  const start = new Date(`1970-01-01T${clockIn}`);
  const end = new Date(`1970-01-01T${clockOut}`);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return null;

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

const getAttendanceRule = async () => {
  const [rows]: any = await pool.query(
    "SELECT * FROM attendance_rules ORDER BY id DESC LIMIT 1",
  );
  return rows.length ? rows[0] : null;
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, role FROM login WHERE status = 'Y'",
    );
    res.json({ users: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
};

export const getAllAttendances = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT a.id, a.userId, u.name, u.role, a.date, a.clockIn, a.clockOut,
              a.attendanceStatus, a.leaveStatus, a.leaveReason,
              a.workingHours, DAYNAME(a.date) AS day, a.status
       FROM attendance a
       JOIN login u ON a.userId = u.id
       WHERE a.status = 'Y'
       ORDER BY a.date DESC`,
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch attendance records." });
  }
};

export const getMyAttendances = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id, userId, date, clockIn, clockOut,
              attendanceStatus, leaveStatus, leaveReason,
              workingHours, DAYNAME(date) AS day, status
       FROM attendance
       WHERE userId = ? AND status = 'Y'
       ORDER BY date DESC`,
      [userId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch my attendance." });
  }
};

export const addAttendance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  const { date, clockIn, clockOut, attendanceStatus: manualStatus } = req.body;

  try {
    const formattedDate = toMySQLDate(date);

    const rule = await getAttendanceRule();

    if (rule && rule.offDay) {
      const dayName = new Date(formattedDate!).toLocaleDateString("en-US", {
        weekday: "long",
      });

      if (dayName.toLowerCase() === rule.offDay.toLowerCase()) {
        res.status(400).json({
          message: `${rule.offDay} is Weekly Off. Cannot add attendance.`,
        });
        return;
      }
    }

    const [leaveCheck] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM leaves 
       WHERE userId = ? 
       AND leaveStatus = 'Approved' 
       AND ? BETWEEN fromDate AND toDate`,
      [userId, formattedDate],
    );

    if (leaveCheck.length > 0) {
      res.status(400).json({
        message: "User is on leave for this date. Cannot add attendance.",
      });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM attendance WHERE userId = ? AND date = ? AND status = 'Y'`,
      [userId, formattedDate],
    );

    if (existing.length > 0) {
      res
        .status(400)
        .json({ message: "Attendance already added for this user today." });
      return;
    }

    const workingHours = calculateWorkingHours(clockIn, clockOut);

    let finalStatus = manualStatus || "present";

    if (finalStatus.toLowerCase() === "present") {
      if (rule) {
        if (rule.lateTime && clockIn >= rule.lateTime) {
          finalStatus = "Late";
        }
        if (rule.halfLeave && clockIn >= rule.halfLeave) {
          finalStatus = "Absent";
        }
      }
    }
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO attendance
       (userId, date, clockIn, clockOut, attendanceStatus, workingHours, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Y')`,
      [
        userId,
        formattedDate,
        clockIn || null,
        clockOut || null,
        finalStatus,
        workingHours,
      ],
    );

    res.json({
      message: "Attendance added successfully",
      id: result.insertId,
      finalStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add attendance." });
  }
};

export const updateAttendance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  const {
    userId,
    date,
    clockIn,
    clockOut,
    attendanceStatus: reqStatus,
  } = req.body;

  try {
    const formattedDate = toMySQLDate(date);
    const workingHours = calculateWorkingHours(clockIn, clockOut);

    let finalStatus = reqStatus;

    await pool.query<ResultSetHeader>(
      `UPDATE attendance
       SET userId = ?, date = ?, clockIn = ?, clockOut = ?,
           attendanceStatus = ?, workingHours = ?
       WHERE id = ?`,
      [
        userId,
        formattedDate,
        clockIn || null,
        clockOut || null,
        finalStatus,
        workingHours,
        id,
      ],
    );

    res.json({ message: "Attendance updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update attendance." });
  }
};

export const deleteAttendance = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    await pool.query<ResultSetHeader>(
      "UPDATE attendance SET status = 'N' WHERE id = ?",
      [id],
    );

    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete attendance." });
  }
};
