import { Request, Response } from "express";
import pool from "../database/db";

export const addSupplier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { supplierName, supplierEmail, supplierContact, supplierAddress } =
      req.body;

    if (!supplierName || !supplierEmail || !supplierContact || !supplierAddress)
      res.status(400).json({ message: "All fields are required" });

    const [existing]: any = await pool.query(
      "SELECT * FROM suppliers WHERE supplierName=? OR supplierEmail=? OR supplierContact=?",
      [supplierName, supplierEmail, supplierContact],
    );

    if (existing.length > 0)
      res.status(409).json({ message: "Supplier already exists" });

    const query = `
      INSERT INTO suppliers (supplierName, supplierEmail, supplierContact, supplierAddress)
      VALUES (?, ?, ?, ?)
    `;
    await pool.query(query, [
      supplierName,
      supplierEmail,
      supplierContact,
      supplierAddress,
    ]);

    res.status(201).json({ message: "Supplier added successfully" });
  } catch (error) {
    console.log("ADD SUPPLIER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSupplier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      supplierId,
      supplierName,
      supplierEmail,
      supplierContact,
      supplierAddress,
    } = req.body;

    if (!supplierId)
      res.status(400).json({ message: "supplierId is required" });

    if (!supplierName || !supplierEmail || !supplierContact || !supplierAddress)
      res.status(400).json({ message: "All fields are required" });

    const [existing]: any = await pool.query(
      `
      SELECT * FROM suppliers
      WHERE (supplierName=? OR supplierEmail=? OR supplierContact=?)
      AND supplierId != ?
      `,
      [supplierName, supplierEmail, supplierContact, supplierId],
    );

    if (existing.length > 0) {
      const duplicates: string[] = [];

      if (
        existing.some(
          (u: any) =>
            u.supplierEmail.toLowerCase() === supplierEmail.toLowerCase(),
        )
      )
        duplicates.push("Email");

      if (existing.some((u: any) => u.supplierContact === supplierContact))
        duplicates.push("Phone");

      res
        .status(400)
        .json({ message: `${duplicates.join(" and ")} already exists!` });

      return;
    }

    const query = `
      UPDATE suppliers
      SET supplierName=?, supplierEmail=?, supplierContact=?, supplierAddress=?
      WHERE supplierId=?
    `;

    await pool.query(query, [
      supplierName,
      supplierEmail,
      supplierContact,
      supplierAddress,
      supplierId,
    ]);

    res.status(200).json({ message: "Supplier updated successfully" });
  } catch (error) {
    console.log("UPDATE SUPPLIER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllSuppliers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";

    const offset = (page - 1) * limit;

    const filterQuery = `
  WHERE status='Active' AND (
    supplierName LIKE ? 
    OR supplierEmail LIKE ?
    OR supplierContact LIKE ?
    OR supplierAddress LIKE ?
  )
`;

    const [suppliers]: any = await pool.query(
      `
      SELECT * FROM suppliers
      ${filterQuery}
      ORDER BY supplierId DESC
      LIMIT ? OFFSET ?
      `,
      [
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        limit,
        offset,
      ],
    );

    const [totalResult]: any = await pool.query(
      `
      SELECT COUNT(*) AS total FROM suppliers
      ${filterQuery}
      `,
      [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`],
    );

    res.status(200).json({
      data: suppliers,
      total: totalResult[0].total,
      page,
      limit,
    });
  } catch (error) {
    console.log("GET SUPPLIERS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSupplier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { supplierId } = req.params;

    const [supplier]: any = await pool.query(
      `SELECT * FROM suppliers WHERE supplierId=? AND status='Active'`,
      [supplierId],
    );

    if (supplier.length === 0)
      res.status(404).json({ message: "Supplier not found" });

    res.status(200).json(supplier[0]);
  } catch (error) {
    console.log("GET SUPPLIER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSupplier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { supplierId } = req.params;

    await pool.query(
      `UPDATE suppliers SET status='Deleted' WHERE supplierId=?`,
      [supplierId],
    );

    res.status(200).json({ message: "Supplier deleted successfully" });
  } catch (error) {
    console.log("DELETE SUPPLIER ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};
