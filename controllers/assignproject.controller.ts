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
      return;
    }

    const [userRows]: any = await pool.query(
      "SELECT date FROM login WHERE id = ?",
      [employee_id],
    );

    if (userRows.length === 0) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    // 1. Keep date as a string for the DB, but Object for comparison
    const dateString = date ? date : new Date().toISOString().split("T")[0];
    const joiningDate = new Date(userRows[0].date);
    const assignDateObj = new Date(dateString);

    // 2. Normalize for comparison
    joiningDate.setHours(0, 0, 0, 0);
    assignDateObj.setHours(0, 0, 0, 0);

    if (assignDateObj < joiningDate) {
      res.status(400).json({
        message: `Project assign date cannot be earlier than employee joining date (${userRows[0].date})`,
      });
      return;
    }

    // Get project start and end date
    const [projectRows]: any = await pool.query(
      "SELECT startDate, endDate FROM projects WHERE id = ? AND projectStatus = 'Y'",
      [projectId],
    );

    if (projectRows.length === 0) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const projectStart = new Date(projectRows[0].startDate);
    const projectEnd = new Date(projectRows[0].endDate);

    projectStart.setHours(0, 0, 0, 0);
    projectEnd.setHours(0, 0, 0, 0);

    if (assignDateObj < projectStart || assignDateObj > projectEnd) {
      res.status(400).json({
        message: `Assignment date must be between project start date (${projectRows[0].startDate}) and end date (${projectRows[0].endDate})`,
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
      dateString, // Use string here
    ]);

    res.json({
      id: result.insertId,
      employee_id: employee_id,
      projectId,
      date: dateString,
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
      return;
    }

    const [userRows]: any = await pool.query(
      "SELECT date FROM login WHERE id = ?",
      [employee_id],
    );

    if (userRows.length === 0) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    // 1. Keep date as a string for the DB, but Object for comparison
    const dateString = date ? date : new Date().toISOString().split("T")[0];
    const joiningDate = new Date(userRows[0].date);
    const assignDateObj = new Date(dateString);

    // 2. Normalize for comparison
    joiningDate.setHours(0, 0, 0, 0);
    assignDateObj.setHours(0, 0, 0, 0);

    if (assignDateObj < joiningDate) {
      res.status(400).json({
        message: `Cannot update: Assignment date is before employee joining date (${userRows[0].date})`,
      });
      return;
    }

    // Get project start and end date
    const [projectRows]: any = await pool.query(
      "SELECT startDate, endDate FROM projects WHERE id = ? AND projectStatus = 'Y'",
      [projectId],
    );

    if (projectRows.length === 0) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    const projectStart = new Date(projectRows[0].startDate);
    const projectEnd = new Date(projectRows[0].endDate);

    projectStart.setHours(0, 0, 0, 0);
    projectEnd.setHours(0, 0, 0, 0);

    if (assignDateObj < projectStart || assignDateObj > projectEnd) {
      res.status(400).json({
        message: `Assignment date must be between project start date (${projectRows[0].startDate}) and end date (${projectRows[0].endDate})`,
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
      dateString, // Use string to prevent timezone shifts
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
