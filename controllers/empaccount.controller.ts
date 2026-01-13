import { Request, Response } from "express";
import pool from "../database/db";

const generateRefNo = async (): Promise<string> => {
  const [rows]: any = await pool.query(
    `SELECT id FROM employee_accounts ORDER BY id DESC LIMIT 1`
  );

  const nextId = rows.length ? rows[0].id + 1 : 1;
  return `EA-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(nextId).padStart(4, "0")}`;
};


export const addEmployeeAccount = async (req: Request, res: Response):Promise <void> => {
  try {
    const {
      employee_id,
      debit = 0,
      credit = 0,
      payment_method,
      payment_date,
    } = req.body;

    if (!employee_id || (!debit && !credit)) {
       res.status(400).json({ message: "Invalid payload" });
    }

    const [last]: any = await pool.query(
      `SELECT balance FROM employee_accounts 
       WHERE employee_id = ? 
       ORDER BY id DESC LIMIT 1`,
      [employee_id]
    );

    const previousBalance = last.length ? Number(last[0].balance) : 0;
    const currentBalance = previousBalance + debit - credit;

    const refNo = await generateRefNo();

    await pool.query(
      `INSERT INTO employee_accounts 
      (employee_id, refNo, payment_date, debit, credit, balance, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        refNo,
        payment_date,
        debit,
        credit,
        currentBalance,
        payment_method,
      ]
    );

     res.status(201).json({
      message: "Employee account entry added successfully",
    });
  } catch (error) {
    console.error("Add Employee Account Error:", error);
     res.status(500).json({ message: "Server error" });
  }
};


export const getEmployeeAccount = async (req: Request, res: Response):Promise <void> => {
  try {
    const { employeeId } = req.params;

    const [rows]: any = await pool.query(
      `SELECT 
        id,
        refNo,
        debit,
        credit,
        payment_method,
        payment_date,
        balance
      FROM employee_accounts
      WHERE employee_id = ?
      ORDER BY payment_date ASC, id ASC`,
      [employeeId]
    );

     res.json({ accounts: rows });
  } catch (error) {
    console.error("Get Employee Account Error:", error);
     res.status(500).json({ message: "Server error" });
  }
};
