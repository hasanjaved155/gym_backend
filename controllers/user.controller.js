import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import { sendEmail } from "./sendEmail.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const newRefreshToken = await user.generateRefreshToken();

    user.refreshToken = newRefreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, newRefreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens",
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { username, email, joinDate, password } = req.body;

  //validation - not empty
  if (
    [username, email, joinDate, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Fielda are required");
  }

  //check if user already exists:username,email
  // const existingUser = await User.findOne({
  //   $or: [{ username }, { email }],
  // });

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User already exist");
  }

  //check for images,check for avatar
  const avatarLocalPath = req.file?.path;
  // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  console.log("path", avatarLocalPath);

  console.log("req.file", req.file);
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload them to cloudinary,avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  console.log("avatar", avatar);
  if (!avatar) {
    throw new ApiError(400, "Cloudinary Avatar file is required");
  }

  //create user object-create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    avatar: avatar.url,
    // coverImage: coverImage?.url || "",
    email,
    password,
    joinDate,
  });

  //remove password and refresh token field from response
  const newUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  //check for user creation
  if (!newUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  //return res

  res
    .status(201)
    .send(new ApiResponse(201, newUser, "User registered successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "Email id is not registered");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw ApiError(401, "User Password is Incorrect");
  }

  const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .send(
      new ApiResponse(
        200,
        {
          user: createdUser,
          accessToken,
          newRefreshToken,
        },
        "User Logged in successfully",
      ),
    );
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  console.log("email", email);

  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "Email id is not registered");
  }

  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and save to database
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire time (10 minutes)
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CORS_ORIGIN || "http://localhost:5173"}/reset-password/${user._id}/${resetToken}`;

  const message = `You have requested a password reset. Please go to this link to reset your password: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Password Reset Request",
      message,
    });

    res.status(200).send(new ApiResponse(200, {}, "Email sent successfully"));
  } catch (error) {
    console.log("Error sending email:", error);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(500, "Email could not be sent");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    _id: id,
  });
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.status(200).send(new ApiResponse(200, {}, "Password reset successfully"));
});

export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    },
  );

  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .send(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

export const getAllUserStatus = asyncHandler(async (req, res) => {
  const users = await User.find()
    .sort({ joinDate: -1 })
    .select("-password -refreshToken");
  return res.status(200).send(
    new ApiResponse(
      200,
      {
        users,
      },
      "Users fetched successfully",
    ),
  );
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.body?.refreshToken;
  // console.log("incomingRefreshToken", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );

    const user = await User.findById(decodedToken?._id);
    if (!user || user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    // console.log("user", user);

    const newUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );
    // console.log("newUser", newUser);

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // console.log("accessToken", accessToken);
    // console.log("newRefreshToken", newRefreshToken);

    const options = {
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .send(
        new ApiResponse(
          200,
          {
            newUser,
            accessToken,
            // refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    console.log("error", error.message);
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, phonenumber, email } = req.body;
  const avatarLocalPath = req.file?.path;

  if ([username, phonenumber].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "Username and phonenumber cannot be empty");
  }

  const user = await User.findOne({ email });

  if (username) {
    user.username = username;
  }

  if (phonenumber) {
    user.phonenumber = phonenumber;
  }

  if (avatarLocalPath) {
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (avatar?.url) {
      user.avatar = avatar.url;
    }
  }

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .send(new ApiResponse(200, user, "Profile updated successfully"));
});
