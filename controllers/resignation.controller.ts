import { Request, Response } from "express";
import pool from "../database/db";
import { AuthenticatedRequest } from "../middleware/middleware";
import { RowDataPacket, ResultSetHeader } from "mysql2";

interface ResignationRow extends RowDataPacket {
  id: number;
  employee_name: string;
  designation: string;
  resignation_date: string;
  note: string;
  approval_status: string;
}

interface EmployeeLifeLineRow extends RowDataPacket {
  current_designation: string;
}

export const getResignations = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const [rows] = await pool.query<ResignationRow[]>(
      `SELECT r.id, l.name AS employee_name, r.designation, r.resignation_date, r.note, r.approval_status
       FROM resignation r
       JOIN login l ON r.employee_id = l.id
       ORDER BY r.id DESC`,
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch resignations" });
  }
};

export const getMyResignations = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  const userId = req.user.id;

  try {
    const [rows] = await pool.query<ResignationRow[]>(
      `SELECT r.id, l.name AS employee_name, r.designation, r.resignation_date AS resignation_date, r.note, r.approval_status
       FROM resignation r
       JOIN login l ON r.employee_id = l.id
       WHERE r.employee_id = ?`,
      [userId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch your resignations" });
  }
};

export const addResignation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id, designation, note, resignation_date } = req.body;

  if (!id || !designation || !note || !resignation_date) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const [userRows]: any = await pool.query(
    "SELECT date FROM login WHERE id = ?",
    [id],
  );

  if (userRows.length === 0) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  const joiningDate = new Date(userRows[0].date);
  const selectedResignationDate = new Date(resignation_date);

  if (selectedResignationDate < joiningDate) {
    res.status(400).json({
      message: `Resignation date cannot be before joining date (${userRows[0].date})`,
    });
    return;
  }

  try {
    const [existingResignation]: any = await pool.query(
      "SELECT id FROM resignation WHERE employee_id = ?",
      [id],
    );

    if (existingResignation.length > 0) {
      res
        .status(400)
        .json({ message: "Resignation already submitted for this employee" });
      return;
    }

    await pool.query<ResultSetHeader>(
      `INSERT INTO resignation (employee_id, designation, note, resignation_date)
       VALUES (?, ?, ?, ?)`,
      [id, designation, note, resignation_date],
    );

    res.json({ message: "Resignation added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add resignation" });
  }
};

export const updateResignation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  let { designation, note, resignation_date, approval_status } = req.body;

  const ALLOWED_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"];

  if (!ALLOWED_STATUSES.includes(approval_status)) {
    approval_status = "PENDING";
  }

  if (!designation || !note || !resignation_date) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  const [userRows]: any = await pool.query(
    "SELECT date FROM login WHERE id = ?",
    [id],
  );

  if (userRows.length === 0) {
    res.status(404).json({ message: "Employee not found" });
    return;
  }

  const joiningDate = new Date(userRows[0].date);
  const selectedResignationDate = new Date(resignation_date);

  if (selectedResignationDate < joiningDate) {
    res.status(400).json({
      message: `Resignation date cannot be before joining date (${userRows[0].date})`,
    });
    return;
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query<ResultSetHeader>(
      `UPDATE resignation
       SET designation = ?, note = ?, resignation_date = ?, approval_status = ?
       WHERE id = ?`,
      [designation, note, resignation_date, approval_status, id],
    );

    if (approval_status === "ACCEPTED") {
      const [[resignation]]: any = await connection.query(
        `SELECT employee_id FROM resignation WHERE id = ?`,
        [id],
      );

      if (resignation?.employee_id) {
        await connection.query(
          `UPDATE login SET loginStatus = 'N' WHERE id = ?`,
          [resignation.employee_id],
        );
      }
    }

    await connection.commit();

    res.json({
      message:
        approval_status === "ACCEPTED"
          ? "Resignation accepted and user deactivated"
          : "Resignation updated successfully",
    });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: "Failed to update resignation" });
  } finally {
    connection.release();
  }
};

export const deleteResignation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    await pool.query<ResultSetHeader>(`DELETE FROM resignation WHERE id = ?`, [
      id,
    ]);
    res.json({ message: "Resignation deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete resignation" });
  }
};

export const getEmployeeLifeLine = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query<EmployeeLifeLineRow[]>(
      `SELECT position AS current_designation 
       FROM employee_lifeline 
       WHERE employee_id = ? 
       ORDER BY date DESC 
       LIMIT 1`,
      [id],
    );

    res.json(rows[0] || { current_designation: "" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch employee designation" });
  }
};
