import { Request, Response } from "express";
import pool from "../database/db";
import { AuthenticatedRequest } from "../middleware/middleware";

export const getAllPromotions = async (_: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM promotion WHERE is_deleted = 0 ORDER BY id DESC",
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to fetch promotions" });
  }
};

export const getMyPromotions = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const [rows] = await pool.query(
      `SELECT * FROM promotion 
       WHERE employee_id = ? AND is_deleted = 0
       ORDER BY id DESC`,
      [req.user.id],
    );

    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to fetch promotions" });
  }
};

export const getEmployeeLifeLine = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        el.id,
        el.employee_id AS id,
        u.name AS employee_name,
        u.email,
        u.contact,
        el.position,
        el.date
      FROM employee_lifeline el
      JOIN login u ON u.id = el.employee_id
      ORDER BY el.date DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Employee LifeLine Error:", error);
    res.status(500).json({ message: "Failed to fetch employee lifeline" });
  }
};

export const getEmployeePromotionHistory = async (req: Request, res: Response) => {
  try {
    const { employeeId } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM promotion WHERE employee_id = ? AND is_deleted = 0 ORDER BY date DESC",
      [employeeId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
};

export const addPromotion = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const { id, current_designation, requested_designation, note, date } =
      req.body;

    const employee_id = req.user.role === "admin" ? id : req.user.id;

    const [userRows]: any = await pool.query(
      "SELECT name FROM login WHERE id = ?",
      [employee_id],
    );

    if (!userRows.length) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    await pool.query(
      `INSERT INTO promotion 
      (employee_id, employee_name, current_designation, requested_designation, note, date)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        userRows[0].name,
        current_designation,
        requested_designation,
        note,
        date,
      ],
    );

    res.status(201).json({ message: "Promotion request added" });
  } catch {
    res.status(500).json({ message: "Failed to add promotion" });
  }
};


export const updatePromotion = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const promotionId = req.params.id;
    const {
      current_designation,
      requested_designation,
      note,
      date,
      approvalStatus,
    } = req.body;

    const [existing]: any = await pool.query(
      "SELECT * FROM promotion WHERE id = ? AND is_deleted = 0",
      [promotionId],
    );

    if (!existing.length) {
      res.status(404).json({ message: "Promotion not found" });
      return;
    }

    if (req.user.role !== "admin") {
      res.status(403).json({ message: "Only admin can approve promotions" });
      return;
    }

    await pool.query(
      `UPDATE promotion SET
        current_designation = ?,
        requested_designation = ?,
        note = ?,
        date = ?,
        approval = ?
      WHERE id = ?`,
      [
        current_designation,
        requested_designation,
        note,
        date,
        approvalStatus,
        promotionId,
      ],
    );

    if (approvalStatus === "ACCEPTED") {
      const promotion = existing[0];
      const empId = promotion.employee_id;

      const [lifelineExists]: any = await pool.query(
        "SELECT id FROM employee_lifeline WHERE employee_id = ?",
        [empId],
      );

      if (lifelineExists.length > 0) {
        await pool.query(
          `UPDATE employee_lifeline 
           SET position = ?, date = ? 
           WHERE employee_id = ?`,
          [requested_designation, date, empId],
        );
      } else {
        const [userRows]: any = await pool.query(
          `SELECT name, email, contact FROM login WHERE id = ?`,
          [empId],
        );

        if (userRows.length) {
          const user = userRows[0];
          await pool.query(
            `INSERT INTO employee_lifeline
             (employee_id, employee_name, email, contact, position, date)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              empId,
              user.name,
              user.email,
              user.contact,
              requested_designation,
              date,
            ],
          );
        }
      }
    }

    res.json({ message: "Promotion updated successfully and lifeline synced" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update promotion" });
  }
};

export const deletePromotion = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const promotionId = req.params.id;

    const [existing]: any = await pool.query(
      "SELECT * FROM promotion WHERE id = ? AND is_deleted = 0",
      [promotionId],
    );

    if (!existing.length) {
      res.status(404).json({ message: "Promotion not found" });
      return;
    }

    if (req.user.role !== "admin" && existing[0].employee_id !== req.user.id) {
      res.status(403).json({ message: "Unauthorized" });
      return;
    }

    await pool.query("UPDATE promotion SET is_deleted = 1 WHERE id = ?", [
      promotionId,
    ]);

    res.json({ message: "Promotion deleted successfully" });
  } catch {
    res.status(500).json({ message: "Failed to delete promotion" });
  }
};
