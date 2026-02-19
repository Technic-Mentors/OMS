import { Request, Response } from "express";
import pool from "../database/db";
import { RowDataPacket } from "mysql2";

export const getApplicants = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || "";

    const offset = (page - 1) * limit;

    let query = `SELECT a.id, a.applicant_name, a.fatherName , a.email ,  a.applicant_contact,
 a.applied_date, j.job_title AS job,   a.interviewPhase,
 a.applicant_status AS status
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
      search ? [`%${search}%`] : [],
    );

    const total = (totalResult as any)[0].total;

    res.json({ data: rows, total });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
};

export const addApplicant = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      applicant_name,
      fatherName,
      email,
      applicant_contact,
      applied_date,
      job_id,
      interviewPhase,
      applicant_status = "pending",
    } = req.body;

    const [existing]: any = await pool.query(
      "SELECT email, applicant_contact FROM applicants WHERE (email = ? OR applicant_contact = ?) AND status = 'Y'",
      [email, applicant_contact],
    );

    if (existing.length > 0) {
      if (
        existing[0].email === email &&
        existing[0].applicant_contact === applicant_contact
      ) {
        res.status(400).json({ message: "Email and contact already exists" });
        return;
      }

      if (existing[0].email === email) {
        res.status(400).json({ message: "Email already exists" });
        return;
      }
      if (existing[0].applicant_contact === applicant_contact) {
        res.status(400).json({ message: "Contact number already exists" });
      }
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO applicants (applicant_name, fatherName, email, applicant_contact, applied_date, job_id, interviewPhase, applicant_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        applicant_name,
        fatherName,
        email,
        applicant_contact,
        applied_date,
        job_id,
        interviewPhase,
        applicant_status,
      ],
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

export const updateApplicant = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      applicant_name,
      fatherName,
      email,
      applicant_contact,
      applied_date,
      job_id,
      interviewPhase,
      applicant_status,
    } = req.body;

    const [existing] = await pool.query<RowDataPacket[]>(
      "SELECT email, applicant_contact FROM applicants WHERE (email = ? OR applicant_contact = ?) AND id != ? AND status = 'Y'",
      [email, applicant_contact, id],
    );

    if (existing.length > 0) {
      if (
        existing[0].email === email &&
        existing[0].applicant_contact === applicant_contact
      ) {
        res.status(400).json({ message: "Email and contact already exists" });
        return;
      }

      if (existing[0].email === email) {
        res.status(400).json({ message: "Email already exists" });
        return;
      }
      if (existing[0].applicant_contact === applicant_contact) {
        res.status(400).json({ message: "Contact number already exists" });
      }
      return;
    }

    const formattedDate = applied_date ? new Date(applied_date).toISOString().split('T')[0] : null;

    const query = `
      UPDATE applicants 
      SET applicant_name=?, fatherName=?, email=?, applicant_contact=?, applied_date=?, job_id=COALESCE(?, job_id), interviewPhase=?, applicant_status=?
      WHERE id=?`;

    await pool.query(query, [
      applicant_name,
      fatherName,
      email,
      applicant_contact,
      formattedDate,
      job_id || null,
      interviewPhase,
      applicant_status,
      id,
    ]);

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
