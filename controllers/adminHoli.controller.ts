import { Request, Response } from "express";
import pool from "../database/db";

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const { holiday, date } = req.body;

    const query = `
      SELECT id, holiday, date, holidayStatus
      FROM holidays
      WHERE holidayStatus = 'Y'
      ORDER BY date ASC
    `;

    const [rows] = await pool.query(query, [holiday, date]);
    res.status(200).json(rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

export const addHoliday = async (req: Request, res: Response) => {
  try {
    const { holiday, date } = req.body;

    await pool.query(
      `INSERT INTO holidays (holiday, date, holidayStatus)
       VALUES (?, ?, 'Y')`,
      [holiday, date]
    );

    res.status(201).json({ message: "Holiday added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to add holiday" });
  }
};

export const updateHoliday = async (req: Request, res: Response) => {
  try {
    const { holiday, date } = req.body;
    const holidayId = req.params.id;

    await pool.query(`UPDATE holidays SET holiday = ?, date = ? WHERE id = ?`, [
      holiday,
      date,
      holidayId,
    ]);

    res.status(200).json({ message: "Holiday updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update holiday" });
  }
};

export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const holidayId = req.params.id;

    const query = `
      DELETE FROM holidays
      WHERE id = ?
    `;

    await pool.query(query, [holidayId]);

    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete holiday" });
  }
};
