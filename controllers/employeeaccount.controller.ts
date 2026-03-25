import { Request, Response } from "express";
import pool from "../database/db";

const generateRefNo = async (): Promise<string> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT id FROM employee_accounts ORDER BY id ASC LIMIT 1`,
    );
    const nextId = rows.length ? rows[0].id + 1 : 1;
    return `REF-${Date.now()}`;
  } catch (error) {
    console.error("Error generating refNo:", error);
    return `REF-${Date.now()}`;
  }
};
export const addEmployeeAccount = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // 1. Validate BEFORE getting a connection to save resources
  const { employee_id, payment_type, amount, payment_method, payment_date } =
    req.body;

  if (!employee_id || !payment_type || Number(amount) <= 0) {
    res.status(400).json({ message: "Invalid payload" });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows]: any = await connection.query(
      `SELECT employee_acc_no FROM invoice_sequence WHERE id = 1 FOR UPDATE`,
    );

    let nextNumber = 1;
    if (rows.length > 0) {
      nextNumber = rows[0].employee_acc_no + 1;
      await connection.query(
        `UPDATE invoice_sequence SET employee_acc_no = ? WHERE id = 1`,
        [nextNumber],
      );
    } else {
      await connection.query(
        `INSERT INTO invoice_sequence (id, employee_acc_no) VALUES (1, 0)`,
      );
    }

    const formattedInvoice = `INV-${String(nextNumber).padStart(4, "0")}`;
    const [last]: any = await connection.query(
      `SELECT balance FROM employee_accounts 
       WHERE employee_id = ? 
       ORDER BY id ASC LIMIT 1 FOR UPDATE`,
      [employee_id],
    );

    const debit = payment_type === "debit" ? Number(amount) : 0;
    const credit = payment_type === "credit" ? Number(amount) : 0;
    const previousBalance = last.length ? Number(last[0].balance) : 0;
    const currentBalance = previousBalance + debit - credit;

    const refNo = `REF-${Date.now()}`;

    await connection.query(
      `INSERT INTO employee_accounts 
      (employee_id, refNo, invoiceNo, payment_date, debit, credit, balance, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        refNo,
        formattedInvoice,
        payment_date,
        debit,
        credit,
        currentBalance,
        payment_method,
      ],
    );

    await connection.commit();
    res
      .status(201)
      .json({ message: "Employee account entry added successfully" });
  } catch (error: any) {
    if (connection) await connection.rollback();
    console.error("Add Employee Account Error:", error.message || error);
    res.status(500).json({ message: "Server error" });
  } finally {
    if (connection) connection.release();
  }
};

export const getEmployeeAccount = async (req: Request, res: Response) => {
  try {
    const { employee_id } = req.params;

    const [rows]: any = await pool.query(
      `SELECT id, refNo, invoiceNo, debit, credit, payment_method, payment_date, balance
       FROM employee_accounts
       WHERE employee_id = ?
       ORDER BY payment_date ASC, id ASC`,
      [employee_id],
    );

    let previousBalance = 0;

    const formatted = rows.map((row: any) => {
      const netBalance = previousBalance + Number(row.debit) - Number(row.credit);

      const result = {
        ...row,
        previous_balance: previousBalance,
        net_balance: netBalance,
      };

      previousBalance = netBalance;

      return result;
    });

    res.json({ accounts: formatted });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeAccountForUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const employee_id = user.id;

    const [rows]: any = await pool.query(
      `SELECT id,  refNo, invoiceNo,  debit, credit, payment_method, payment_date, balance
       FROM employee_accounts
       WHERE employee_id = ?
       ORDER BY payment_date ASC, id ASC`,
      [employee_id],
    );

    res.json({ accounts: rows });
  } catch (error: any) {
    console.error(
      "Get Employee Account For User Error:",
      error.message || error,
    );
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllEmployeesAccounts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, debit, credit, payment_date FROM employee_accounts ORDER BY payment_date ASC`
    );

    res.json({ accounts: rows });
  } catch (error: any) {
    console.error("Get All Employee Accounts Error:", error.message || error);
    res.status(500).json({ message: "Server error" });
  }
};
