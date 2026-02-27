import { Request, Response } from "express";
import pool from "../database/db";

export const runSalaryCycle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { year, month } = req.body;

    const [existing]: any = await pool.query(
      `SELECT id FROM employee_accounts WHERE refNo LIKE ? LIMIT 1`,
      [`SAL-${month}-${year}-%`],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message: `Salary cycle has already been run for ${month} ${year}`,
      });
      return;
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthIndex = monthNames.indexOf(month);
    const salaryDate = new Date(`${year}-${month}-01`);

    const [salaries]: any = await pool.query(
      `SELECT 
        c.id,
        c.employee_id,
        c.total_salary,
        c.config_date,
        c.effective_from,
        DAY(LAST_DAY(c.config_date)) AS total_days,
        (DATEDIFF(c.config_date, c.effective_from) + 1) AS effective_days,
        ROUND(
          (c.total_salary / DAY(LAST_DAY(c.config_date))) *
          (DATEDIFF(c.config_date, c.effective_from) + 1)
        ) AS prorated_salary,
        COALESCE(SUM(CAST(l.deduction AS DECIMAL(10,2))), 0) AS total_loan_deduction,
        ROUND(
          (
            (c.total_salary / DAY(LAST_DAY(c.config_date))) *
            (DATEDIFF(c.config_date, c.effective_from) + 1)
          ) - COALESCE(SUM(CAST(l.deduction AS DECIMAL(10,2))), 0)
        ) AS net_salary
      FROM configempsalaries c
      LEFT JOIN loan l ON l.employee_id = c.employee_id AND l.remainingAmount > 0
      WHERE c.status='ACTIVE' 
        AND MONTH(c.config_date)=MONTH(?) 
        AND YEAR(c.config_date)=YEAR(?)
      GROUP BY 
        c.id,
        c.employee_id,
        c.total_salary,
        c.config_date,
        c.effective_from`,
      [salaryDate, salaryDate],
    );

    if (salaries.length === 0) {
      res.status(400).json({ message: "No active salaries to run" });
      return;
    }

    for (const sal of salaries) {
      // Use the net_salary from the query which matches what's shown in ConfigEmpSalary
      const debit = Number(sal.net_salary);

      if (isNaN(debit) || debit < 0) continue;

      // Update loan return amounts if needed
      if (sal.total_loan_deduction > 0) {
        const [activeLoans]: any = await pool.query(
          `SELECT id, remainingAmount, deduction 
           FROM loan 
           WHERE employee_id = ? AND remainingAmount > 0`,
          [sal.employee_id],
        );

        for (const loan of activeLoans) {
          const deductNow = Math.min(loan.deduction, loan.remainingAmount);
          await pool.query(
            `UPDATE loan SET return_amount = return_amount + ?, remainingAmount = remainingAmount - ? WHERE id = ?`,
            [deductNow, deductNow, loan.id],
          );
        }
      }

      const [last]: any = await pool.query(
        `SELECT balance FROM employee_accounts WHERE employee_id=? ORDER BY id DESC LIMIT 1`,
        [sal.employee_id],
      );

      const previousBalance = last.length ? Number(last[0].balance) : 0;
      const credit = 0;
      const currentBalance = previousBalance + debit - credit;
      const refNo = `SAL-${month}-${year}-${sal.employee_id}`;

      await pool.query(
        `INSERT INTO employee_accounts 
        (employee_id, debit, credit, refNo, payment_date, payment_method, balance) 
        VALUES (?, ?, ?, ?, NOW(), ?, ?)`,
        [sal.employee_id, debit, credit, refNo, "Cash", currentBalance],
      );
    }

    res.json({
      message: "Salary cycle run successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error running salary cycle" });
  }
};