import express from "express";
import { uploadFile } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", upload.single("file"), uploadFile);

export default router;
