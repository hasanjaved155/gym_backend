import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { sendEmail } from "./sendEmail.js";

export const sendExpirationEmail = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const expirationDate = new Date(user.expirationDate).toLocaleDateString();
    const daysLeft = Math.ceil(
      (new Date(user.expirationDate) - new Date()) / (1000 * 60 * 60 * 24),
    );

    // ✅ Email message
    const message = `👋 Hello ${user.username}!
Your subscription is expiring soon! ⏳

🗓️ Expiration Date: ${expirationDate}
Days Remaining: ${daysLeft} days

Please renew your membership to continue enjoying our services. 💪

Thank you! 🙏

----------------------------------------

नमस्ते ${user.username}!
आपकी सदस्यता जल्द ही समाप्त हो रही है! ⏳

🗓️ समाप्ति तिथि: ${expirationDate}
शेष दिन: ${daysLeft} दिन

हमारी सेवाओं का आनंद जारी रखने के लिए कृपया अपनी सदस्यता नवीनीकृत करें। 💪

धन्यवाद! 🙏

---
This is an automated message. Please do not reply.
यह एक स्वचालित संदेश है। कृपया जवाब न दें।`;

    // ✅ Send email using your sendEmail function
    await sendEmail({
      email: user.email,
      subject: `⏳ Subscription Expiry Reminder | सदस्यता समाप्ति अनुस्मारक`,
      message,
    });

    console.log(`Email sent to ${user.email}`);

    return res
      .status(200)
      .send(
        new ApiResponse(
          200,
          { email: user.email },
          "Expiration notice email sent successfully",
        ),
      );
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new ApiError(500, "Failed to send expiration email");
  }
});
