import { Request, Response } from "express";
import pool from "../database/db";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface AssignedProject extends RowDataPacket {
  id: number;
  employee_id: number;
  projectId: number;
  name: string;
  projectName: string;
}

export const getAllAssignProjects = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
  ap.id,
  ap.employee_id,
  ap.projectId,
  ap.date,
  u.name,
  p.projectName
FROM assignedprojects ap
JOIN login u ON u.id = ap.employee_id
JOIN projects p ON p.id = ap.projectId
WHERE ap.assignStatus = 'Y'
ORDER BY ap.id DESC
    `;
    const [rows] = await pool.query<AssignedProject[]>(query);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyAssignProjects = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const query = `
      SELECT 
        ap.id,
        ap.employee_id,
        ap.projectId,
        ap.date,
        u.name,
        p.projectName
      FROM assignedprojects ap
      JOIN login u ON u.id = ap.employee_id
      JOIN projects p ON p.id = ap.projectId
      WHERE ap.assignStatus = 'Y'
        AND ap.employee_id = ?
      ORDER BY ap.id DESC
    `;

    const [rows] = await pool.query<AssignedProject[]>(query, [userId]);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addAssignProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { employee_id, projectId, date } = req.body;

    if (!employee_id || !projectId) {
      res
        .status(400)
        .json({ message: "employeeId and projectId are required" });
    }

    const [userRows]: any = await pool.query(
      "SELECT date FROM login WHERE id = ?",
      [employee_id],
    );

    if (userRows.length === 0) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDate = new Date(userRows[0].date);
    const assignDate = date ? new Date(date) : new Date();

    joiningDate.setHours(0, 0, 0, 0);
    assignDate.setHours(0, 0, 0, 0);

    if (assignDate < joiningDate) {
      res.status(400).json({
        message: `Project assign date cannot be earlier than employee joining date (${userRows[0].date})`,
      });
      return;
    }

    const query = `
      INSERT INTO assignedprojects (employee_id, projectId, date, assignStatus)
      VALUES (?, ?, ?, 'Y')
    `;
    const [result] = await pool.query<ResultSetHeader>(query, [
      employee_id,
      projectId,
      assignDate,
    ]);

    res.json({
      id: result.insertId,
      employee_id: employee_id,
      projectId,
      date: assignDate,
      assignStatus: "Y",
    });
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({ message: "Server error" });
    }
  }
};

export const editAssignProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { employee_id, projectId, date } = req.body;

    if (!employee_id || !projectId) {
      res
        .status(400)
        .json({ message: "employee_id and projectId are required" });
    }

    const [userRows]: any = await pool.query(
      "SELECT date FROM login WHERE id = ?",
      [employee_id],
    );

    if (userRows.length === 0) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDate = new Date(userRows[0].date);
    const assignDate = new Date(date);

    joiningDate.setHours(0, 0, 0, 0);
    assignDate.setHours(0, 0, 0, 0);

    if (assignDate < joiningDate) {
      res.status(400).json({
        message: `Cannot update: Assignment date is before employee joining date (${userRows[0].date})`,
      });
      return;
    }

    const query = `
      UPDATE assignedprojects
      SET employee_id = ?, projectId = ?, date = ?
      WHERE id = ?
    `;
    await pool.query<ResultSetHeader>(query, [
      employee_id,
      projectId,
      date,
      id,
    ]);

    res.json({ message: "Assigned project updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAssignProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const query = `
      UPDATE assignedprojects
      SET assignStatus = 'N'
      WHERE id = ?
    `;
    await pool.query<ResultSetHeader>(query, [id]);
    res.json({ message: "Assigned project deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
