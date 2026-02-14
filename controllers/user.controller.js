import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens",
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  const { username, email, phonenumber, password } = req.body;

  //validation - not empty
  if (
    [username, email, phonenumber, password].some(
      (field) => field?.trim() === "",
    )
  ) {
    throw new ApiError(400, "All Fielda are required");
  }

  //check if user already exists:username,email
  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

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
    phonenumber,
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
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Either username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "Emsil id is not registered");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw ApiError(401, "User Password is Incorrect");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id,
  );

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .send(
      new ApiResponse(
        200,
        {
          user: createdUser,
          accessToken,
          refreshToken,
        },
        "User Logged in successfully",
      ),
    );
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
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .send(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "") ||
    req.body?.refreshToken;

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

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .send(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
