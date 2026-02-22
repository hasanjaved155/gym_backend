import { Router } from "express";
import {
  createFeedback,
  deleteFeedback,
  getFeedbacks,
  updateFeedback,
} from "../controllers/feedback.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router();

router.post("/give-feedback", verifyJWT, createFeedback);

router.get("/get-feedbacks", getFeedbacks);

router.delete("/delete-feedback/:id", verifyJWT, deleteFeedback);

router.patch("/update-feedback/:id", verifyJWT, updateFeedback);

export default router;
