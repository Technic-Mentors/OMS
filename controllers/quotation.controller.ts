import { Request, Response } from "express";

import pool from "../database/db";

import { RowDataPacket, ResultSetHeader } from "mysql2";

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`

      SELECT q.id , q.refNo, q.invoiceNo, c.customerName

      FROM quotations q

      JOIN customers c ON q.customerId = c.id

      WHERE q.isDeleted = FALSE

      ORDER BY q.createdAt ASC

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
      `SELECT q.id, q.refNo,  q.invoiceNo, c.customerName,  q.date, q.subTotal, q.totalBill

       FROM quotations q

       JOIN customers c ON q.customerId = c.id

       WHERE q.id = ?`,

      [id],
    );

    if (!quotations[0]) {
      res.status(404).json({ message: "Quotation not found" });
      return;
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

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT quotation_number FROM invoice_sequence WHERE id = 1 FOR UPDATE`,
    );

    let currentNumber = 0;

    if (rows.length > 0) {
      currentNumber = rows[0].quotation_number;
    } else {
      await connection.query(
        `INSERT INTO invoice_sequence (id, quotation_number) VALUES (1, 0)`,
      );

      currentNumber = 0;
    }

    const nextNumber = currentNumber + 1;

    await connection.query(
      `UPDATE invoice_sequence SET quotation_number = ? WHERE id = 1`,

      [nextNumber],
    );

    const formattedInvoice = `INV-${String(nextNumber).padStart(4, "0")}`;

    const [result]: any = await connection.query(
      `INSERT INTO quotations

       (refNo, invoiceNo, customerId, date, subTotal, totalBill)

       VALUES (?, ?, ?, ?, ?, ?)`,

      [
        `REF-${Date.now()}`,

        formattedInvoice,

        customerId,

        date,

        subTotal,

        totalBill,
      ],
    );

    const quotationId = result.insertId;

    for (const item of items) {
      await connection.query(
        `INSERT INTO quotation_items

         (quotationId, projectId, projectName, description, QTY, UnitPrice)

         VALUES (?, ?, ?, ?, ?, ?)`,

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

    await connection.commit();

    res.status(201).json({ message: "Quotation added successfully" });
  } catch (error) {
    await connection.rollback();

    console.error(error);

    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};
