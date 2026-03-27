import { Request, Response } from "express";
import resend from "../utils/resend";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

type Column<T> = {
  label: string;
  key: keyof T | ((row: T, index: number) => string);
};

function buildTableRows<T>(data: T[], columns: Column<T>[]): string {
  return data
    .map((row, i) => {
      const cells = columns
        .map((col) => {
          let value;

          if (col.key === "__index") {
            value = i + 1;
          } else if (typeof col.key === "function") {
            value = col.key(row, i);
          } else {
            value = row[col.key as keyof T] as any;
          }

          return `<td style="border:1px solid #ddd;padding:8px;">${value ?? ""}</td>`;
        })
        .join("");

      return `<tr>${cells}</tr>`;
    })
    .join("");
}

export const sendReportEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, reportData, business, columns } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    if (!columns || columns.length === 0) {
      res.status(400).json({ message: "Columns are required" });
      return;
    }

    const rowsHtml = buildTableRows(reportData, columns);

    const fullHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 40px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h2>${business?.name || "Report"}</h2>

          <table>
            <thead>
              <tr>
                ${columns.map((c: any) => `<th>${c.label}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;
    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: "networkidle0" });
    const pdfUint8 = await page.pdf({ format: "A4", printBackground: true });
    const pdfBuffer = Buffer.from(pdfUint8);
    await browser.close();

    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL!,
      to: email,
      subject: `Report - ${new Date().toLocaleDateString()}`,
      html: `<p>Please find the requested report attached as a PDF.</p>`,
      attachments: [
        {
          filename: "report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    if (response.error) {
      res.status(400).json({ error: response.error });
      return;
    }

    res.status(200).json({ message: "Email with PDF sent successfully" });
  } catch (error) {
    console.error("PDF Email Error:", error);
    res.status(500).json({ message: "Failed to generate or send PDF" });
  }
};
