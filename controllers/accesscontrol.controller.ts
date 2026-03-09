import { Request, Response } from "express";
import pool from "../database/db";

export const getRoles = async (req: Request, res: Response) => {
  try {
    const [roles] = await pool.query("SELECT id, roleName FROM roles");
    res.status(200).json({ roles });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAccessControl = async (req: Request, res: Response) => {
  const { roleId } = req.params;
  try {
    const query = `
      SELECT ac.moduleId, m.moduleName, ac.status 
      FROM access_control ac
      JOIN modules m ON ac.moduleId = m.id
      WHERE ac.roleId = ?`;

    const [permissions] = await pool.query(query, [roleId]);
    res.status(200).json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    res.status(500).json({ message: "Error fetching permissions" });
  }
};

export const addAccessControl = async (req: Request, res: Response) => {
  const { roleId, permissions } = req.body;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM access_control WHERE roleId = ?", [
      roleId,
    ]);

    for (const [moduleName, status] of Object.entries(permissions)) {
      if (status) { 
        const [moduleRows]: any = await connection.query(
          "SELECT id FROM modules WHERE moduleName = ?",
          [moduleName],
        );

        if (moduleRows.length > 0) {
          await connection.query(
            "INSERT INTO access_control (roleId, moduleId, status) VALUES (?, ?, ?)",
            [roleId, moduleRows[0].id, status],
          );
        }
      }
    }

    await connection.commit();
    res.status(200).json({ message: "Permissions updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Add Error:", error);
    res.status(500).json({ message: "Failed to update permissions" });
  } finally {
    connection.release();
  }
};

export const updateAccessControl = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { roleId, permissions } = req.body;

  if (!roleId || !permissions) {
    res.status(400).json({ message: "Missing roleId or permissions" });
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query("DELETE FROM access_control WHERE roleId = ?", [
      roleId,
    ]);

    const [moduleRows]: any = await connection.query(
      "SELECT id, moduleName FROM modules",
    );
    const moduleMap = new Map(moduleRows.map((m: any) => [m.moduleName, m.id]));

    const values: any[] = [];
    for (const [moduleName, status] of Object.entries(permissions)) {
      const moduleId = moduleMap.get(moduleName);
      if (status && moduleId) { 
        values.push([roleId, moduleId, status]);
      }
    }

    if (values.length > 0) {
      await connection.query(
        "INSERT INTO access_control (roleId, moduleId, status) VALUES ?",
        [values],
      );
    }

    await connection.commit();
    res.status(200).json({ message: "Access control updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update Error:", error);
    res.status(500).json({ message: "Failed to update access control" });
  } finally {
    connection.release();
  }
};