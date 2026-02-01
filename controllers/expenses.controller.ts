import { Request, Response } from "express";
import pool from "../database/db";

export const getExpenses = async (
  req: Request,
  res: Response
): Promise<void> => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        e.id,
        e.expenseName,
        e.expenseCategoryId,
        c.categoryName,
        e.addedBy,
        e.date,
        e.expenseStatus,
        e.amount
      FROM expenses e
      LEFT JOIN expensecategory c 
        ON e.expenseCategoryId = c.id
      WHERE e.expenseStatus = 'Y'
      ORDER BY e.id ASC
      LIMIT ? OFFSET ?
      `,
      [limit, offset]
    );

    const [countResult]: any = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM expenses
      WHERE expenseStatus = 'Y'
      `
    );

    const total = countResult[0].total;

    res.status(200).json({
      data: rows,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch expenses" });
  }
};

export const getTotalExpenseAmount = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows]: any = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) AS totalExpense
      FROM expenses
      WHERE expenseStatus = 'Y'
    `);

    res.status(200).json({
      totalExpense: rows[0].totalExpense,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch total expense" });
  }
};


export const addExpense = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { expenseName, expenseCategoryId, addedBy, date, amount } = req.body;

  const formattedDate = new Date(date).toLocaleDateString('sv-SE');

  try {
    await pool.query(
      `
      INSERT INTO expenses 
      (expenseName, expenseCategoryId, addedBy, date, amount , expenseStatus)
      VALUES (?, ?, ?, ?, ? , 'Y')
      `,
      [expenseName, expenseCategoryId, addedBy, formattedDate, amount]
    );

    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add expense" });
  }
};

export const updateExpense = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { expenseName, expenseCategoryId, amount, date } = req.body;

  const formattedDate = new Date(date).toISOString().split("T")[0];

  try {
    await pool.query(
      `
      UPDATE expenses
      SET expenseName = ?,
          expenseCategoryId = ?,
          amount = ?,
          date = ?
      WHERE id = ?
      `,
      [expenseName, expenseCategoryId, amount, formattedDate, id]
    );

    res.status(200).json({ message: "Expense updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update expense" });
  }
};

export const deleteExpense = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    await pool.query(
      `
      UPDATE expenses
      SET expenseStatus = 'N'
      WHERE id = ?
      `,
      [id]
    );

    res.status(200).json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete expense" });
  }
};

export const getExpenseById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;

  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        e.*,
        c.categoryName
      FROM expenses e
      LEFT JOIN expensecategory c 
        ON e.expenseCategoryId = c.id
      WHERE e.id = ?
      `,
      [id]
    );

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch expense" });
  }
};
