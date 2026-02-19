import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.id , q.refNo, c.customerName
      FROM quotations q
      JOIN customers c ON q.customerId = c.id
      WHERE q.isDeleted = FALSE
      ORDER BY q.createdAt DESC
    `);
    res.json({ data: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getQuotation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    const [quotations] = await pool.query<RowDataPacket[]>(
      `SELECT q.id, q.refNo, c.customerName, q.date, q.subTotal, q.totalBill
       FROM quotations q
       JOIN customers c ON q.customerId = c.id
       WHERE q.id = ?`,
      [id],
    );

    if (!quotations[0]) {
      res.status(404).json({ message: "Quotation not found" });
    }

    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT id, projectId, projectName, description, QTY, UnitPrice 
       FROM quotation_items 
       WHERE quotationId = ?`,
      [id],
    );

    res.json({
      ...quotations[0],
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addQuotation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { date, customerId, items, subTotal, totalBill } = req.body;

  try {
    const [result]: any = await pool.query(
      `INSERT INTO quotations (refNo, customerId, date, subTotal, totalBill) VALUES (?, ?, ?, ?, ?)`,
      [`REF-${Date.now()}`, customerId, date, subTotal, totalBill],
    );

    const quotationId = result.insertId;

    for (const item of items) {
      await pool.query(
        `INSERT INTO quotation_items (quotationId, projectId, projectName, description, QTY, UnitPrice) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          quotationId,
          item.projectId,
          item.projectName,
          item.description,
          item.QTY,
          item.UnitPrice,
        ],
      );
    }

    res.status(201).json({ message: "Quotation added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
