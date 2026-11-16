import { Router } from "express";
import {
  createTransaction,
  getTransactions,
} from "../controllers/transaction.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.use(protect);
router.get("/", getTransactions);
router.post("/", createTransaction);

export default router;
