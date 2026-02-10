import { Request, Response } from "express";

import pool from "../database/db";

export const getHolidays = async (req: Request, res: Response) => {
  try {
    const query = `

      SELECT id, holiday, fromDate, toDate, holidayStatus

      FROM holidays

      WHERE holidayStatus = 'Y'

      ORDER BY fromDate ASC

    `;

    const [rows] = await pool.query(query);

    res.status(200).json(rows);
  } catch (error) {
    console.error("Fetch Error:", error);

    res.status(500).json({ message: "Failed to fetch holidays" });
  }
};

export const addHoliday = async (
  req: Request,

  res: Response,
): Promise<void> => {
  try {
    const { holiday, fromDate, toDate } = req.body;

    if (!holiday || !fromDate || !toDate) {
      res.status(400).json({ message: "All fields are required" });
    }

    const holidayNameRegex = /^[a-zA-Z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;

    if (!holidayNameRegex.test(holiday)) {
      res.status(400).json({
        message:
          "Invalid holiday name. Numbers and alphanumeric characters are not allowed.",
      });

      return;
    }

    if (holiday.length > 30) {
      res
        .status(400)
        .json({ message: "Holiday name cannot exceed 30 characters" });

      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      res
        .status(400)
        .json({ message: "From Date cannot be greater than To Date" });

      return;
    }

const [existing]: any = await pool.query(
  `
    SELECT id 
    FROM holidays 
    WHERE LOWER(holiday) = LOWER(?)
      AND fromDate = ?
      AND toDate = ?
      AND holidayStatus = 'Y'
  `,
  [holiday.trim(), fromDate, toDate]
);

if (existing.length > 0) {
  res.status(409).json({
    message: "Holiday with the same name and same dates already exists",
  });
  return;
}


    await pool.query(
      `INSERT INTO holidays (holiday, fromDate, toDate, holidayStatus)

       VALUES (?, ?, ?, 'Y')`,

      [holiday, fromDate, toDate],
    );

    res.status(201).json({ message: "Holiday added successfully" });
  } catch (error) {
    console.error("Add Error:", error);

    res.status(500).json({ message: "Failed to add holiday" });
  }
};

export const updateHoliday = async (
  req: Request,

  res: Response,
): Promise<void> => {
  try {
    const { holiday, fromDate, toDate } = req.body;

    const holidayId = req.params.id;

    const holidayNameRegex = /^[a-zA-Z\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/;

    if (!holidayNameRegex.test(holiday)) {
      res.status(400).json({
        message:
          "Invalid holiday name. Numbers and alphanumeric characters are not allowed.",
      });

      return;
    }

    if (holiday.length > 30) {
      res
        .status(400)
        .json({ message: "Holiday name cannot exceed 30 characters" });

      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      res
        .status(400)
        .json({ message: "From Date cannot be greater than To Date" });

      return;
    }

const [existing]: any = await pool.query(
  `
    SELECT id
    FROM holidays
    WHERE LOWER(holiday) = LOWER(?)
      AND fromDate = ?
      AND toDate = ?
      AND id <> ?
      AND holidayStatus = 'Y'
  `,
  [holiday.trim(), fromDate, toDate, holidayId]
);

if (existing.length > 0) {
  res.status(409).json({
    message:
      "Another holiday with the same name and same dates already exists",
  });
  return;
}


    const [result]: any = await pool.query(
      `UPDATE holidays SET holiday = ?, fromDate = ?, toDate = ? WHERE id = ?`,

      [holiday, fromDate, toDate, holidayId],
    );

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Holiday not found" });
    }

    res.status(200).json({ message: "Holiday updated successfully" });
  } catch (error) {
    console.error("Update Error:", error);

    res.status(500).json({ message: "Failed to update holiday" });
  }
};

export const deleteHoliday = async (
  req: Request,

  res: Response,
): Promise<void> => {
  try {
    const holidayId = req.params.id;

    const query = `DELETE FROM holidays WHERE id = ?`;

    const [result]: any = await pool.query(query, [holidayId]);

    if (result.affectedRows === 0) {
      res.status(404).json({ message: "Holiday not found" });
    }

    res.status(200).json({ message: "Holiday deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error);

    res.status(500).json({ message: "Failed to delete holiday" });
  }
};
