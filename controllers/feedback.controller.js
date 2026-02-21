import { Review } from "../models/review.models.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const createFeedback = asyncHandler(async (req, res) => {
  const { rating, feedback } = req.body;
  if (!rating && !feedback) {
    throw new ApiError(400, "Rating and feedback are required");
  }
  const userId = req.user._id;
  const review = await Review.create({
    rating,
    feedback,
    user: userId,
  });
  res
    .status(201)
    .send(new ApiResponse(201, review, "Feedback submitted successfully"));
});

export const getFeedbacks = asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate("user", "username").sort({
    createdAt: -1,
  });
  res
    .status(200)
    .send(new ApiResponse(200, reviews, "Feedbacks retrieved successfully"));
});
