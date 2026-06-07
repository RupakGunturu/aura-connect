import multer from "multer";

const fileFilter = (_req, file, cb) => {
  const allowedMime = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/zip",
    "text/plain",
    "application/octet-stream",
  ];
  if (allowedMime.includes(file.mimetype) || file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("File type not allowed"), false);
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});
