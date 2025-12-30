import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = "uploads/images/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s/g, "_"));
  },
});

export const upload = multer({ storage });
