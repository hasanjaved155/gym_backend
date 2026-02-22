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
  const existingReview = await Review.findOne({ user: userId });
  if (existingReview) {
    throw new ApiError(
      400,
      "You have already submitted feedback and can update it instead",
    );
  }

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
  const reviews = await Review.find().populate("user", "username avatar").sort({
    createdAt: -1,
  });
  res
    .status(200)
    .send(new ApiResponse(200, reviews, "Feedbacks retrieved successfully"));
});

export const deleteFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Pehle check karo ki review exist karta hai
  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Feedback not found");
  }

  // Phir delete karo
  await Review.findByIdAndDelete(id);

  res
    .status(200)
    .send(new ApiResponse(200, {}, "Feedback deleted successfully"));
});

export const updateFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, feedback } = req.body;
  const review = await Review.findById(id);
  if (!review) {
    throw new ApiError(404, "Feedback not found");
  }
  const updatedReview = await Review.findByIdAndUpdate(
    id,
    {
      rating: rating || review.rating, // agar rating nahi de rahe to purana rakh do
      feedback: feedback || review.feedback,
    },
    {
      new: true,
      runValidators: true,
    }, // runValidators schema validators chalate hain
  );
  res
    .status(200)
    .send(new ApiResponse(200, updatedReview, "Feedback updated successfully"));
});
