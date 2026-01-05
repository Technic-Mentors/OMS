import express, { Application, Request, Response } from "express";
import path from "path";

import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import fileUpload from "express-fileupload";
import loginRoutes from "./routes/login.routes";
import adminUserRoutes from "./routes/adminUser.routes";
import adminempllRoutes from "./routes/adminempll.routes";
import admincstmrRoutes from "./routes/admincstmr.routes";
import adminSuppRoutes from "./routes/adminSupp.routes";
import adminConfigRoutes from "./routes/adminConfig.routes";
import attendanceRoutes from "./routes/adminAtndnc.routes";
import userattendanceRoutes from "./routes/userAtndnc.routes";
import adminleaveRoutes from "./routes/adminLeave.routes";
import adminHoliRoutes from "./routes/adminHoli.routes";
import empwithdrawRoutes from "./routes/empwithdraw.routes";
import procatRoutes from "./routes/procat.routes";
import projectsRoutes from "./routes/projects.routes";
import asproRoutes from "./routes/aspro.routes";
import admintodoRoutes from "./routes/admintodo.routes";
import adminprogressRoutes from "./routes/adminprogress.routes";
import adminexpcatRoutes from "./routes/adminexpcat.routes";
import adminexpRoutes from "./routes/adminexp.routes";
import astcatRoutes from "./routes/astcat.routes";
import assetRoutes from "./routes/asset.routes";
import jobRoutes from "./routes/job.routes";
import applicantRoutes from "./routes/applicant.routes";
import saleRoutes from "./routes/sale.routes";
import paymentRoutes from "./routes/payment.routes";
import quotationRoutes from "./routes/quotation.routes";
import calendarRoutes from "./routes/calendar.routes";
import configsalRoutes from "./routes/configsal.routes";
import empaccountRoutes from "./routes/empaccount.routes";



import session from "express-session";

const app: Application = express();
const PORT: number = 3001;

dotenv.config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(bodyParser.json());
app.use(fileUpload());
app.use("/uploads", express.static("uploads"));

app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(express.static(path.join(__dirname, "dist")));

app.use("/api", loginRoutes);
app.use("/api/admin", adminUserRoutes);
app.use("/api/admin", adminempllRoutes);
app.use("/api/admin", admincstmrRoutes);
app.use("/api/admin", adminSuppRoutes);
app.use("/api/admin", adminConfigRoutes);
app.use("/api/admin", attendanceRoutes);
app.use("/api", userattendanceRoutes);
app.use("/api", adminleaveRoutes);
app.use("/api/admin", adminHoliRoutes);
app.use("/api/admin", empwithdrawRoutes);
app.use("/api/admin", procatRoutes);
app.use("/api/admin", projectsRoutes);
app.use("/api", asproRoutes);
app.use("/api", admintodoRoutes);
app.use("/api", adminprogressRoutes);
app.use("/api/admin", adminexpcatRoutes);
app.use("/api/admin", adminexpRoutes);
app.use("/api/admin", astcatRoutes);
app.use("/api/admin", assetRoutes);
app.use("/api/admin", jobRoutes);
app.use("/api/admin", applicantRoutes);
app.use("/api/admin", saleRoutes);
app.use("/api/admin", paymentRoutes);
app.use("/api/admin", quotationRoutes);
app.use("/api/admin", calendarRoutes);
app.use("/api/admin", configsalRoutes);
app.use("/api/admin", empaccountRoutes);



app.get("/", (req: Request, res: Response) => {
  res.send("Backend is up and running 🚀");
});

app.listen(PORT, () => {
  console.log(` Backend is running on ${PORT}`);
});

export default app;
