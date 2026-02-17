import { Request, Response } from "express";
import pool from "../database/db";

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
  const { supplierId, paymentType, amount, paymentMethod, paymentDate } =
    req.body;

  try {
    const refNo = `SUP-${Date.now()}`;

    const debit = paymentType === "debit" ? amount : 0;
    const credit = paymentType === "credit" ? amount : 0;

    await pool.query(
      `INSERT INTO supplier_accounts
      (supplierId, refNo, debit, credit, paymentMethod, paymentDate)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [supplierId, refNo, debit, credit, paymentMethod, paymentDate],
    );

    res.status(201).json({ message: "Supplier account added" });
  } catch {
    res.status(500).json({ message: "Failed to add supplier account" });
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
      `SELECT id, refNo, debit, credit,paymentMethod, paymentDate
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
