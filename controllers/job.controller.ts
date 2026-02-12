import { Request, Response } from "express";
import pool from "../database/db";

export const getJobs = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = (req.query.search as string) || "";

    const offset = (page - 1) * limit;

    const [rows]: any = await pool.query(
      `
      SELECT id, job_title, description
      FROM jobs
      WHERE status = 'Y'
      AND (job_title LIKE ? OR description LIKE ?)
      ORDER BY created_at ASC
      LIMIT ? OFFSET ?
      `,
      [`%${search}%`, `%${search}%`, limit, offset]
    );

    const [countResult]: any = await pool.query(
      `
      SELECT COUNT(*) as total
      FROM jobs
      WHERE status = 'Y'
      AND (job_title LIKE ? OR description LIKE ?)
      `,
      [`%${search}%`, `%${search}%`]
    );

    res.status(200).json({
      data: rows,
      total: countResult[0].total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const addJob = async (req: Request, res: Response): Promise<void> => {
  try {
    const { job_title, description } = req.body;

    if (!job_title || !description) {
      res.status(400).json({ message: "Missing fields" });
    }

    const [existing]: any = await pool.query(
      "SELECT id FROM jobs WHERE job_title = ? AND status = 'Y'",
      [job_title]
    );

    if (existing.length > 0) {
      res.status(400).json({ message: "Job title already exists" });
      return; 
    }

    await pool.query(
      `
      INSERT INTO jobs (job_title, description)
      VALUES (?, ?)
      `,
      [job_title, description]
    );

    res.status(201).json({ message: "Job added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add job" });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { job_title, description } = req.body;

    const [existing]: any = await pool.query(
      "SELECT id FROM jobs WHERE job_title = ? AND id != ? AND status = 'Y'",
      [job_title, id]
    );

    if (existing.length > 0) {
       res.status(400).json({ message: "Another job with this title already exists" });
       return;
    }

    await pool.query(
      `
      UPDATE jobs
      SET job_title = ?, description = ?
      WHERE id = ? AND status = 'Y'
      `,
      [job_title, description, id]
    );

    res.status(200).json({ message: "Job updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update job" });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE jobs
      SET status = 'N'
      WHERE id = ?
      `,
      [id]
    );

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete job" });
  }
};
