import { Request, Response } from "express";
import pool from "../database/db";
import { v4 as uuidv4 } from "uuid";

const validateFields = (res: Response, fields: { [key: string]: any }) => {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") {
      res.status(400).json({ message: `Missing required field: ${key}` });
      return false;
    }
  }
  return true;
};

export const addEmployeePayment = async (req: Request, res: Response) => {
  console.log("API hit: addEmployeePayment");

  try {
    console.log("Body:", req.body);

    const { employeeId, withdrawAmount, balance, paymentMethod, paymentDate } =
      req.body;

    if (!validateFields(res, { employeeId, withdrawAmount, paymentDate }))
      return;

    const invoiceNo = `WIT-${uuidv4().slice(0, 8)}`;
    const safeBalance = balance ?? 0;
    const safePaymentMethod = paymentMethod || "cash";

    console.log("API HIT - BEFORE DB QUERY");

    await pool.query(
      `INSERT INTO employee_accounts
       (employee_id, invoice_no, transaction_date, withdraw_amount, refund_amount, balance, payment_method)
       VALUES (?, ?, ?, ?, 0, ?, ?)`,
      [
        Number(employeeId),
        invoiceNo,
        paymentDate,
        Number(withdrawAmount),
        Number(safeBalance),
        safePaymentMethod,
      ]
    );

    console.log("API HIT - AFTER DB QUERY");

    console.log("DB insert done");

    res.status(201).json({ message: "Payment withdraw added successfully" });
  } catch (error: unknown) {
    console.error("addEmployeePayment error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("Error:", error);

    res
      .status(500)
      .json({ message: "Failed to add payment withdraw", error: errorMessage });
  }
};

export const addEmployeeRefund = async (req: Request, res: Response) => {
  try {
    const { employeeId, refundAmount, balance, paymentMethod, date } = req.body;

    if (!validateFields(res, { employeeId, refundAmount, date })) return;

    const invoiceNo = `REF-${uuidv4().slice(0, 8)}`;
    const safeBalance = balance ?? 0;
    const safePaymentMethod = paymentMethod || "cash";

    await pool.query(
      `INSERT INTO employee_accounts
       (employee_id, invoice_no, transaction_date, withdraw_amount, refund_amount, balance, payment_method)
       VALUES (?, ?, ?, 0, ?, ?, ?)`,
      [
        Number(employeeId),
        invoiceNo,
        date,
        Number(refundAmount),
        Number(safeBalance),
        safePaymentMethod,
      ]
    );

    res.status(201).json({ message: "Refund added successfully" });
  } catch (error: unknown) {
    console.error("addEmployeeRefund error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    res
      .status(500)
      .json({ message: "Failed to add refund", error: errorMessage });
  }
};

export const getEmployeePayments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) res.status(400).json({ message: "Missing employee id" });

    const [rows] = await pool.query(
      `SELECT 
        id,
        invoice_no AS invoiceNumber,
        withdraw_amount AS withdrawAmount,
        transaction_date AS date
       FROM employee_accounts
       WHERE employee_id = ? 
         AND COALESCE(withdraw_amount, 0) > 0
       ORDER BY transaction_date ASC`,
      [Number(id)]
    );

    res.json(rows);
  } catch (error: unknown) {
    console.error("getEmployeePayments error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    res
      .status(500)
      .json({ message: "Failed to fetch payments", error: errorMessage });
  }
};

export const getEmployeeRefunds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) res.status(400).json({ message: "Missing employee id" });

    const [rows] = await pool.query(
      `SELECT 
        id,
        invoice_no AS invoiceNumber,
        refund_amount AS refundAmount,
        transaction_date AS date
       FROM employee_accounts
       WHERE employee_id = ?
         AND COALESCE(refund_amount, 0) > 0
       ORDER BY transaction_date ASC`,
      [Number(id)]
    );

    res.json(rows);
  } catch (error: unknown) {
    console.error("getEmployeeRefunds error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    res
      .status(500)
      .json({ message: "Failed to fetch refunds", error: errorMessage });
  }
};
