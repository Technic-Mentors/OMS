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
  t.startDate,
  t.endDate,
  t.deadline,
  t.todoStatus,
  t.completionStatus
FROM todo t
JOIN login u ON u.id = t.employee_id
WHERE t.completionStatus != 'Deleted'
ORDER BY t.id DESC

`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch todos" });
  }
};

export const getUserTodos = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const query = `
  SELECT 
    id,
    employee_id,
    task,
    note,
    startDate,
    endDate,
    deadline,
    todoStatus,
    completionStatus
  FROM todo
  WHERE employee_id = ?
    AND completionStatus != 'Deleted'
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
  res: Response
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
    }

    let finalEmployeeId: number;

    if (user?.role === "admin") {
      if (!employee_id)
        res.status(400).json({ message: "employee_id is required for admin" });
      finalEmployeeId = Number(employee_id);
    } else {
      finalEmployeeId = user?.id ?? 0;
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
      completionStatus ?? "Open",
    ]);

    res.status(201).json({ message: "Todo added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Add todo failed" });
  }
};

export const updateTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { employee_id, task, note, startDate, endDate, deadline, completionStatus } = req.body;

    if (!id) {
      res.status(400).json({ message: "Todo ID is required" });
    }

    if (!employee_id || !task || !startDate || !endDate || !deadline) {
      res.status(400).json({
        message:
          "employee_id, task, startDate, endDate, and deadline are required",
      });
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
    }

    res.status(200).json({ message: "Todo updated successfully" });
  } catch (error) {
    console.error("Update Todo Error:", error);
    res.status(500).json({ message: "Failed to update todo" });
  }
};

export const deleteTodo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: "Todo ID is required" });
    }

    const query = `
      UPDATE todo
      SET todoStatus = 'Y'
      WHERE id = ?
    `;

    await pool.query(query, [id]);

    res.status(200).json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete todo" });
  }
};
