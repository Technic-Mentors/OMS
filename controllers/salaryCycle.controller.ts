import { Request, Response } from "express";
import pool from "../database/db";

export const runSalaryCycle = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { year, month } = req.body;

    const [existing]: any = await pool.query(
      `SELECT id FROM employee_accounts 
   WHERE refNo LIKE ? 
   LIMIT 1`,
      [`SAL-${month}-${year}-%`],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message: `Salary cycle has already been run for ${month} ${year}`,
      });
      return;
    }

    const salaryDate = new Date(`${year}-${month}-01`);

    const [salaries]: any = await pool.query(
      `SELECT * FROM configempsalaries 
       WHERE status='ACTIVE' 
       AND MONTH(config_date)=MONTH(?) 
       AND YEAR(config_date)=YEAR(?)`,
      [salaryDate, salaryDate],
    );

    if (salaries.length === 0) {
      res.status(400).json({ message: "No active salaries to run" });
      return;
    }

    for (const sal of salaries) {
      const [loanRows]: any = await pool.query(
        `SELECT COALESCE(SUM(CAST(deduction AS DECIMAL(10,2))), 0) AS total_loan_deduction
     FROM loan
     WHERE employee_id = ?`,
        [sal.employee_id],
      );

     const [activeLoans]: any = await pool.query(
        `SELECT id, remainingAmount, return_amount, deduction 
         FROM loan 
         WHERE employee_id = ? AND remainingAmount > 0`,
        [sal.employee_id]
    );

    let monthlyLoanDeduction = 0;

    for (const loan of activeLoans) {
        const deductNow = Math.min(loan.deduction, loan.remainingAmount);
        monthlyLoanDeduction += Number(deductNow);

        await pool.query(
            `UPDATE loan 
             SET return_amount = return_amount + ?, 
                 remainingAmount = remainingAmount - ? 
             WHERE id = ?`,
            [deductNow, deductNow, loan.id]
        );
    }

    const debit = Number(sal.total_salary) - monthlyLoanDeduction;

    if (isNaN(debit) || debit < 0) continue;

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

    res.json({ message: "Salary cycle run successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error running salary cycle" });
  }
};
