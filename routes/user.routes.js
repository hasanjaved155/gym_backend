import { Router } from "express";
const router = Router();
import {
  forgotPassword,
  getUserStatus,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

router.post(
  "/register",
  upload.single("avatar"),

  registerUser,
);

router.post("/login", loginUser);

router.post("/logout", verifyJWT, logoutUser);

router.post("/RefreshAccessToken", refreshAccessToken);

router.get("/auth-status", verifyJWT, getUserStatus);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:id/:token", resetPassword);

export default router;
