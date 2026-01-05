import { Request, Response } from "express";

import pool from "../database/db";

export const addEmployeePayment = async (req: Request, res: Response) => {
  try {

    const { v4: uuidv4 } = await import("uuid");

    const {
      employeeId,

      payableSalary,

      withdrawAmount,

      balance,

      paymentMethod,

      paymentDate,
    } = req.body;

    const invoiceNo = `WIT-${uuidv4().slice(0, 8)}`;

    await pool.query(
      `INSERT INTO employee_accounts

       (employee_id, invoice_no, transaction_date, withdraw_amount, refund_amount, balance, payment_method)

       VALUES (?, ?, ?, ?, 0, ?, ?)`,

      [
        employeeId,

        invoiceNo,

        paymentDate,

        withdrawAmount,

        balance,

        paymentMethod,
      ]
    );

    res.status(201).json({ message: "Payment withdraw added successfully" });
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Failed to add payment withdraw" });
  }
};

export const addEmployeeRefund = async (req: Request, res: Response) => {
  try {
    // Dynamic import for uuid (ESM safe)

    const { v4: uuidv4 } = await import("uuid");

    const { employeeId, refundAmount, balance, paymentMethod, date } = req.body;

    const invoiceNo = `REF-${uuidv4().slice(0, 8)}`;

    await pool.query(
      `INSERT INTO employee_accounts

       (employee_id, invoice_no, transaction_date, withdraw_amount, refund_amount, balance, payment_method)

       VALUES (?, ?, ?, 0, ?, ?, ?)`,

      [employeeId, invoiceNo, date, refundAmount, balance, paymentMethod]
    );

    res.status(201).json({ message: "Refund added successfully" });
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Failed to add refund" });
  }
};

export const getEmployeePayments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 

        id,

        invoice_no AS invoiceNumber,

        withdraw_amount AS withdrawAmount,

        transaction_date AS date

       FROM employee_accounts

       WHERE employee_id = ? AND withdraw_amount > 0

       ORDER BY transaction_date ASC`,

      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

export const getEmployeeRefunds = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT 

        id,

        invoice_no AS invoiceNumber,

        refund_amount AS refundAmount,

        transaction_date AS date

       FROM employee_accounts

       WHERE employee_id = ? AND refund_amount > 0

       ORDER BY transaction_date ASC`,

      [id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({ message: "Failed to fetch refunds" });
  }
};
