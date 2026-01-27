import { Request, Response } from "express";
import pool from "../database/db";

export const getAllProjects = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows]: any = await pool.query(
      `
      SELECT 
        id,
        projectName,
        projectCategory,
        description,
        completionStatus,
        DATE_FORMAT(startDate, '%Y-%m-%d') as startDate,
        DATE_FORMAT(endDate, '%Y-%m-%d') as endDate
      FROM projects
      WHERE projectStatus = 'Y'
      ORDER BY id DESC
      `
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

export const addProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { projectName, projectCategory, description, startDate, endDate , completionStatus } =
      req.body;

    if (!projectName || !projectCategory || !startDate || !endDate) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    await pool.query(
      `
      INSERT INTO projects 
      (projectName, projectCategory, description, startDate, endDate, projectStatus, completionStatus)
      VALUES (?, ?, ?, ?, ?, 'Y', ?)
      `,
      [projectName, projectCategory, description, startDate, endDate, completionStatus]
    );

    res.status(201).json({ message: "Project added successfully" });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Failed to add project" });
  }
};

export const updateProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      projectName,
      projectCategory,
      description,
      startDate,
      endDate,
      completionStatus,
    } = req.body;

    if (!projectName || !projectCategory || !startDate || !endDate || !completionStatus) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    await pool.query(
      `
      UPDATE projects
      SET
        projectName = ?,
        projectCategory = ?,
        description = ?,
        startDate = ?,
        endDate = ?,
        completionStatus = ?
      WHERE id = ?
      `,
      [
        projectName,
        projectCategory,
        description,
        startDate,
        endDate,
        completionStatus,
        id,
      ]
    );

    const [updatedRows]: any = await pool.query(
      `
      SELECT 
        id,
        projectName,
        projectCategory,
        description,
        DATE_FORMAT(startDate, '%Y-%m-%d') as startDate,
        DATE_FORMAT(endDate, '%Y-%m-%d') as endDate,
        completionStatus
      FROM projects
      WHERE id = ?
      `,
      [id]
    );

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedRows[0],
    });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Failed to update project" });
  }
};

// projects.controller.ts

export const updateCompletionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionStatus } = req.body;

    // Validate if the status is one of your allowed types
    const allowedStatuses = ["New", "Working", "Complete"];
    if (!allowedStatuses.includes(completionStatus)) {
      res.status(400).json({ message: "Invalid completion status" });
      return;
    }

    const [result]: any = await pool.query(
      `UPDATE projects SET completionStatus = ? WHERE id = ?`,
      [completionStatus, id]
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    res.status(200).json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Error updating project status:", error);
    res.status(500).json({ message: "Failed to update project status" });
  }
};


export const deleteProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE projects
      SET projectStatus = 'N'
      WHERE id = ?
      `,
      [id]
    );

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
};
