import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const normalizeDate = (date: string | null | undefined) => {
  if (!date) return null;
  const d = new Date(date);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const checkBlockedDates = async (
  userId: number,
  startDate: string,
  endDate: string,
) => {
  const [rows]: any = await pool.query(
    `
    SELECT date FROM attendance
    WHERE userId = ?
      AND date BETWEEN ? AND ?
      AND status = 'Y'
      AND (
        attendanceStatus = 'Absent'
        OR leaveStatus = 'Approved'
      )
    `,
    [userId, startDate, endDate],
  );

  return rows;
};

export interface RequestWithUser extends Request {
  user?: {
    id: number;
    role: string;
    [key: string]: any;
  };
}

export const getAllTodos = async (req: Request, res: Response) => {
  try {
    const query = `
SELECT 
  t.id,
  t.employee_id,
  u.name AS employeeName,
  t.task,
  t.note,
 DATE_FORMAT(t.startDate, '%Y-%m-%d') AS startDate,
        DATE_FORMAT(t.endDate, '%Y-%m-%d') AS endDate,
        DATE_FORMAT(t.deadline, '%Y-%m-%d') AS deadline,
  t.todoStatus,
  t.completionStatus
FROM todo t
JOIN login u ON u.id = t.employee_id
WHERE t.todoStatus != 'N'
ORDER BY t.id DESC

`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch todos" });
  }
};

export const getUserTodos = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
  SELECT 
    id,
    employee_id,
    task,
    note,
    DATE_FORMAT(startDate, '%Y-%m-%d') AS startDate,
    DATE_FORMAT(endDate, '%Y-%m-%d') AS endDate,
    DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline,
    todoStatus,
    completionStatus
  FROM todo
  WHERE employee_id = ?
    AND todoStatus != 'N'
  ORDER BY id DESC
`;

    const [rows] = await pool.query<RowDataPacket[]>(query, [id]);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch user todos" });
  }
};

export const addTodo = async (
  req: RequestWithUser,
  res: Response,
): Promise<void> => {
  try {
    const {
      employee_id,
      task,
      note,
      startDate,
      endDate,
      deadline,
      todoStatus,
      completionStatus,
    } = req.body;

    const user = req.user;

    if (!task || !startDate || !endDate || !deadline) {
      res.status(400).json({ message: "Task and dates are required" });
      return;
    }

    if (new Date(startDate) && new Date(endDate) > new Date(deadline)) {
      res.status(400).json({
        message: "Start Date and End Date cannot be later than Deadline",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      res
        .status(400)
        .json({ message: "Start Date cannot be later than End Date" });
      return;
    }

    if (new Date(startDate) > new Date(deadline)) {
      res
        .status(400)
        .json({ message: "Start Date cannot be later than Deadline" });
      return;
    }

    if (new Date(endDate) > new Date(deadline)) {
      res
        .status(400)
        .json({ message: "End Date cannot be later than Deadline" });
      return;
    }

    let finalEmployeeId: number;
    if (user?.role === "admin") {
      if (!employee_id)
        res.status(400).json({ message: "employee_id is required for admin" });
      return;
      finalEmployeeId = Number(employee_id);
    } else {
      finalEmployeeId = user?.id ?? 0;
    }

    const [existing]: any = await pool.query(
      `
      SELECT id FROM todo 
      WHERE employee_id = ?
        AND task = ?
        AND ((startDate <= ? AND endDate >= ?) OR (startDate <= ? AND endDate >= ?))
        AND completionStatus != 'Deleted'
      `,
      [
        finalEmployeeId,
        task,
        normalizeDate(endDate),
        normalizeDate(startDate),
        normalizeDate(endDate),
        normalizeDate(endDate),
      ],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message:
          "This task of this user already exists for this selected date range",
      });
      return;
    }

    const [userRows]: any = await pool.query(
      "SELECT date FROM login WHERE id = ?",
      [finalEmployeeId],
    );

    if (!userRows.length) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDate = normalizeDate(userRows[0].date);

    if (!joiningDate) {
      res.status(400).json({ message: "Employee joining date not found" });
      return;
    }

    if (
      normalizeDate(startDate)! < joiningDate ||
      normalizeDate(endDate)! < joiningDate ||
      normalizeDate(deadline)! < joiningDate
    ) {
      res.status(400).json({
        message: "Todo dates cannot be earlier than employee joining date",
      });
      return;
    }

    const [approvedLeaves]: any = await pool.query(
      `SELECT id FROM leaves
   WHERE userId = ?
     AND leaveStatus = 'Approved'
     AND ((fromDate <= ? AND toDate >= ?) OR (fromDate <= ? AND toDate >= ?))`,
      [
        finalEmployeeId,
        normalizeDate(endDate),
        normalizeDate(startDate),
        normalizeDate(endDate),
        normalizeDate(startDate),
      ],
    );

    if (approvedLeaves.length > 0) {
      res.status(400).json({
        message:
          "Cannot add todo. User has approved leave on one or more selected dates.",
      });
      return;
    }

    const query = `
      INSERT INTO todo
      (employee_id, task, note, startDate, endDate, deadline, todoStatus, completionStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.query(query, [
      finalEmployeeId,
      task,
      note ?? "",
      normalizeDate(startDate),
      normalizeDate(endDate),
      normalizeDate(deadline),
      todoStatus ?? "Y",
      completionStatus ?? "Pending",
    ]);

    res.status(201).json({ message: "Todo added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Add todo failed" });
  }
};

