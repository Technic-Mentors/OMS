import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const toMySQLDate = (dateStr: string | null) => {
  if (!dateStr) return null;

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

  return `${hours}:${minutes.toString().padStart(2, "0")}`;
};

const getConfigTimes = async () => {
  const [rows]: any = await pool.query(
    "SELECT configureType, configureTime FROM configuretime WHERE status='Y'",
  );

  const config: { [key: string]: string } = {};
  rows.forEach((row: any) => {
    config[row.configureType] = row.configureTime;
  });

  return config;
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
      `SELECT a.id, a.userId, a.date, a.clockIn, a.clockOut,
              a.attendanceStatus, a.leaveStatus, a.leaveReason,
              a.workingHours, DAYNAME(a.date) AS day, a.status
       FROM attendance a
       WHERE a.userId = ?
         AND a.status = 'Y'
       ORDER BY a.date DESC`,
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
  const { date, clockIn, clockOut } = req.body;

  try {
    const formattedDate = toMySQLDate(date);
    const workingHours = calculateWorkingHours(clockIn, clockOut);

    const configTimes = await getConfigTimes();

    let attendanceStatus = "Present";

    if (configTimes["Late"] && clockIn >= configTimes["Late"]) {
      attendanceStatus = "Late";
    }
    if (configTimes["Absent"] && clockIn >= configTimes["Absent"]) {
      attendanceStatus = "Absent";
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO attendance
       (userId, date, clockIn, clockOut, attendanceStatus, workingHours, status)
       VALUES (?, ?, ?, ?, ?, ?, 'Y')`,
      [
        userId,
        formattedDate,
        clockIn,
        clockOut,
        attendanceStatus,
        workingHours,
      ],
    );

    res.json({
      message: "Attendance added successfully",
      id: result.insertId,
      attendanceStatus,
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
  const { userId, date, clockIn, clockOut, attendanceStatus } = req.body;

  try {
    const formattedDate = toMySQLDate(date);
    const workingHours = calculateWorkingHours(clockIn, clockOut);

    const configTimes = await getConfigTimes();

    let attendanceStatus = "Present";
    if (configTimes["Late"] && clockIn >= configTimes["Late"]) {
      attendanceStatus = "Late";
    }
    if (configTimes["Absent"] && clockIn >= configTimes["Absent"]) {
      attendanceStatus = "Absent";
    }

    await pool.query<ResultSetHeader>(
      `UPDATE attendance
       SET userId = ?, date = ?, clockIn = ?, clockOut = ?,
           attendanceStatus = ?, workingHours = ?
       WHERE id = ?`,
      [
        userId,
        formattedDate,
        clockIn,
        clockOut,
        attendanceStatus,
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
      `UPDATE attendance SET status = 'N' WHERE id = ?`,
      [id],
    );

    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete attendance." });
  }
};
