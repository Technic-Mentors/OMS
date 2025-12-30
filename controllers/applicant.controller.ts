import { Request, Response } from "express";
import pool from "../database/db";

export const getApplicants = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const offset = (page - 1) * limit;

    let query = `SELECT a.id, a.applicant_name,   a.applicant_contact,
 a.applied_date, j.job_title AS job, a.applicant_status AS status
                 FROM applicants a
                 JOIN jobs j ON a.job_id = j.id
                 WHERE a.status = 'Y'`;

    if (search) {
      query += ` AND a.applicant_name LIKE ?`;
    }

    query += ` ORDER BY a.id DESC LIMIT ? OFFSET ?`;

    const params: (string | number)[] = search
      ? [`%${search}%`, limit, offset]
      : [limit, offset];

    const [rows] = await pool.query(query, params);

    const [totalResult] = await pool.query(
      `SELECT COUNT(*) as total FROM applicants WHERE status='Y' ${
        search ? "AND applicant_name LIKE ?" : ""
      }`,
      search ? [`%${search}%`] : []
    );

    const total = (totalResult as any)[0].total;

    res.json({ data: rows, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
};

export const addApplicant = async (req: Request, res: Response) => {
  try {
    const {
      applicant_name,
      applicant_contact,
      applied_date,
      job_id,
      applicant_status = "pending",
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO applicants (applicant_name, applicant_contact, applied_date, job_id , applicant_status) VALUES (?, ?, ?, ? , 'pending')",
      [
        applicant_name,
        applicant_contact,
        applied_date,
        job_id,
        applicant_status,
      ]
    );

    res.status(201).json({
      message: "Applicant added successfully",
      id: (result as any).insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add applicant" });
  }
};

export const updateApplicant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      applicant_name,
      applicant_contact,
      applied_date,
      job_id,
      applicant_status,
    } = req.body;

    const formattedDate = applied_date ? applied_date.split("T")[0] : null;

    if (job_id) {
      await pool.query(
        `UPDATE applicants
         SET applicant_name=?, applicant_contact=?, applied_date=?, job_id=?, applicant_status=?
         WHERE id=?`,
        [
          applicant_name,
          applicant_contact,
          formattedDate,
          job_id,
          applicant_status,
          id,
        ]
      );
    } else {
      await pool.query(
        `UPDATE applicants
         SET applicant_name=?, applicant_contact=?, applied_date=?, applicant_status=?
         WHERE id=?`,
        [applicant_name, applicant_contact, formattedDate, applicant_status, id]
      );
    }

    res.json({ message: "Applicant updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update applicant" });
  }
};

export const deleteApplicant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query("UPDATE applicants SET status='N' WHERE id=?", [id]);

    res.json({ message: "Applicant deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete applicant" });
  }
};
