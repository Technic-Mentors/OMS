import { Request, Response } from "express";
import pool from "../database/db";

export const getAllCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT id, categoryName 
       FROM categories 
       WHERE categoryStatus = 'Y'
       ORDER BY id ASC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Get Categories Error:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const addCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { categoryName } = req.body;

    if (!categoryName?.trim()) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }

    await pool.query(
      `INSERT INTO categories (categoryName, categoryStatus)
       VALUES (?, 'Y')`,
      [categoryName]
    );

    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    console.error("Add Category Error:", error);
    res.status(500).json({ message: "Failed to add category" });
  }
};

export const updateCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { categoryName } = req.body;

    if (!categoryName?.trim()) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }

    await pool.query(
      `UPDATE categories 
       SET categoryName = ?
       WHERE id = ? AND categoryStatus = 'Y'`,
      [categoryName, id]
    );

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error("Update Category Error:", error);
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query(
      `UPDATE categories 
       SET categoryStatus = 'N'
       WHERE id = ?`,
      [id]
    );

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete Category Error:", error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};
