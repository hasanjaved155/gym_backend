import { Router } from "express";
import {
  createFeedback,
  getFeedbacks,
} from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.post("/give-feedback", verifyJWT, createFeedback);

router.get("/get-feedbacks", getFeedbacks);

export default router;
