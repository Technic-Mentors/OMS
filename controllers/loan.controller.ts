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
      LEFT JOIN employee_lifeline e ON e.employee_id = l.employee_id
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
  res: Response,
): Promise<void> => {
  try {
    const employeeId = req.user?.id;
    if (!employeeId) res.status(400).json({ message: "Employee ID missing" });

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
      LEFT JOIN employee_lifeline e ON e.employee_id = l.employee_id
      WHERE l.employee_id = ?
      ORDER BY l.id DESC`,
      [employeeId],
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch loans" });
  }
};

export const addLoan = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { loanAmount, deduction, applyDate, employee_id } = req.body;

    const finalEmployeeId =
      req.user?.role === "admin" ? employee_id : req.user?.id;

    if (!finalEmployeeId || !loanAmount || !applyDate) {
      res.status(400).json({ message: "Missing required fields" });
    }

    if (loanAmount < 0 || deduction < 0) {
      res.status(400).json({
        message: "Loan amount and deduction cannot be negative",
      });
      return;
    }

    const loanAmt = Number(loanAmount);
    const deductionAmt = Number(deduction || 0);

    if (deductionAmt > loanAmt) {
      res.status(400).json({
        message: "Deduction amount cannot be greater than loan amount",
      });
      return;
    }

    const refNo = Date.now();

    const [employeeRows]: any = await pool.query(
      `SELECT date FROM employee_lifeline WHERE employee_id = ?`,
      [finalEmployeeId],
    );

    if (!employeeRows.length) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDate = new Date(employeeRows[0].date);
    const loanApplyDate = new Date(applyDate);

    if (loanApplyDate < joiningDate) {
      res.status(400).json({
        message: "Loan apply date cannot be before employee joining date",
      });
      return;
    }

    const remainingAmount = loanAmount;
    const return_amount = 0;

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
      ],
    );

    res.status(201).json({ message: "Loan added successfully" });
  } catch (error) {
    console.error("Add loan error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
