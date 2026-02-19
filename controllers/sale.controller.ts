import { Request, Response } from "express";
import pool from "../database/db";

export const getSales = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
  s.id AS id,
  s.customerId,
  c.customerName,
  DATE_FORMAT(s.saleDate, '%Y-%m-%d') AS saleDate,
  si.projectId,
  p.projectName,
  si.QTY,
  si.UnitPrice
FROM sales s
INNER JOIN customers c ON c.id = s.customerId
INNER JOIN sale_items si ON si.saleId = s.id
INNER JOIN projects p ON p.id = si.projectId
WHERE s.salesStatus = 'Y'
ORDER BY s.id DESC;

    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
};

export const addSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, saleDate, items } = req.body;

    if (!customerId || !saleDate || !items || !items.length) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const [saleResult]: any = await pool.query(
      `INSERT INTO sales (customerId, saleDate, salesStatus) VALUES (?, ?, 'Y')`,
      [customerId, saleDate],
    );

    const saleId = saleResult.insertId;

    for (const item of items) {
      const { projectId, QTY, UnitPrice } = item;

      const [projectRows]: any = await pool.query(
        `SELECT startDate, endDate FROM projects WHERE id = ? AND projectStatus = 'Y'`,
        [projectId],
      );

      if (!projectRows.length) {
        res.status(404).json({ message: `Project ${projectId} not found` });
        return;
      }

      const projectEndDate = new Date(projectRows[0].endDate);
      const inputSaleDate = new Date(saleDate);

      if (inputSaleDate <= projectEndDate) {
        res.status(400).json({
          message: `Sale date for project ${projectId} must be after project end date`,
        });
        return;
      }

      await pool.query(
        `INSERT INTO sale_items (saleId, projectId, QTY, UnitPrice)
         VALUES (?, ?, ?, ?)`,
        [saleId, projectId, QTY, UnitPrice],
      );
    }

    res.status(201).json({ message: "Sale added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add sale" });
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(`UPDATE sales SET salesStatus = 'N' WHERE id = ?`, [id]);

    res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete sale" });
  }
};
