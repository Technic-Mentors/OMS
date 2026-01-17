import { Request, Response } from "express";
import pool from "../database/db";
import { AuthenticatedRequest } from "../middleware/middleware";

export const getAllLoans = async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        l.id,
        l.employee_id,
        e.employee_name,
        e.contact,
        l.applyDate,
        l.refNo,
        l.loanAmount,
        l.deduction,
        l.remainingAmount,
        l.return_amount

      FROM loan l
      JOIN employee_lifeline e ON e.employee_id = l.employee_id
      ORDER BY l.id ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch loans" });
  }
};

export const getMyLoans = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId)  res.status(400).json({ message: "Employee ID missing" });

    const [rows] = await pool.query(
      `SELECT 
        l.id,
        l.employee_id,
        e.employee_name,
        e.contact,
        l.applyDate,
        l.refNo,
        l.loanAmount,
        l.deduction,
        l.remainingAmount,
        l.return_amount
      FROM loan l
      JOIN employee_lifeline e ON e.employee_id = l.employee_id
      WHERE l.employee_id = ?
      ORDER BY l.id DESC`,
      [employeeId]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch loans" });
  }
};


export const addLoan = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { loanAmount, deduction, remainingAmount, applyDate, employee_id } =
      req.body;

    const finalEmployeeId =
      req.user?.role === "admin" ? employee_id : req.user?.id;

    if (!finalEmployeeId || !loanAmount || !applyDate) {
      res.status(400).json({ message: "Missing required fields" });
    }

    const refNo = Date.now();

    await pool.query(
      `INSERT INTO loan
      (employee_id, applyDate, refNo, loanAmount, deduction, remainingAmount)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        finalEmployeeId,
        applyDate,
        refNo,
        loanAmount,
        deduction,
        remainingAmount,
      ]
    );

    res.status(201).json({ message: "Loan added successfully" });
  } catch (error) {
    console.error("Add loan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
