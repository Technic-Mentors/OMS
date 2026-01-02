import { Request, Response } from "express";
import pool from "../database/db";

interface CustomerBody {
  customerName: string;
  customerAddress: string;
  customerContact: string;
  companyName: string;
  companyAddress: string;
}

export const getAllCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM customers WHERE customerStatus = 'Y' ORDER BY id DESC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch customers" });
  }
};



export const addCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerAddress,
      customerContact,
      companyName,
      companyAddress,
    }: CustomerBody = req.body;

    if (!customerName || !customerAddress || !customerContact) {
      res.status(400).json({ message: "Name, address, and contact are required" });
    }

    const [existingCustomer]: any = await pool.query(
      "SELECT * FROM customers WHERE customerName=? AND customerContact=? AND customerStatus='Y'",
      [customerName, customerContact]
    );

    if (existingCustomer.length > 0) {
      res.status(409).json({ message: "Customer with this name and contact already exists" });
    }

    await pool.query(
      `INSERT INTO customers 
        (customerName, customerAddress, customerContact, companyName, companyAddress) 
       VALUES (?, ?, ?, ?, ?)`,
      [customerName, customerAddress, customerContact, companyName, companyAddress]
    );

    res.status(201).json({ message: "Customer added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to add customer" });
  }
};



export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.params.id;

    const {
      customerName,
      customerAddress,
      customerContact,
      companyName,
      companyAddress,
    }: CustomerBody = req.body;

    await pool.query(
      `UPDATE customers SET 
        customerName=?, 
        customerAddress=?, 
        customerContact=?, 
        companyName=?, 
        companyAddress=?
       WHERE id=?`,
      [
        customerName,
        customerAddress,
        customerContact,
        companyName,
        companyAddress,
        customerId,
      ]
    );

    res.status(200).json({ message: "Customer updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update customer" });
  }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.params.id;

    await pool.query(
      "UPDATE customers SET customerStatus='N' WHERE id=?",
      [customerId]
    );

    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete customer" });
  }
};

export const getSingleCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    const customerId = req.params.id;

    const [rows]: any = await pool.query("SELECT * FROM customers WHERE id=?", [
      customerId,
    ]);

    if (rows.length === 0) {
      res.status(404).json({ message: "Customer not found" });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch customer" });
  }
};
