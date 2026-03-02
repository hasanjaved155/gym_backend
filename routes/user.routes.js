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
  updateUserAccount,
  updateUserProfile,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { sendExpirationEmail } from "../controllers/expiration-email.controller.js";

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

router.post("/send-expiration-email", sendExpirationEmail);

router.patch("/update-account/:id", updateUserAccount);

export default router;
