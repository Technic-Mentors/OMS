import { Request, Response } from "express";
import pool from "../database/db";

export const getCustomerAccountsList = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, customerName, customerContact, customerAddress
       FROM customers
       WHERE customerStatus = 'Y'
       ORDER BY id DESC`
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
       WHERE customerStatus = 'Y'`
    );
    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};

export const addCustomerAccount = async (req: Request, res: Response) => {
  const { customerId, debit, credit, paymentMethod, paymentDate } = req.body;

  try {
    const refNo = `${Date.now()}`;

    await pool.query(
      `INSERT INTO customer_accounts
      (customerId, refNo, debit, credit, paymentMethod, paymentDate)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [customerId, refNo, debit, credit, paymentMethod, paymentDate]
    );

    res.status(201).json({ message: "Customer account added" });
  } catch (err) {
    res.status(500).json({ message: "Failed to add customer account" });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      `SELECT customerName, customerContact, customerAddress
       FROM customers
       WHERE id = ?`,
      [id]
    );

    if (!rows.length) {
      res.status(404).json({ message: "Customer not found" });
    }

    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: "Failed to fetch customer" });
  }
};

export const getCustomerAccountsByCustomerId = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      `SELECT id, refNo, debit, credit
       FROM customer_accounts
       WHERE customerId = ?
       ORDER BY createdAt ASC`,
      [id]
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
