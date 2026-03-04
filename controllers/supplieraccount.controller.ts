import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const getSupplierAcc = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT supplierId, supplierName, supplierContact, supplierAddress
       FROM suppliers
       ORDER BY supplierId DESC`,
    );

    res.json(rows);
  } catch {
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
};

export const getSuppliers = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT supplierId, supplierName, supplierContact, supplierAddress
       FROM suppliers`,
    );

    res.json({ data: rows });
  } catch {
    res.status(500).json({ message: "Failed to fetch suppliers" });
  }
};

export const addSupplierAcc = async (req: Request, res: Response) => {
  const { supplierId, paymentType, amount, paymentMethod, paymentDate } = req.body;

  // Get a connection from the pool
  const connection = await pool.getConnection();

  try {
    // Start the transaction
    await connection.beginTransaction();

    // 1. Get the current sequence number (Use 'connection', not 'pool')
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT supplier_acc_no FROM invoice_sequence WHERE id = 1 FOR UPDATE`,
    );

    let currentNumber = 0;
    if (rows.length > 0) {
      currentNumber = rows[0].supplier_acc_no;
    } else {
      await connection.query(
        `INSERT INTO invoice_sequence (id, supplier_acc_no) VALUES (1, 0)`,
      );
    }

    const nextNumber = currentNumber + 1;

    // 2. Update the sequence
    await connection.query(
      `UPDATE invoice_sequence SET supplier_acc_no = ? WHERE id = 1`,
      [nextNumber],
    );

    const formattedInvoice = `INV-${String(nextNumber).padStart(4, "0")}`;
    const refNo = `REF-${Date.now()}`;
    const debit = paymentType === "debit" ? amount : 0;
    const credit = paymentType === "credit" ? amount : 0;

    // 3. Insert into accounts (CRITICAL: Use 'connection', not 'pool')
    await connection.query(
      `INSERT INTO supplier_accounts
      (supplierId , invoiceNo, refNo, debit, credit, paymentMethod, paymentDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [supplierId, formattedInvoice, refNo, debit, credit, paymentMethod, paymentDate],
    );

    await connection.commit();

    res.status(201).json({ message: "Supplier account added" });
  } catch (error) {
    await connection.rollback();
    console.error("Database Error:", error); 
    res.status(500).json({ message: "Failed to add supplier account" });
  } finally {
    connection.release();
  }
};

export const getSupplierById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      `SELECT supplierName, supplierContact, supplierAddress
       FROM suppliers
       WHERE supplierId = ?`,
      [id],
    );

    if (!rows.length) {
      res.status(404).json({ message: "Supplier not found" });
      return;
    }

    res.json(rows[0]);
  } catch {
    res.status(500).json({ message: "Failed to fetch supplier" });
  }
};

export const getSupplierAccounts = async (req: Request, res: Response) => {
  const { supplierId } = req.params;

  try {
    const [rows]: any = await pool.query(
      `SELECT id, invoiceNo, refNo, debit, credit,paymentMethod, paymentDate
       FROM supplier_accounts
       WHERE supplierId = ?
       ORDER BY createdAt ASC`,
      [supplierId],
    );

    const formatted = rows.map((row: any) => ({
      ...row,
      debit: Number(row.debit),
      credit: Number(row.credit),
    }));

    res.json(formatted);
  } catch {
    res.status(500).json({ message: "Failed to fetch supplier accounts" });
  }
};
