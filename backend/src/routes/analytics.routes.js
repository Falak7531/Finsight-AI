import { Router } from "express";
import { getAnalyticsReport } from "../controllers/analytics.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);
router.get("/summary", getAnalyticsReport);

export default router;
