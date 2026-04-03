import { Request, Response } from "express";
import pool from "../database/db";

export const getRoles = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, roleName FROM roles  ORDER BY id ASC",
    );
    res.json({ roles: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
};

export const addRole = async (req: Request, res: Response): Promise<void> => {
  const { roleName } = req.body as { roleName: string };
  if (!roleName) {
    res.status(400).json({ message: "Role name required" });
    return;
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO roles (roleName) VALUES (?)",
      [roleName],
    );
    res.status(201).json({
      message: "Role added successfully",
      id: (result as any).insertId,
    });
  } catch (err: any) {
    console.error(err);
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "Role already exists" });
      return;
    }
    res.status(500).json({ message: "Failed to add role" });
  }
};

// export const updateRole = async (
//   req: Request,
//   res: Response,
// ): Promise<void> => {
//   const { id } = req.params;
//   const { roleName } = req.body as { roleName: string };
//   if (!roleName) {
//     res.status(400).json({ message: "Role name required" });
//     return;
//   }

//   try {
//     const [result] = await pool.query(
//       "UPDATE roles SET roleName = ? WHERE id = ? AND is_deleted = FALSE",
//       [roleName, id],
//     );
//     res.json({ message: "Role updated successfully" });
//   } catch (err: any) {
//     console.error(err);
//     if (err.code === "ER_DUP_ENTRY") {
//       res.status(400).json({ message: "Role name already exists" });
//       return;
//     }
//     res.status(500).json({ message: "Failed to update role" });
//   }
// };

// export const deleteRole = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   try {
//     await pool.query("DELETE FROM roles WHERE id = ?", [id]);
//     res.json({ message: "Role deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to delete role" });
//   }
// };
