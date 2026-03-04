import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket } from "mysql2";

export const getCustomerAccountsList = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, customerName, customerContact, customerAddress
       FROM customers
       WHERE customerStatus = 'Y'
       ORDER BY id DESC`,
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const getAllCustomers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, customerName, customerContact, customerAddress
       FROM customers
       WHERE customerStatus = 'Y'`,
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const addCustomerAccount = async (req: Request, res: Response) => {
  // 1. Destructure debit and credit directly from req.body
  const { customerId, debit, credit, paymentMethod, paymentDate } = req.body;

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT customer_acc_no FROM invoice_sequence WHERE id = 1 FOR UPDATE`,
    );

    let currentNumber = 0;
    if (rows.length > 0) {
      currentNumber = rows[0].customer_acc_no;
    } else {
      await connection.query(
        `INSERT INTO invoice_sequence (id, customer_acc_no) VALUES (1, 0)`,
      );
      currentNumber = 0;
    }

    const nextNumber = currentNumber + 1;

    await connection.query(
      `UPDATE invoice_sequence SET customer_acc_no = ? WHERE id = 1`,
      [nextNumber],
    );

    const formattedInvoice = `INV-${String(nextNumber).padStart(4, "0")}`;
    const refNo = `REF-${Date.now()}`;

    // 2. Use the values passed from the frontend directly
    await connection.query(
      `INSERT INTO customer_accounts 
      (customerId, refNo, invoiceNo, debit, credit, paymentMethod, paymentDate) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        customerId,
        refNo,
        formattedInvoice,
        debit,
        credit,
        paymentMethod,
        paymentDate,
      ],
    );

    await connection.commit();
    res
      .status(201)
      .json({ message: "Customer account added", invoiceNo: formattedInvoice });
  } catch (err) {
    await connection.rollback();
    console.error(err);
    res.status(500).json({ message: "Failed to add customer account" });
  } finally {
    connection.release();
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      `SELECT customerName, customerContact, customerAddress
       FROM customers
       WHERE id = ?`,
      [id],
    );

    if (!rows.length) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: "Failed to fetch customer" });
  }
};

export const getCustomerAccountsByCustomerId = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params;

  try {
    // Added invoiceNo to the SELECT statement
    const [rows]: any = await pool.query(
      `SELECT id, refNo, invoiceNo, debit, credit, paymentMethod, paymentDate
       FROM customer_accounts
       WHERE customerId = ?
       ORDER BY createdAt ASC`,
      [id],
    );

    const formatted = rows.map((row: any) => ({
      ...row,
      debit: Number(row.debit),
      credit: Number(row.credit),
    }));

    res.json(formatted);
  } catch {
    res.status(500).json({ message: "Failed to fetch accounts" });
  }
};
