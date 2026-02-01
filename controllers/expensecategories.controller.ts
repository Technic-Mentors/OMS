import { Request, Response } from "express";
import pool from "../database/db";

export const getExpenseCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.query(
      `SELECT id, categoryName 
       FROM expensecategory
       WHERE categoryStatus = 'Y'
       ORDER BY id DESC`
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
};

export const addExpenseCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { categoryName } = req.body;

  if (!categoryName) {
    res.status(400).json({ message: "Category name is required" });
     return
  }

  try {
    await pool.query(
      `INSERT INTO expensecategory (categoryName, categoryStatus)
       VALUES (?, 'Y')`,
      [categoryName]
    );

    res.status(201).json({ message: "Category added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add category" });
  }
};

export const updateExpenseCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { categoryName } = req.body;

  if (!categoryName) {
    res.status(400).json({ message: "Category name is required" });
    return;
  }

  try {
    await pool.query(
      `UPDATE expensecategory
       SET categoryName = ?
       WHERE id = ?`,
      [categoryName, id]
    );

    res.status(200).json({ message: "Category updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update category" });
  }
};

export const deleteExpenseCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE expensecategory
       SET categoryStatus = 'N'
       WHERE id = ?`,
      [id]
    );

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete category" });
  }
};