export const updateTodo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      task,
      note,
      startDate,
      endDate,
      deadline,
      completionStatus,
    } = req.body;

    if (!id) {
      res.status(400).json({ message: "Todo ID is required" });
    }

    if (!employee_id || !task || !startDate || !endDate || !deadline) {
      res.status(400).json({
        message:
          "employee_id, task, startDate, endDate, and deadline are required",
      });
      return;
    }

    if (new Date(startDate) && new Date(endDate) > new Date(deadline)) {
      res.status(400).json({
        message: "Start Date and End Date cannot be later than Deadline",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      res
        .status(400)
        .json({ message: "Start Date cannot be later than End Date" });
      return;
    }

    if (new Date(startDate) > new Date(deadline)) {
      res
        .status(400)
        .json({ message: "Start Date cannot be later than Deadline" });
      return;
    }

    if (new Date(endDate) > new Date(deadline)) {
      res
        .status(400)
        .json({ message: "End Date cannot be later than Deadline" });
      return;
    }

    const [userRows]: any = await pool.query(
      "SELECT date FROM login WHERE id = ?",
      [employee_id],
    );

    if (!userRows.length) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDateRaw = normalizeDate(userRows[0].date);

    if (!joiningDateRaw) {
      res.status(400).json({ message: "Employee joining date not found" });
      return;
    }

    const joiningDate: string = joiningDateRaw;

    const normalizedStart = normalizeDate(startDate);
    const normalizedEnd = normalizeDate(endDate);
    const normalizedDeadline = normalizeDate(deadline);

    if (!normalizedStart || !normalizedEnd || !normalizedDeadline) {
      res.status(400).json({ message: "Invalid date format" });
      return;
    }

    if (
      normalizedStart < joiningDate ||
      normalizedEnd < joiningDate ||
      normalizedDeadline < joiningDate
    ) {
      res.status(400).json({
        message: "Todo dates cannot be earlier than employee joining date",
      });
      return;
    }

    const [approvedLeaves]: any = await pool.query(
      `SELECT id FROM leaves
   WHERE userId = ?
     AND leaveStatus = 'Approved'
     AND ((fromDate <= ? AND toDate >= ?) OR (fromDate <= ? AND toDate >= ?))`,
      [
        employee_id,
        normalizedEnd,
        normalizedStart,
        normalizedEnd,
        normalizedStart,
      ],
    );

    if (approvedLeaves.length > 0) {
      res.status(400).json({
        message:
          "Cannot update todo. User has approved leave on one or more selected dates.",
      });
      return;
    }

    const query = `
      UPDATE todo
      SET
        employee_id = ?,
        task = ?,
        note = ?,
        startDate = ?,
        endDate = ?,
        deadline = ?,
        completionStatus = ?
      WHERE id = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [
      employee_id,
      task,
      note ?? "",
      normalizeDate(startDate),
      normalizeDate(endDate),
      normalizeDate(deadline),
      completionStatus || "Defer",
      id,
    ]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Todo not found" });
      return;
    }

    res.status(200).json({ message: "Todo updated successfully" });
    return;
  } catch (error) {
    console.error("Update Todo Error:", error);
    res.status(500).json({ message: "Failed to update todo" });
  }
};

export const deleteTodo = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "Todo ID is required" });
      return;
    }

    const query = `
      UPDATE todo
      SET todoStatus = 'N'
      WHERE id = ?
    `;

    const [result] = await pool.query<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Todo not found" });
      return;
    }

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete todo" });
  }
};
