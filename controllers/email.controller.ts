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
          const value =
            typeof col.key === "function"
              ? col.key(row, i)
              : (row[col.key as keyof T] as any);

          return `<td style="border: 1px solid #ddd; padding: 8px;">${value ?? ""}</td>`;
        })
        .join("");

      // REMOVED the extra <td>${i + 1}</td> here
      return `<tr>${cells}</tr>`;
    })
    .join("");
}

export const sendSalesReportEmail = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, reportData, business } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const columns = [
      { label: "Sr#", key: (_: any, i: number) => String(i + 1) }, // Keep this
      { label: "Customer", key: "customerName" },
      { label: "Project", key: "projectName" },
      { label: "Date", key: "saleDate" },
    ];

    const rowsHtml = buildTableRows(reportData, columns);

    const fullHtml = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f4f4f4; border: 1px solid #ddd; padding: 12px; text-align: left; }
          td { border: 1px solid #ddd; padding: 8px; }
          .header { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${business?.name || "Sales Report"}</h2>
          <p>${business?.email || ""} | ${business?.contact || ""}</p>
        </div>
        <h3>Sales Report</h3>
        <table>
          <thead>
            <tr>
              ${columns.map((c) => `<th>${c.label}</th>`).join("")}
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
      subject: `Sales Report - ${new Date().toLocaleDateString()}`,
      html: `<p>Please find the requested sales report attached as a PDF.</p>`,
      attachments: [
        {
          filename: "sales_report.pdf",
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
