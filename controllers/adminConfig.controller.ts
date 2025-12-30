import { Request, Response } from "express";
import pool from "../database/db";

interface ConfigTime {
  id?: number;
  configureType: string;
  configureTime: string;
}

export const getAllConfigTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM configuretime ORDER BY id ASC"
    );

    res.json(rows);
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
    return;
  }
};

export const addConfigTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { configureType, configureTime } = req.body as ConfigTime;

    if (!configureType || !configureTime) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    const [result] = await pool.query(
      "INSERT INTO configuretime (configureType, configureTime) VALUES (?, ?)",
      [configureType, configureTime]
    );

    res.status(201).json({
      message: "Config Time added",
      id: (result as any).insertId,
    });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
    return;
  }
};

export const updateConfigTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { configureType, configureTime } = req.body as ConfigTime;

    if (!configureType || !configureTime) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    await pool.query(
      "UPDATE configuretime SET configureType = ?, configureTime = ? WHERE id = ?",
      [configureType, configureTime, id]
    );

    res.json({ message: "Config Time updated" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
    return;
  }
};

export const deleteConfigTime = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM configuretime WHERE id = ?", [id]);

    res.json({ message: "Config Time deleted" });
    return;
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
    return;
  }
};
