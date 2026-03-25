import { Request, Response } from "express";
import pool from "../database/db";



export const getOvertime = async (req: Request, res: Response) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        o.id,
        o.employee_id,
        u.name,
        o.date,
        o.time,
        o.overtime_amount,
        o.description
      FROM overtime o
      JOIN login u ON u.id = o.employee_id
      ORDER BY o.id DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch overtime" });
  }
};

export const createOvertime = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const user = (req as any).user;
    const { date, time, description, employee_id, overtime_amount } = req.body;

    const empId = user.role === "admin" ? employee_id : user.id;

    const [existing]: any = await connection.query(
      `SELECT id FROM overtime WHERE employee_id = ? AND date = ?`,
      [empId, date],
    );

    if (existing.length > 0) {
      await connection.rollback();
      res
        .status(400)
        .json({ message: "Overtime already exists for this date." });
      return;
    }


    const overtimeVal = user.role === "admin" ? Number(overtime_amount) : 0;

    await connection.query(
      `INSERT INTO overtime (employee_id, date, time, overtime_amount, description) VALUES (?, ?, ?, ?, ?)`,
      [empId, date, time, overtimeVal, description],
    );

    // ===== Add debit to employee account =====
    if (overtimeVal > 0) {
      // Fetch previous balance
      const [last]: any = await connection.query(
        `SELECT balance FROM employee_accounts WHERE employee_id = ? ORDER BY id DESC LIMIT 1 FOR UPDATE`,
        [empId],
      );

      const previousBalance = last.length ? Number(last[0].balance) : 0;
      const currentBalance = previousBalance + overtimeVal; // debit

      // Generate invoiceNo
      const [seqRows]: any = await connection.query(
        `SELECT employee_acc_no FROM invoice_sequence WHERE id = 1 FOR UPDATE`,
      );

      let nextNumber = 1;
      if (seqRows.length) {
        nextNumber = seqRows[0].employee_acc_no + 1;
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
      const refNo = `REF-${Date.now()}`;

      await connection.query(
        `INSERT INTO employee_accounts (employee_id, refNo, invoiceNo, payment_date, debit, credit, balance, payment_method)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          empId,
          refNo,
          formattedInvoice,
          date,
          overtimeVal,
          0,
          currentBalance,
          "Overtime",
        ],
      );
    }

    await connection.commit();
    res
      .status(201)
      .json({ message: "Overtime added and account debited successfully" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Create Overtime Error:", error);
    res.status(500).json({ message: "Failed to add overtime" });
  } finally {
    connection.release();
  }
};
