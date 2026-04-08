import { Request, Response } from "express";
import pool from "../database/db";

export const getAllProjects = async (
  req: Request,
  res: Response,
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
        isOnGoing,
        DATE_FORMAT(startDate, '%Y-%m-%d') as startDate,
        DATE_FORMAT(endDate, '%Y-%m-%d') as endDate
      FROM projects
      WHERE projectStatus = 'Y'
      ORDER BY id DESC
      `,
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

export const addProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      projectName,
      projectCategory,
      description,
      startDate,
      endDate,
      completionStatus,
    } = req.body;

    const safeEndDate = endDate ? endDate : null;

    if (!projectName || !projectCategory || !startDate) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    if (endDate && new Date(startDate) > new Date(endDate)) {
      res
        .status(400)
        .json({ message: "Start date cannot be greater than end date" });
      return;
    }

    const trimmedName = projectName.trim();
    const trimmedCategory = projectCategory.trim();

    const [existing]: any = await pool.query(
      `
      SELECT id 
      FROM projects 
      WHERE LOWER(projectName) = LOWER(?) 
        AND LOWER(projectCategory) = LOWER(?) 
        AND projectStatus = 'Y'
      `,
      [trimmedName, trimmedCategory],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message: "Project with this name and category already exists",
      });
      return;
    }

    await pool.query(
      `
  INSERT INTO projects 
  (projectName, projectCategory, description, startDate, endDate, projectStatus, completionStatus , isOnGoing)
  VALUES (?, ?, ?, ?, ?, 'Y', ?, ?)
  `,
      [
        trimmedName,
        trimmedCategory,
        description,
        startDate,
        safeEndDate, // ✅ important
        completionStatus,
        endDate ? 0 : 1,
      ],
    );

    res.status(201).json({ message: "Project added successfully" });
  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Failed to add project" });
  }
};

export const updateProject = async (
  req: Request,
  res: Response,
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

    if (!projectName || !projectCategory || !startDate || !completionStatus) {
      res.status(400).json({ message: "Required fields are missing" });
      return;
    }

    let safeEndDate = endDate ? endDate : null;

    // 👉 enforce rule based on status
    if (completionStatus === "New" || completionStatus === "Working") {
      safeEndDate = null;
    }

    if (completionStatus === "Completed") {
      if (!endDate) {
        res
          .status(400)
          .json({ message: "End date is required for completed projects" });
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        res.status(400).json({
          message: "Start date cannot be greater than end date",
        });
        return;
      }
    }

    const trimmedName = projectName.trim();
    const trimmedCategory = projectCategory.trim();

    const [existing]: any = await pool.query(
      `
      SELECT id 
      FROM projects 
      WHERE LOWER(projectName) = LOWER(?) 
        AND LOWER(projectCategory) = LOWER(?) 
        AND projectStatus = 'Y'
        AND id != ?
      `,
      [trimmedName, trimmedCategory, id],
    );

    if (existing.length > 0) {
      res.status(400).json({
        message: "Another project with this name and category already exists",
      });
      return;
    }

    const isOnGoing = safeEndDate ? 0 : 1;

    await pool.query(
      `
  UPDATE projects
  SET
    projectName = ?,
    projectCategory = ?,
    description = ?,
    startDate = ?,
    endDate = ?,
    completionStatus = ?,
    isOnGoing = ?
  WHERE id = ?
  `,
      [
        trimmedName,
        trimmedCategory,
        description,
        startDate,
        safeEndDate, // ✅ important
        completionStatus,
        isOnGoing,
        id,
      ],
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
      [id],
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

export const updateCompletionStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { completionStatus } = req.body;

    const allowedStatuses = ["New", "Working", "Completed"];
    if (!allowedStatuses.includes(completionStatus)) {
      res.status(400).json({ message: "Invalid completion status" });
      return;
    }

    const [result]: any = await pool.query(
      `UPDATE projects SET completionStatus = ? WHERE id = ?`,
      [completionStatus, id],
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
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      UPDATE projects
      SET projectStatus = 'N'
      WHERE id = ?
      `,
      [id],
    );

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
};
