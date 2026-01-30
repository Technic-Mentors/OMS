import { Request, Response } from "express";
import pool from "../database/db";


export const getAllOvertime = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        o.id,
        o.employee_id,
        u.name,
        o.date,
        o.time AS totalTime,
        o.approval_status AS approvalStatus
      FROM overtime o
      JOIN login u ON u.id = o.employee_id
      ORDER BY o.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch overtime" });
  }
};


export const getMyOvertime = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [rows]: any = await pool.query(
      `
      SELECT 
        o.id,
        o.employee_id,
        u.name,
        o.date,
        o.time AS totalTime,
        o.approval_status AS approvalStatus
      FROM overtime o
      JOIN login u ON u.id = o.employee_id
      WHERE o.employee_id = ?
      ORDER BY o.id DESC
    `,
      [userId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch overtime" });
  }
};


export const createOvertime = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { date, time, description, employee_id } = req.body;

    const empId = user.role === "admin" ? employee_id : user.id;

    await pool.query(
      `
      INSERT INTO overtime (employee_id, date, time, description)
      VALUES (?, ?, ?, ?)
    `,
      [empId, date, time, description]
    );

    res.status(201).json({ message: "Overtime added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add overtime" });
  }
};


export const updateOvertime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { employeeId, date, time, description, status } = req.body;

    await pool.query(
      `
      UPDATE overtime
      SET employee_id = ?, date = ?, time = ?, description = ?, approval_status = ?
      WHERE id = ?
    `,
      [employeeId, date, time, description, status, id]
    );

    res.json({ message: "Overtime updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update overtime" });
  }
};


export const deleteOvertime = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(`DELETE FROM overtime WHERE id = ?`, [id]);

    res.json({ message: "Overtime deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete overtime" });
  }
};
