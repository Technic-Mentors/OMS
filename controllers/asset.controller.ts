import { Request, Response } from "express";
import pool from "../database/db";

export const getAssets = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.asset_name, c.category_name
       FROM assets a
       JOIN asset_categories c ON a.category_id = c.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addAsset = async (req: Request, res: Response) => {
  try {
    const { asset_name, category_id } = req.body;
    const [result] = await pool.query(
      `INSERT INTO assets (asset_name, category_id) VALUES (?, ?)`,
      [asset_name, category_id]
    );
    res.json({ message: "Asset added", id: (result as any).insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { asset_name, category_id } = req.body;
    await pool.query(
      `UPDATE assets SET asset_name = ?, category_id = ? WHERE id = ?`,
      [asset_name, category_id, id]
    );
    res.json({ message: "Asset updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM assets WHERE id = ?`, [id]);
    res.json({ message: "Asset deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM asset_categories WHERE category_status='Y'`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
