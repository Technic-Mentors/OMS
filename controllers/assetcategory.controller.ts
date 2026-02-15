import { Request, Response } from "express";
import pool from "../database/db";

export const getCategories = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM asset_categories ORDER BY id DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getCategoryById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      "SELECT * FROM asset_categories WHERE id = ?",
      [id],
    );
    if ((rows as any[]).length === 0)
      res.status(404).json({ message: "Category not found" });
    res.json((rows as any[])[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addCategory = async (req: Request, res: Response):Promise <void> => {
  const { category_name, category_status } = req.body;
  try {
    const [existing]: any = await pool.query(
      "SELECT id FROM asset_categories WHERE LOWER(category_name) = LOWER(?)",
      [category_name],
    );

    if (existing.length > 0) {
      res.status(400).json({ message: "Category name already exists" });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO asset_categories (category_name, category_status) VALUES (?, ?)",
      [category_name, (category_status || "Y").charAt(0)],
    );
    res
      .status(201)
      .json({ message: "Category added", id: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateCategory = async (req: Request, res: Response):Promise<void> => {
  const { id } = req.params;
  const { category_name, category_status } = req.body;
  try {
    const [existing]: any = await pool.query(
      "SELECT id FROM asset_categories WHERE LOWER(category_name) = LOWER(?) AND id != ?",
      [category_name, id],
    );

    if (existing.length > 0) {
     res
        .status(400)
        .json({ message: "Another category with this name already exists" });
        return;
    }

    const [result] = await pool.query(
      "UPDATE asset_categories SET category_name = ?, category_status = ? WHERE id = ?",
      [category_name, category_status || "Y", id],
    );
    res.json({ message: "Category updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const [linkedAssets]: any = await pool.query(
      "SELECT id FROM assets WHERE category_id = ? LIMIT 1",
      [id]
    );

    if (linkedAssets.length > 0) {
      res.status(400).json({ 
        message: "Cannot delete category: It is currently assigned to one or more assets." 
      });
      return;
    }

    await pool.query("DELETE FROM asset_categories WHERE id = ?", [id]);
    res.json({ message: "Category deleted successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
