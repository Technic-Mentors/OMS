import { Request, Response } from "express";
import pool from "../database/db";

export const getSalaries = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        c.id,
        c.employee_id,
        COALESCE(e.employee_name) AS employee_name,
        c.salary_amount,
        c.emp_of_mon_allowance,
        c.transport_allowance,
        c.medical_allowance,
        c.total_salary,
        COALESCE(SUM(CAST(l.deduction AS DECIMAL(10,2))), 0) AS total_loan_deduction,
        (c.total_salary - COALESCE(SUM(CAST(l.deduction AS DECIMAL(10,2))), 0)) AS net_salary,
        c.config_date
      FROM configempsalaries c
      LEFT JOIN employee_lifeline e 
        ON c.employee_id = e.employee_id
      LEFT JOIN loan l
        ON l.employee_id = c.employee_id
      WHERE c.status = 'ACTIVE'
      GROUP BY 
        c.id, 
        c.employee_id, 
        e.employee_name,
        c.salary_amount,
        c.emp_of_mon_allowance,
        c.transport_allowance,
        c.medical_allowance,
        c.total_salary,
        c.config_date
      ORDER BY c.config_date DESC
      `,
    );

    res.json({
      salaries: rows,
      total: (rows as any).length,
    });
  } catch (error: any) {
    console.error("SQL ERROR:", error.sqlMessage || error.message || error);
    res.status(500).json({ message: "Error fetching salaries" });
  }
};

export const getSalaryById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      `SELECT * FROM configempsalaries WHERE id = ? AND status='ACTIVE'`,
      [id],
    );

    if ((rows as any).length === 0)
      res.status(404).json({ message: "Salary not found" });

    res.json((rows as any)[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching salary" });
  }
};

export const addSalary = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      employee_id,
      salary_amount,
      emp_of_mon_allowance = 0,
      transport_allowance = 0,
      medical_allowance = 0,
      total_salary,
      config_date,
    } = req.body;

    const [existing]: any = await pool.query(
      `SELECT id FROM configempsalaries 
       WHERE employee_id = ? 
       AND MONTH(config_date) = MONTH(?) 
       AND YEAR(config_date) = YEAR(?) 
       AND status = 'ACTIVE'`,
      [employee_id, config_date, config_date],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message:
          "Salary for this employee has already been configured for this month.",
      });
      return;
    }

    const [empRows]: any = await pool.query(
      `SELECT date FROM employee_lifeline WHERE employee_id = ?`,
      [employee_id],
    );

    if (empRows.length === 0) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDate = new Date(empRows[0].date);
    const configDate = new Date(config_date);

    if (configDate < joiningDate) {
      res.status(400).json({
        message: "Cannot configure salary before employee joining date.",
      });
      return;
    }

    const [result] = await pool.query(
      `INSERT INTO configempsalaries
       (employee_id, salary_amount, emp_of_mon_allowance, transport_allowance, medical_allowance, total_salary, config_date , status)
       VALUES (?, ?, ?, ?, ?, ?, ? , "ACTIVE")`,
      [
        employee_id,
        salary_amount,
        emp_of_mon_allowance,
        transport_allowance,
        medical_allowance,
        total_salary,
        config_date,
      ],
    );

    res
      .status(201)
      .json({ message: "Salary added", id: (result as any).insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding salary" });
  }
};

export const updateSalary = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      employee_id,
      salary_amount,
      emp_of_mon_allowance = 0,
      transport_allowance = 0,
      medical_allowance = 0,
      total_salary,
      config_date,
    } = req.body;

    const [existing]: any = await pool.query(
      `SELECT id FROM configempsalaries 
       WHERE employee_id = ? 
       AND MONTH(config_date) = MONTH(?) 
       AND YEAR(config_date) = YEAR(?) 
       AND status = 'ACTIVE' 
       AND id != ?`,
      [employee_id, config_date, config_date, id],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message:
          "A configuration for this employee already exists in the selected month.",
      });
      return;
    }

     const [empRows]: any = await pool.query(
      `SELECT date FROM employee_lifeline WHERE employee_id = ?`,
      [employee_id],
    );

    if (empRows.length === 0) {
      res.status(404).json({ message: "Employee not found" });
      return;
    }

    const joiningDate = new Date(empRows[0].date);
    const configDate = new Date(config_date);

    if (configDate < joiningDate) {
      res.status(400).json({
        message: "Cannot configure salary before employee joining date.",
      });
      return;
    }

    await pool.query(
      `UPDATE configempsalaries
       SET salary_amount=?, emp_of_mon_allowance=?, transport_allowance=?, medical_allowance=?, total_salary=?, config_date=?
       WHERE id=?`,
      [
        salary_amount,
        emp_of_mon_allowance,
        transport_allowance,
        medical_allowance,
        total_salary,
        config_date,
        id,
      ],
    );

    res.json({ message: "Salary updated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating salary" });
  }
};

export const deleteSalary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await pool.query(
      `UPDATE configempsalaries SET status='INACTIVE' WHERE id=?`,
      [id],
    );
    res.json({ message: "Salary deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting salary" });
  }
};
