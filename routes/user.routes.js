import { Router } from "express";
const router = Router();
import {
  forgotPassword,
  getAllUserStatus,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  updateUserProfile,
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

router.post("/refresh-access-token", refreshAccessToken);

router.get("/all-users", verifyJWT, getAllUserStatus);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:id/:token", resetPassword);

//update user profile route (not implemented yet)
router.patch(
  "/update-profile",
  verifyJWT,
  upload.single("avatar"),
  updateUserProfile,
);

export default router;
