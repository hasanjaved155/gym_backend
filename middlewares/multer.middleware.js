import multer from "multer";
import fs from "fs";
import path from "path";

console.log("✅ MULTER MIDDLEWARE LOADING...");

const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
  console.log("📁 Created temp directory:", tempDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("✅ MULTER DESTINATION CALLED - fieldname:", file.fieldname);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + "-" + file.originalname;
    console.log("✅ MULTER FILENAME CALLED -", filename);
    cb(null, filename);
  },
});

export const upload = multer({ storage });

console.log("✅ MULTER MIDDLEWARE LOADED - upload exported");

// import multer from "multer";

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "./public/temp");
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   },
// });

// export const upload = multer({
//   storage,
// });
