import { User } from "../models/user.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }
  //upload them to cloudinary,avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverimage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  //create user object-create entry in db
  const user = await User.create({
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
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
