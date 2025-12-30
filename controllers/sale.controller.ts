import { Request, Response } from "express";
import pool from "../database/db";


export const getSales = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        s.id,
        s.projectId,
        p.projectName,
        s.customerId,
        c.customerName,
        s.saleDate
      FROM sales s
      INNER JOIN projects p ON p.id = s.projectId
      INNER JOIN customers c ON c.id = s.customerId
      WHERE s.salesStatus = 'Y'
      ORDER BY s.id DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch sales" });
  }
};


export const addSale = async (req: Request, res: Response): Promise <void> => {
  try {
    const { projectId, customerId , saleDate } = req.body;

    if (!projectId || !customerId || !saleDate) {
      res.status(400).json({ message: "All fields are required" });
    }

    await pool.query(
      `INSERT INTO sales (projectId, customerId, saleDate, salesStatus)
       VALUES (?, ?, ? , 'Y')`,
      [projectId, customerId , saleDate]
    );

    res.status(201).json({ message: "Sale added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add sale" });
  }
};


export const updateSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { projectId, customerId , saleDate } = req.body;

    await pool.query(
      `UPDATE sales 
       SET projectId = ?, customerId = ?, saleDate = ?
       WHERE id = ?`,
      [projectId, customerId, saleDate, id]
    );

    res.status(200).json({ message: "Sale updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update sale" });
  }
};


export const deleteSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE sales SET salesStatus = 'N' WHERE id = ?`,
      [id]
    );

    res.status(200).json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete sale" });
  }
};
