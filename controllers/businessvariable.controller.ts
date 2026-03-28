import { Request, Response } from "express";
import pool from "../database/db";
import { uploadToCloudinary } from "../utils/cloudinary";

export const getBusinessVariables = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
        SELECT 
            id,
            name,
            email,
            contact,
            address,
            logo
        FROM business_variables
        ORDER BY id DESC
    `);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ message: "Failed to fetch business variables" });
  }
};

export const addBusinessVariable = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, contact, address } = req.body;

    if (!name || !email || !contact || !address) {
      res.status(400).json({
        message: "Name, email and contact are required",
      });
      return;
    }

    let logoUrl = null;

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "oms_business_variables",
      );
      logoUrl = result.secure_url;
    }

    const [result]: any = await pool.query(
      `
        INSERT INTO business_variables
        (name,email,contact, address,logo)
        VALUES (?,?,? ,?,?)
        `,
      [name, email, contact, address, logoUrl],
    );

    res.status(201).json({
      message: "Business variable added",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Insert error:", error);
    res.status(500).json({ message: "Failed to add business variable" });
  }
};

export const editBusinessVariable = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, contact, address } = req.body;

    if (!name || !email || !contact || !address) {
      res.status(400).json({
        message: "Required fields missing",
      });
      return;
    }

    let logoUrl: string | null = null;

    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "oms_business_variables",
      );
      logoUrl = result.secure_url;
    }

    if (logoUrl) {
      await pool.query(
        `
        UPDATE business_variables
        SET name=?, email=?, contact=?, address=?, logo=?
        WHERE id=?
        `,
        [name, email, contact, address, logoUrl, id],
      );
    } else {
      await pool.query(
        `
        UPDATE business_variables
        SET name=?, email=?, contact=?, address=?
        WHERE id=?
        `,
        [name, email, contact, address, id],
      );
    }

    res.status(200).json({
      message: "Business variable updated",
    });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Failed to update business variable" });
  }
};

export const deleteBusinessVariable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await pool.query(
      `
      DELETE FROM business_variables
      WHERE id=?
      `,
      [id],
    );

    res.status(200).json({
      message: "Business variable deleted",
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Failed to delete business variable" });
  }
};
