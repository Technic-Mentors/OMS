import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket } from "mysql2";

interface Login extends RowDataPacket {
  id: number;
  name: string;
  loginStatus: string;
  projectName: string;
}

interface EmployeeLifeLine {
  employee_id: number;
  employeeName: string;
  email: string;
  contact: string;
  position: string;
  date: string;
}

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query<Login[]>(
      `SELECT id ,name
       FROM login
       WHERE loginStatus = 'Y'
       ORDER BY id DESC`
    );

    const usersForDropdown = rows.map((user) => ({
      id: user.id,
      name: user.name,
      loginStatus: user.loginStatus,
    }));

    res.status(200).json({
      message: "Users fetched successfully",
      users: usersForDropdown,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const addEmpll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employee_id, employeeName, email, contact, position, date } =
      req.body as EmployeeLifeLine;

    if (
      !employee_id ||
      !employeeName ||
      !email ||
      !contact ||
      !position ||
      !date
    ) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const [result]: any = await pool.query(
      `INSERT INTO employee_lifeline 
        (employee_id, employee_name, email, contact, position, date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, employeeName, email, contact, position, date]
    );

    const [rows]: any = await pool.query(
      `SELECT 
         id, 
         employee_name AS employeeName, 
         email,
         contact, 
         position, 
         date
       FROM employee_lifeline
       WHERE id = ?`,
      [result.insertId]
    );

    const newLifeLine = rows[0];
    newLifeLine.date = newLifeLine.date
      ? new Date(newLifeLine.date).toISOString().split("T")[0]
      : null;

    res.status(201).json({
      message: "Employee LifeLine added successfully",
      newLifeLine,
    });
  } catch (error) {
    console.error("Add Employee LifeLine Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getEmpll = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      `SELECT 
         id, 
         employee_name AS employeeName, 
         contact, 
         position, 
         date
       FROM employee_lifeline 
       ORDER BY id DESC`
    );

    const formattedRows = rows.map((row: any) => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split("T")[0] : null,
    }));

    res.status(200).json({
      success: true,
      message: "Employee lifelines fetched successfully",
      data: formattedRows,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateEmpll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { employeeName, contact, position, date } =
      req.body as EmployeeLifeLine;

    if (!employeeName || !contact || !position || !date) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const [result]: any = await pool.query(
      `UPDATE employee_lifeline
       SET employee_name = ?, contact = ?, position = ?, date = ?
       WHERE id = ?`,
      [employeeName, contact, position, date, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Employee LifeLine not found" });
      return;
    }

    const [rows]: any = await pool.query(
      `SELECT id, employee_name AS employeeName, contact, position, date
       FROM employee_lifeline
       WHERE id = ?`,
      [id]
    );

    const updatedLifeLine = rows[0];
    updatedLifeLine.date = updatedLifeLine.date
      ? new Date(updatedLifeLine.date).toISOString().split("T")[0]
      : null;

    res.status(200).json({
      message: "Employee LifeLine updated successfully",
      updatedLifeLine,
    });
  } catch (error) {
    console.error("Update Employee LifeLine Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteEmpll = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const [result]: any = await pool.query(
      `DELETE FROM employee_lifeline WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Employee LifeLine not found" });
      return;
    }

    res.status(200).json({ message: "Employee LifeLine deleted successfully" });
  } catch (error) {
    console.error("Delete Employee LifeLine Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
