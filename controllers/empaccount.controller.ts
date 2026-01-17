// controllers/empaccount.controller.ts
import { Request, Response } from "express";
import pool from "../database/db";

// Generate a unique reference number
const generateRefNo = async (): Promise<string> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT id FROM employee_accounts ORDER BY id DESC LIMIT 1`
    );
    const nextId = rows.length ? rows[0].id + 1 : 1;
    return `EA-${Date.now()}-${nextId}`;
  } catch (error) {
    console.error("Error generating refNo:", error);
    return `EA-${Date.now()}`;
  }
};

// Add a new employee account entry
export const addEmployeeAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee_id, debit = 0, credit = 0, payment_method, payment_date } = req.body;

    if (!employee_id || (Number(debit) === 0 && Number(credit) === 0)) {
      res.status(400).json({ message: "Invalid payload" });
      return;
    }

    const [last]: any = await pool.query(
      `SELECT balance FROM employee_accounts 
       WHERE employee_id = ? 
       ORDER BY id DESC LIMIT 1`,
      [employee_id]
    );

    const previousBalance = last.length ? Number(last[0].balance) : 0;
    const currentBalance = previousBalance + Number(debit) - Number(credit);

    const refNo = await generateRefNo();

    await pool.query(
      `INSERT INTO employee_accounts 
      (employee_id, refNo, payment_date, debit, credit, balance, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [employee_id, refNo, payment_date, debit, credit, currentBalance, payment_method]
    );

    res.status(201).json({ message: "Employee account entry added successfully" });
  } catch (error: any) {
    console.error("Add Employee Account Error:", error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get account entries for a specific employee (admin)
export const getEmployeeAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    if (!employeeId) {
      res.status(400).json({ message: "Employee ID is required" });
      return;
    }

    const [rows]: any = await pool.query(
      `SELECT id, refNo, debit, credit, payment_method, payment_date, balance
       FROM employee_accounts
       WHERE employee_id = ?
       ORDER BY payment_date ASC, id ASC`,
      [employeeId]
    );

    res.json({ accounts: rows });
  } catch (error: any) {
    console.error("Get Employee Account Error:", error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get account entries for the currently authenticated user
export const getEmployeeAccountForUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const employeeId = user.id;

    const [rows]: any = await pool.query(
      `SELECT id, refNo, debit, credit, payment_method, payment_date, balance
       FROM employee_accounts
       WHERE employee_id = ?
       ORDER BY payment_date ASC, id ASC`,
      [employeeId]
    );

    res.json({ accounts: rows });
  } catch (error: any) {
    console.error("Get Employee Account For User Error:", error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};
