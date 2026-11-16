import { Router } from "express";
import { uploadFile } from "../controllers/upload.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);
router.post("/", uploadFile);

export default router;
