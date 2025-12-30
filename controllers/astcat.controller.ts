import { Request, Response } from "express";
import pool from "../database/db";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM asset_categories ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM asset_categories WHERE id = ?",
      [id]
    );
    if ((rows as any[]).length === 0)
      res.status(404).json({ message: "Category not found" });
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addCategory = async (req: Request, res: Response) => {
  const { category_name, category_status } = req.body;
  try {
    const [result] = await pool.query(
      "INSERT INTO asset_categories (category_name, category_status) VALUES (?, ?)",
      [category_name, (category_status || "Y").charAt(0)]
    );
    res
      .status(201)
      .json({ message: "Category added", id: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category_name, category_status } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE asset_categories SET category_name = ?, category_status = ? WHERE id = ?",
      [category_name, category_status || "Y", id]
    );
    res.json({ message: "Category updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query(
      "DELETE FROM asset_categories WHERE id = ?",
      [id]
    );
    res.json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
