import { Router } from "express";
const router = Router();
import {
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
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

export default router;
